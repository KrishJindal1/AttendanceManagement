package net.attendance.AttendanceManagementapp.services;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import net.attendance.AttendanceManagementapp.model.*;
import net.attendance.AttendanceManagementapp.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final StudentRepository studentRepo;
    private final AttendanceRecordRepository attendanceRepo;
    private final UploadDetailRepository uploadRepo;
    private final AttendanceDayRepository attendanceDayRepo;

    public AttendanceService(StudentRepository studentRepo,
                              AttendanceRecordRepository attendanceRepo,
                              UploadDetailRepository uploadRepo,
                              AttendanceDayRepository attendanceDayRepo) {
        this.studentRepo = studentRepo;
        this.attendanceRepo = attendanceRepo;
        this.uploadRepo = uploadRepo;
        this.attendanceDayRepo = attendanceDayRepo;
    }

    private static final DataFormatter CELL_FORMATTER = new DataFormatter();

    /** Reads display text for any cell type so status is not mis-read as "0.0" from numeric cells. */
    private static String formatCell(Cell cell) {
        if (cell == null) {
            return "";
        }
        return CELL_FORMATTER.formatCellValue(cell).trim();
    }

    public void persistAttendanceRow(String name, String rollNumber, String className, String status, LocalDate date) {
        if (name == null || name.isBlank()) {
            name = "Unknown";
        }
        if (rollNumber == null || rollNumber.isBlank()) {
            rollNumber = "Unknown";
        }
        if (className == null || className.isBlank()) {
            className = "N/A";
        }
        if (status == null || status.isBlank()) {
            status = "Absent";
        }

        Student student = studentRepo.findByRollNumber(rollNumber)
                .orElse(new Student());
        student.setName(name.trim());
        student.setRollNumber(rollNumber.trim());
        student.setClassName(className.trim());
        student = studentRepo.save(student);

        Optional<AttendanceRecord> existing = attendanceRepo.findByStudentAndAttendanceDate(student, date);
        AttendanceRecord record = existing.orElse(new AttendanceRecord());
        record.setStudent(student);
        record.setAttendanceDate(date);
        record.setStatus(status);
        attendanceRepo.save(record);
    }

    public void processExcel(MultipartFile file) throws Exception {
        Workbook workbook = WorkbookFactory.create(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        // Optimized strategy:
        // - Keep 1 row per class+date in `attendance_days`.
        // - Store ONLY Absent students in `attendance_records` (Present is implied).
        int recordsProcessed = 0;

        class GroupInfo {
            String className;
            LocalDate date;
            Set<String> explicitPresentRolls = new HashSet<>();
            Set<String> explicitAbsentRolls = new HashSet<>();
        }

        Map<String, GroupInfo> groupByClassDate = new HashMap<>();
        Map<String, Map<String, Student>> rosterCacheByClass = new HashMap<>();

        for (Row row : sheet) {
            if (row.getRowNum() == 0) continue; // Skip header

            String name = formatCell(row.getCell(0));
            if (name.isEmpty()) name = "Unknown";
            String rollNumber = formatCell(row.getCell(1));
            if (rollNumber.isEmpty()) rollNumber = "Unknown";
            String className = formatCell(row.getCell(2));
            if (className.isEmpty()) className = "N/A";
            String status = formatCell(row.getCell(3));

            LocalDate date = LocalDate.now();
            Cell dateCell = row.getCell(4);
            if (dateCell != null) {
                try {
                    if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                        date = dateCell.getLocalDateTimeCellValue().toLocalDate();
                    } else {
                        date = LocalDate.parse(formatCell(dateCell));
                    }
                } catch (Exception e) {
                    System.out.println("Invalid date in Excel, using today.");
                }
            }

            // Persist/update student info from the Excel row.
            Student student = studentRepo.findByRollNumber(rollNumber).orElse(new Student());
            student.setName(name.trim());
            student.setRollNumber(rollNumber.trim());
            student.setClassName(className.trim());
            student = studentRepo.save(student);

            recordsProcessed++;

            String normalizedClass = className.trim();
            String groupKey = normalizedClass.toLowerCase(Locale.ROOT) + "|" + date.toString();
            final LocalDate dateForGroup = date;

            GroupInfo info = groupByClassDate.computeIfAbsent(groupKey, k -> {
                GroupInfo gi = new GroupInfo();
                gi.className = normalizedClass;
                gi.date = dateForGroup;
                return gi;
            });

            String normalizedRoll = rollNumber.trim();

            // Track ONLY explicit status when the cell is non-empty.
            if (status != null && !status.isBlank()) {
                boolean isPresent = isPresentStatus(status);
                if (isPresent) {
                    info.explicitPresentRolls.add(normalizedRoll);
                } else {
                    info.explicitAbsentRolls.add(normalizedRoll);
                }
            }
        }

        // Apply per-class-per-day computed absent set.
        for (GroupInfo info : groupByClassDate.values()) {
            String className = info.className;
            LocalDate date = info.date;

            // Ensure attendance_days row exists even if absent set is empty.
            AttendanceDay attendanceDay = attendanceDayRepo
                    .findByClassNameIgnoreCaseAndAttendanceDate(className, date)
                    .orElseGet(() -> {
                        AttendanceDay d = new AttendanceDay();
                        d.setClassName(className);
                        d.setAttendanceDate(date);
                        return d;
                    });
            attendanceDayRepo.save(attendanceDay);

            // Roster lookup: rollNumber -> Student.
            Map<String, Student> rosterByRoll = rosterCacheByClass.get(className.toLowerCase(Locale.ROOT));
            if (rosterByRoll == null) {
                rosterByRoll = studentRepo.findByClassNameIgnoreCase(className).stream()
                        .filter(s -> s.getRollNumber() != null)
                        .collect(Collectors.toMap(s -> s.getRollNumber().trim(), s -> s, (a, b) -> a));
                rosterCacheByClass.put(className.toLowerCase(Locale.ROOT), rosterByRoll);
            }

            Set<String> rosterRolls = rosterByRoll.keySet();
            boolean hasPresent = !info.explicitPresentRolls.isEmpty();
            boolean hasAbsent = !info.explicitAbsentRolls.isEmpty();

            Set<String> finalAbsentRolls = new HashSet<>();
            if (hasPresent && !hasAbsent) {
                // Only Present written -> everyone else is Absent.
                finalAbsentRolls.addAll(rosterRolls);
                finalAbsentRolls.removeAll(info.explicitPresentRolls);
            } else {
                // Only Absent OR mixed -> take Absent rows as-is.
                finalAbsentRolls.addAll(info.explicitAbsentRolls);
            }

            // Clear previous absent-only records for this class/date.
            List<Long> studentIds = rosterByRoll.values().stream().map(Student::getId).collect(Collectors.toList());
            if (!studentIds.isEmpty()) {
                attendanceRepo.deleteByAttendanceDateAndStudentIds(date, studentIds);
            }

            // Insert Absent rows only.
            for (String roll : finalAbsentRolls) {
                Student st = rosterByRoll.get(roll);
                if (st == null) continue;

                AttendanceRecord record = new AttendanceRecord();
                record.setStudent(st);
                record.setAttendanceDate(date);
                record.setStatus("Absent");
                attendanceRepo.save(record);
            }
        }

        finishUploadLog(file.getOriginalFilename(), recordsProcessed);
        workbook.close();
    }

    /**
     * Returns student attendance summaries with totals up to the selected date.
     * If selectedDate is null, totals are calculated for all available attendance_days.
     *
     * Daily status (attendanceRecords[selectedDate]) is included only when attendance
     * exists for that student's class on the selected date; otherwise it is omitted
     * so the UI can show "-" for that day.
     */
    public List<StudentAttendanceSummary> getStudentAttendanceSummaries(LocalDate selectedDate) {
        List<Student> students = studentRepo.findAll();

        boolean hasCutoff = selectedDate != null;

        List<AttendanceDay> attendanceDays = hasCutoff
                ? attendanceDayRepo.findByAttendanceDateLessThanEqual(selectedDate)
                : attendanceDayRepo.findAll();

        // totalDays by class (case-insensitive)
        Map<String, Integer> totalDaysByClass = new HashMap<>();
        // attendanceDays present on the exact selectedDate
        Set<String> classHasDayOnSelectedDate = new HashSet<>();
        for (AttendanceDay d : attendanceDays) {
            if (d.getClassName() == null) continue;
            String cnKey = d.getClassName().trim().toLowerCase(Locale.ROOT);
            totalDaysByClass.put(cnKey, totalDaysByClass.getOrDefault(cnKey, 0) + 1);
            if (hasCutoff && d.getAttendanceDate() != null && d.getAttendanceDate().equals(selectedDate)) {
                classHasDayOnSelectedDate.add(cnKey);
            }
        }

        // absentDays by student (case-sensitive roll, case-insensitive class)
        Map<String, Integer> absentDaysByStudentKey = new HashMap<>();
        // absent set for the exact selected date (only needed for daily status)
        Set<String> absentOnSelectedDate = new HashSet<>();

        List<AttendanceRecord> absentRecords = hasCutoff
                ? attendanceRepo.findAbsentRecordsUpTo("Absent", selectedDate)
                : attendanceRepo.findByStatusWithStudent("Absent");

        for (AttendanceRecord ar : absentRecords) {
            if (ar.getStudent() == null || ar.getStudent().getClassName() == null || ar.getStudent().getRollNumber() == null) {
                continue;
            }
            String cnKey = ar.getStudent().getClassName().trim().toLowerCase(Locale.ROOT);
            String rollKey = ar.getStudent().getRollNumber().trim();
            String studentKey = cnKey + "|" + rollKey;

            absentDaysByStudentKey.put(studentKey, absentDaysByStudentKey.getOrDefault(studentKey, 0) + 1);

            if (hasCutoff && ar.getAttendanceDate() != null && ar.getAttendanceDate().equals(selectedDate)) {
                absentOnSelectedDate.add(studentKey);
            }
        }

        String selectedDateKey = hasCutoff ? selectedDate.toString() : null;
        List<StudentAttendanceSummary> out = new ArrayList<>(students.size());

        for (Student s : students) {
            if (s.getRollNumber() == null) continue;

            String cnKey = s.getClassName() != null ? s.getClassName().trim().toLowerCase(Locale.ROOT) : "n/a";
            String roll = s.getRollNumber().trim();
            String studentKey = cnKey + "|" + roll;

            int totalDays = totalDaysByClass.getOrDefault(cnKey, 0);
            int absentDays = absentDaysByStudentKey.getOrDefault(studentKey, 0);
            int presentDays = totalDays - absentDays;
            int attendancePercentage = totalDays > 0
                    ? (int) Math.round((presentDays * 100.0) / totalDays)
                    : 0;

            StudentAttendanceSummary summary = new StudentAttendanceSummary();
            summary.setId(s.getId() != null ? String.valueOf(s.getId()) : null);
            summary.setName(s.getName());
            summary.setClassName(s.getClassName());
            summary.setRollNumber(s.getRollNumber());

            summary.setTotalDays(totalDays);
            summary.setPresentDays(presentDays);
            summary.setAbsentDays(absentDays);
            summary.setAttendancePercentage(attendancePercentage);

            if (hasCutoff && selectedDateKey != null && classHasDayOnSelectedDate.contains(cnKey)) {
                Map<String, String> daily = new HashMap<>();
                boolean isAbsent = absentOnSelectedDate.contains(studentKey);
                daily.put(selectedDateKey, isAbsent ? "Absent" : "Present");
                summary.setAttendanceRecords(daily);
            }

            out.add(summary);
        }

        return out;
    }

    /**
     * Builds an Excel report with one table per class (or a single table for one class).
     * Columns: Roll no., Name, Class, Days recorded, Present, Absent, Attendance %.
     */
    public byte[] buildAttendanceReportExcel(String scope, String classNameFilter) throws Exception {
        boolean singleClass = "single_class".equalsIgnoreCase(scope);
        if (singleClass && (classNameFilter == null || classNameFilter.isBlank())) {
            throw new IllegalArgumentException("className is required for single-class export");
        }

        List<StudentAttendanceSummary> students = getStudentAttendanceSummaries(null);
        if (singleClass) {
            String target = classNameFilter.trim();
            students = students.stream()
                    .filter(s -> target.equalsIgnoreCase(
                            s.getClassName() != null ? s.getClassName().trim() : ""))
                    .collect(Collectors.toList());
        }

        if (students.isEmpty()) {
            throw new IllegalStateException("No students found for this export.");
        }

        students.sort(Comparator
                .comparing((StudentAttendanceSummary s) -> s.getClassName() != null ? s.getClassName() : "")
                .thenComparing(s -> s.getRollNumber() != null ? s.getRollNumber() : ""));

        Map<String, List<StudentAttendanceSummary>> byClass = new LinkedHashMap<>();
        for (StudentAttendanceSummary s : students) {
            String cn = s.getClassName() != null && !s.getClassName().isBlank() ? s.getClassName() : "N/A";
            byClass.computeIfAbsent(cn, k -> new ArrayList<>()).add(s);
        }

        XSSFWorkbook workbook = new XSSFWorkbook();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);

        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        CellStyle bodyStyle = workbook.createCellStyle();
        bodyStyle.setAlignment(HorizontalAlignment.LEFT);

        int MAX_SHEET_NAME = 31;

        for (Map.Entry<String, List<StudentAttendanceSummary>> entry : byClass.entrySet()) {
            String classTitle = entry.getKey();
            List<StudentAttendanceSummary> classStudents = entry.getValue();
            classStudents.sort(Comparator.comparing(s -> s.getRollNumber() != null ? s.getRollNumber() : ""));

            String rawSheetName = singleClass ? "Attendance" : classTitle;
            String safeSheetName = rawSheetName
                    .replaceAll("[\\\\/?*\\[\\]:]", "_")
                    .trim();
            if (safeSheetName.isBlank()) safeSheetName = "Class";
            if (safeSheetName.length() > MAX_SHEET_NAME) safeSheetName = safeSheetName.substring(0, MAX_SHEET_NAME);

            XSSFSheet sheet = workbook.createSheet(safeSheetName);

            Row header = sheet.createRow(0);
            String[] cols = new String[]{
                    "Roll no.", "Name", "Class",
                    "Days recorded", "Present", "Absent",
                    "Attendance %"
            };

            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (StudentAttendanceSummary st : classStudents) {
                int total = st.getTotalDays();
                int present = st.getPresentDays();
                int absent = st.getAbsentDays();
                int pct = st.getAttendancePercentage();

                Row r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(st.getRollNumber() != null ? st.getRollNumber() : "");
                r.createCell(1).setCellValue(st.getName() != null ? st.getName() : "");
                r.createCell(2).setCellValue(st.getClassName() != null ? st.getClassName() : "");
                r.createCell(3).setCellValue(total);
                r.createCell(4).setCellValue(present);
                r.createCell(5).setCellValue(absent);
                r.createCell(6).setCellValue(pct + "%");

                // Apply a simple body style for all cells in the row.
                for (int c = 0; c < cols.length; c++) {
                    r.getCell(c).setCellStyle(bodyStyle);
                }
            }

            // Reasonable column widths (approx). Excel units are 1/256th of a character width.
            sheet.setColumnWidth(0, 3500);
            sheet.setColumnWidth(1, 7500);
            sheet.setColumnWidth(2, 5500);
            sheet.setColumnWidth(3, 3800);
            sheet.setColumnWidth(4, 3000);
            sheet.setColumnWidth(5, 3000);
            sheet.setColumnWidth(6, 4200);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    /**
     * Builds a PDF with one table per class (or a single table when exporting one class).
     *
     * @param scope           {@code all} or {@code single_class}
     * @param classNameFilter required when scope is {@code single_class}
     */
    public byte[] buildAttendanceReportPdf(String scope, String classNameFilter) throws Exception {
        boolean singleClass = "single_class".equalsIgnoreCase(scope);
        if (singleClass && (classNameFilter == null || classNameFilter.isBlank())) {
            throw new IllegalArgumentException("className is required for single-class export");
        }

        List<StudentAttendanceSummary> students = getStudentAttendanceSummaries(null);
        if (singleClass) {
            String target = classNameFilter.trim();
            students = students.stream()
                    .filter(s -> target.equalsIgnoreCase(
                            s.getClassName() != null ? s.getClassName().trim() : ""))
                    .collect(Collectors.toList());
        }

        if (students.isEmpty()) {
            throw new IllegalStateException("No students found for this export.");
        }

        students.sort(Comparator
                .comparing((StudentAttendanceSummary s) -> s.getClassName() != null ? s.getClassName() : "")
                .thenComparing(s -> s.getRollNumber() != null ? s.getRollNumber() : ""));

        Map<String, List<StudentAttendanceSummary>> byClass = new LinkedHashMap<>();
        for (StudentAttendanceSummary s : students) {
            String cn = s.getClassName() != null && !s.getClassName().isBlank() ? s.getClassName() : "N/A";
            byClass.computeIfAbsent(cn, k -> new ArrayList<>()).add(s);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 36, 36, 48, 36);
        PdfWriter.getInstance(document, out);
        document.open();

        document.add(new Paragraph(
                "Attendance report",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.BLACK)));
        document.add(new Paragraph(
                "Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm", Locale.UK)),
                FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY)));

        if (singleClass) {
            document.add(new Paragraph(
                    "Scope: Single class — " + classNameFilter.trim(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK)));
        } else {
            document.add(new Paragraph(
                    "Scope: All classes",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK)));
        }
        document.add(Chunk.NEWLINE);

        for (Map.Entry<String, List<StudentAttendanceSummary>> entry : byClass.entrySet()) {
            String classTitle = entry.getKey();
            List<StudentAttendanceSummary> classStudents = entry.getValue();
            classStudents.sort(Comparator.comparing(s -> s.getRollNumber() != null ? s.getRollNumber() : ""));

            document.add(new Paragraph(
                    "Class: " + classTitle,
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, Color.BLACK)));

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.1f, 2.2f, 1.2f, 1.3f, 1.1f, 1.1f, 1.2f});
            table.setSpacingAfter(16f);

            addHeaderCell(table, "Roll no.");
            addHeaderCell(table, "Name");
            addHeaderCell(table, "Class");
            addHeaderCell(table, "Days recorded");
            addHeaderCell(table, "Present");
            addHeaderCell(table, "Absent");
            addHeaderCell(table, "Attendance %");

            for (StudentAttendanceSummary st : classStudents) {
                int total = st.getTotalDays();
                int present = st.getPresentDays();
                int absent = st.getAbsentDays();
                int pct = st.getAttendancePercentage();

                addBodyCell(table, nullToEmpty(st.getRollNumber()));
                addBodyCell(table, nullToEmpty(st.getName()));
                addBodyCell(table, nullToEmpty(st.getClassName()));
                addBodyCell(table, String.valueOf(total));
                addBodyCell(table, String.valueOf(present));
                addBodyCell(table, String.valueOf(absent));
                addBodyCell(table, pct + "%");
            }

            document.add(table);
        }

        document.close();
        return out.toByteArray();
    }

    private static String nullToEmpty(String s) {
        return s != null ? s : "";
    }

    private static boolean isPresentStatus(String status) {
        if (status == null || status.isBlank()) {
            return true;
        }
        String v = status.toLowerCase(Locale.ROOT).trim();
        if ("present".equals(v) || "p".equals(v) || "yes".equals(v) || "y".equals(v)
                || "1".equals(v) || "true".equals(v)) {
            return true;
        }
        if ("absent".equals(v) || "a".equals(v) || "ab".equals(v) || "abs".equals(v)
                || "0".equals(v) || "false".equals(v) || "no".equals(v) || "n".equals(v)) {
            return false;
        }
        if (v.contains("absent") || v.contains("not present")) {
            return false;
        }
        return true;
    }

    private static void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
        cell.setBackgroundColor(new Color(33, 37, 41));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private static void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void finishUploadLog(String fileName, int recordsProcessed) {
        UploadDetail detail = new UploadDetail();
        detail.setFileName(fileName != null ? fileName : "upload");
        detail.setUploadTime(LocalDateTime.now());
        detail.setRecordsProcessed(recordsProcessed);
        detail.setStatus("SUCCESS");
        uploadRepo.save(detail);
    }
}
