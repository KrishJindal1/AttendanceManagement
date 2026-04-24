package net.attendance.AttendanceManagementapp.model;

import java.util.HashMap;
import java.util.Map;

public class StudentAttendanceSummary {
    private String id;
    private String name;
    private String className;
    private String rollNumber;

    // daily status map e.g. { "2026-04-02": "Present" }
    private Map<String, String> attendanceRecords = new HashMap<>();

    private int totalDays;
    private int presentDays;
    private int absentDays;
    private int attendancePercentage;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public Map<String, String> getAttendanceRecords() {
        return attendanceRecords;
    }

    public void setAttendanceRecords(Map<String, String> attendanceRecords) {
        this.attendanceRecords = attendanceRecords;
    }

    public int getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(int totalDays) {
        this.totalDays = totalDays;
    }

    public int getPresentDays() {
        return presentDays;
    }

    public void setPresentDays(int presentDays) {
        this.presentDays = presentDays;
    }

    public int getAbsentDays() {
        return absentDays;
    }

    public void setAbsentDays(int absentDays) {
        this.absentDays = absentDays;
    }

    public int getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(int attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }
}

