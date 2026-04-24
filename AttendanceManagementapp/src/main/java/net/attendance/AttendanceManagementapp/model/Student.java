package net.attendance.AttendanceManagementapp.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String rollNumber;

    @Column(name = "class_name") // Force it to match the Supabase underscore style
    private String className;

    @Column(nullable = true)
    private String password = "123456"; // Default password

    /** Exposed to the React dashboard as nested JSON; mapped by {@link AttendanceRecord#student}. */
    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
    private List<AttendanceRecord> attendanceRecords = new ArrayList<>();

    // Explicit getters/setters (Lombok is unreliable with current toolchain/JDK).
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public List<AttendanceRecord> getAttendanceRecords() {
        return attendanceRecords;
    }

    public void setAttendanceRecords(List<AttendanceRecord> attendanceRecords) {
        this.attendanceRecords = attendanceRecords;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}