package net.attendance.AttendanceManagementapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "upload_details")
public class UploadDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private LocalDateTime uploadTime;
    private int recordsProcessed;
    private String status; // "SUCCESS" or "FAILED"

    // Explicit getters/setters (Lombok is unreliable with current toolchain/JDK).
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }

    public int getRecordsProcessed() {
        return recordsProcessed;
    }

    public void setRecordsProcessed(int recordsProcessed) {
        this.recordsProcessed = recordsProcessed;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}