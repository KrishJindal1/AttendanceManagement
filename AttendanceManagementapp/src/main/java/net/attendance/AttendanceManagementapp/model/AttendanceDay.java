package net.attendance.AttendanceManagementapp.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@Table(
        name = "attendance_days",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"class_name", "attendance_date"})
        }
)
public class AttendanceDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_name", nullable = false)
    private String className;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    // Explicit getters/setters (Lombok can be unreliable in some toolchains).
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public LocalDate getAttendanceDate() {
        return attendanceDate;
    }

    public void setAttendanceDate(LocalDate attendanceDate) {
        this.attendanceDate = attendanceDate;
    }
}

