package net.attendance.AttendanceManagementapp.controller;

import net.attendance.AttendanceManagementapp.model.*;
import net.attendance.AttendanceManagementapp.repository.*;
import net.attendance.AttendanceManagementapp.services.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*") // CRITICAL: Allows your React app to talk to this API
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UploadDetailRepository uploadRepo;

    // 1. UPLOAD EXCEL FILE
    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            attendanceService.processExcel(file);
            return ResponseEntity.ok("File uploaded and processed successfully: " + file.getOriginalFilename());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing file: " + e.getMessage());
        }
    }

    /**
     * Download attendance as a PDF (tables per class): Roll, Name, Class, days recorded, Present, Absent, %.
     * Query params: scope=all | single_class; className required when scope=single_class.
     */
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportAttendancePdf(
            @RequestParam(value = "scope", defaultValue = "all") String scope,
            @RequestParam(value = "className", required = false) String className) {
        try {
            byte[] pdf = attendanceService.buildAttendanceReportPdf(scope, className);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance-report.pdf\"")
                    .body(pdf);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(e.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("Error generating PDF: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * Download attendance as Excel (.xlsx) with summary tables.
     * Query params: scope=all | single_class; className required when scope=single_class.
     */
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportAttendanceExcel(
            @RequestParam(value = "scope", defaultValue = "all") String scope,
            @RequestParam(value = "className", required = false) String className) {
        try {
            byte[] excel = attendanceService.buildAttendanceReportExcel(scope, className);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance-report.xlsx\"")
                    .body(excel);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(e.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("Error generating Excel: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }

    // 2. GET ALL STUDENTS (For your Dashboard) — includes nested attendance so the UI can show Present/Absent
    @GetMapping("/students")
    public List<StudentAttendanceSummary> getAllStudents(
            @RequestParam(value = "selectedDate", required = false) String selectedDate
    ) {
        LocalDate date = null;
        if (selectedDate != null && !selectedDate.isBlank()) {
            date = LocalDate.parse(selectedDate.trim());
        }
        return attendanceService.getStudentAttendanceSummaries(date);
    }

    // 2.5. GET SINGLE STUDENT (For Student Dashboard)
    @GetMapping("/students/{id}")
    public ResponseEntity<StudentAttendanceSummary> getStudentById(@PathVariable String id) {
        List<StudentAttendanceSummary> all = attendanceService.getStudentAttendanceSummaries(null);
        for (StudentAttendanceSummary summary : all) {
            if (summary.getId() != null && summary.getId().equals(id)) {
                return ResponseEntity.ok(summary);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // 3. GET UPLOAD HISTORY
    @GetMapping("/history")
    public List<UploadDetail> getUploadHistory() {
        return uploadRepo.findAll();
    }
}
