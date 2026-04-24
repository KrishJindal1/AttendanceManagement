package net.attendance.AttendanceManagementapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import net.attendance.AttendanceManagementapp.model.Student;
import net.attendance.AttendanceManagementapp.repository.StudentRepository;

@SpringBootApplication
public class AttendanceManagementappApplication {

    public static void main(String[] args) {
        SpringApplication.run(AttendanceManagementappApplication.class, args);
    }

    // This "Bean" runs automatically the second the app starts.
    // Use it to verify your DB is working.
    @Bean
    CommandLineRunner initDatabase(StudentRepository repository) {
        return args -> {
            System.out.println("--- Checking Database Connection ---");

            if (repository.count() == 0) {
                // Add a test student to Supabase automatically
                Student testStudent = new Student();
                testStudent.setName("Krish Test");
                testStudent.setRollNumber("APP-2026-001");

                repository.save(testStudent);

                System.out.println("--- SUCCESS: Database connected and Test Student created! ---");
            } else {
                System.out.println("--- SUCCESS: Database connected! Total Students: " + repository.count() + " ---");
            }
        };
    }
}
