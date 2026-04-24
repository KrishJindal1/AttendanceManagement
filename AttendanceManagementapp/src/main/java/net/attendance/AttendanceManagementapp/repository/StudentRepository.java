package net.attendance.AttendanceManagementapp.repository;

import net.attendance.AttendanceManagementapp.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    // This allows you to find a student by their unique Roll Number
    Optional<Student> findByRollNumber(String rollNumber);

    @Query("SELECT DISTINCT s FROM Student s LEFT JOIN FETCH s.attendanceRecords")
    List<Student> findAllWithAttendanceRecords();

    // Used for “auto-fill missing” logic when an Excel sheet contains only Present or only Absent.
    List<Student> findByClassNameIgnoreCase(String className);
}