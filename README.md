# 📋 Attendance Management System

A full-stack web application for managing employee/student attendance, built with Spring Boot and a modern frontend deployed on Vercel.

🔗 **Live Demo:** [attendance-management-frontend-beta.vercel.app](https://attendance-management-frontend-beta.vercel.app/)

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js
- **Deployment:** Vercel

### Backend
- **Framework:** Spring Boot 4.x (Java 25)
- **ORM:** Hibernate / Spring Data JPA
- **Database:** PostgreSQL (Supabase)
- **Deployment:** Render

---

## 📁 Project Structure

```
AttendanceManagement/
├── AttendanceManagementapp/      # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── net/attendance/
│   │   │   │       ├── controller/
│   │   │   │       ├── model/
│   │   │   │       ├── repository/
│   │   │   │       └── service/
│   │   │   └── resources/
│   │   │       └── application.properties
│   └── pom.xml
│
└── attandanceSystem Frontend/    # React Frontend
    ├── src/
    ├── public/
    └── package.json
```

---

## ⚙️ Backend Setup (Spring Boot)

### Prerequisites
- Java 17+
- Maven
- PostgreSQL / Supabase account

### 1. Clone the repository
```bash
git clone https://github.com/KrishJindal1/AttendanceManagement.git
cd AttendanceManagement/AttendanceManagementapp
```

### 2. Configure `application.properties`

```properties
spring.datasource.url=jdbc:postgresql://<your-supabase-host>:5432/postgres?sslmode=require
spring.datasource.username=postgres.<your-project-ref>
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

> ⚠️ Never commit your credentials. Use environment variables in production.

### 3. Run the backend
```bash
./mvnw clean package -DskipTests
java -jar target/*.jar
```

Backend runs on `http://localhost:8080`

---

## 💻 Frontend Setup (React)

### 1. Navigate to frontend folder
```bash
cd AttendanceManagement/"attandanceSystem Frontend"
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm start
```

Frontend runs on `http://localhost:3000`

---

## 🌐 Deployment

### Backend → Render

| Setting | Value |
|---------|-------|
| Root Directory | `AttendanceManagementapp` |
| Build Command | `./mvnw clean package -DskipTests` |
| Start Command | `java -jar target/*.jar` |

**Environment Variables on Render:**

| Key | Value |
|-----|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` |
| `DB_PASSWORD` | `your_password` |

### Frontend → Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `attandanceSystem Frontend` |
| Build Command | `npm run build` |
| Output Directory | `build` |

---

## 📦 Dependencies

### Backend (`pom.xml`)
- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `postgresql`
- `lombok`
- `apache-poi` (Excel export)
- `openpdf` (PDF export)

---

## 🔒 Environment Variables

For local development, set these in IntelliJ Run Configuration or use a local `application-local.properties` (excluded from git):

```properties
spring.datasource.url=jdbc:postgresql://<host>:5432/postgres?sslmode=require
spring.datasource.username=postgres.<project-ref>
spring.datasource.password=your_password
```

Add to `.gitignore`:
```
application-local.properties
```

---

## 👨‍💻 Author

**Krish Jindal**
- GitHub: [@KrishJindal1](https://github.com/KrishJindal1)

---

## 📄 License

This project is licensed under the MIT License.
