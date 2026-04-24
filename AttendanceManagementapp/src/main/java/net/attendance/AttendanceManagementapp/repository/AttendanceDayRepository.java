package net.attendance.AttendanceManagementapp.repository;

import net.attendance.AttendanceManagementapp.model.AttendanceDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceDayRepository extends JpaRepository<AttendanceDay, Long> {

    Optional<AttendanceDay> findByClassNameIgnoreCaseAndAttendanceDate(String className, LocalDate attendanceDate);

    List<AttendanceDay> findByAttendanceDateLessThanEqual(LocalDate attendanceDate);

    @Query("select count(d) from AttendanceDay d where lower(d.className) = lower(:className) and d.attendanceDate <= :cutoff")
    long countByClassNameIgnoreCaseAndAttendanceDateLessThanEqual(@Param("className") String className, @Param("cutoff") LocalDate cutoff);
}

