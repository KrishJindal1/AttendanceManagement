package net.attendance.AttendanceManagementapp.repository;

import net.attendance.AttendanceManagementapp.model.AttendanceRecord;
import net.attendance.AttendanceManagementapp.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    // This checks if a record already exists for a specific student on a specific day
    Optional<AttendanceRecord> findByStudentAndAttendanceDate(Student student, LocalDate date);

    @Modifying
    @Transactional
    @Query("delete from AttendanceRecord ar where ar.attendanceDate = :date and ar.student.id in :studentIds")
    void deleteByAttendanceDateAndStudentIds(@Param("date") LocalDate date, @Param("studentIds") List<Long> studentIds);

    @Query("select ar from AttendanceRecord ar join fetch ar.student s where ar.status = :status and ar.attendanceDate <= :cutoff")
    List<AttendanceRecord> findAbsentRecordsUpTo(@Param("status") String status, @Param("cutoff") LocalDate cutoff);

    @Query("select ar from AttendanceRecord ar join fetch ar.student s where ar.status = :status")
    List<AttendanceRecord> findByStatusWithStudent(@Param("status") String status);

    @Query("select ar from AttendanceRecord ar join fetch ar.student s where ar.status = :status and ar.attendanceDate = :day")
    List<AttendanceRecord> findAbsentRecordsOn(@Param("status") String status, @Param("day") LocalDate day);
}