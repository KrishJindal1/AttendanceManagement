package net.attendance.AttendanceManagementapp.controller;

import net.attendance.AttendanceManagementapp.model.Student;
import net.attendance.AttendanceManagementapp.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private StudentRepository studentRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if ("TEACHER".equalsIgnoreCase(loginRequest.getRole())) {
            // Hardcoded teacher credentials
            if ("admin".equals(loginRequest.getUsername()) && "admin".equals(loginRequest.getPassword())) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("role", "TEACHER");
                response.put("name", "Teacher Dashboard");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid teacher credentials"));
        } else if ("STUDENT".equalsIgnoreCase(loginRequest.getRole())) {
            Optional<Student> studentOpt = studentRepository.findByRollNumber(loginRequest.getUsername());
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                String actualPassword = student.getPassword() != null ? student.getPassword() : "123456";
                if (actualPassword.equals(loginRequest.getPassword())) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("role", "STUDENT");
                    response.put("id", student.getId());
                    response.put("name", student.getName());
                    response.put("rollNumber", student.getRollNumber());
                    response.put("className", student.getClassName());
                    return ResponseEntity.ok(response);
                }
            }
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid student credentials"));
        }

        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid role"));
    }

    public static class LoginRequest {
        private String username;
        private String password;
        private String role;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}
