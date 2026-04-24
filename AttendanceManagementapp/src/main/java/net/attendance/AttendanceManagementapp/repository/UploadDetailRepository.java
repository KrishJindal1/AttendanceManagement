package net.attendance.AttendanceManagementapp.repository;

import net.attendance.AttendanceManagementapp.model.UploadDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UploadDetailRepository extends JpaRepository<UploadDetail, Long> {
    // Default CRUD operations (Save, Delete, FindAll) are enough here
}