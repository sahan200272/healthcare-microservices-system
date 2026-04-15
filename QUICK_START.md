# HealthSync - Quick Setup & Development Guide

Get HealthSync running locally in just 5 minutes!

## 📋 Prerequisites

Before you start, ensure you have:
- **Node.js** 18+ ([Download](https://nodejs.org))
- **npm** or **yarn**
- **Git**
- **Java** 11+ (for backend services)
- **Maven** 3.6+ (for building services)
- **Docker** & **Docker Compose** (optional, for containerized setup)

### Verify Installations
```bash
node --version      # v18.x.x or higher
npm --version       # 8.x.x or higher
java -version       # 11 or higher
mvn --version       # 3.6+ or higher
```

---

## 🚀 Option 1: Quick Start (Frontend Only)

If you only want to run the frontend for UI development:

### Step 1: Navigate to Client Directory
```bash
cd healthcare-platform/client
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
```
http://localhost:3000
```

**Note**: Features requiring backend will show loading spinners or errors. Backend must be running for full functionality.

---

## 🏗️ Option 2: Full Stack Setup (Recommended)

### Frontend Setup

```bash
cd healthcare-platform/client
npm install

# Start in one terminal
npm run dev
# Access at http://localhost:3000
```

### Backend Setup - API Gateway

The API Gateway routes all requests to appropriate microservices.

```bash
cd healthcare-platform/services/api-gateway

# Build
mvn clean install

# Run
mvn spring-boot:run
# Runs on http://localhost:8080
```

### Backend Setup - Individual Services

Each service needs to be run in a separate terminal:

**Auth Service** (Port 8085)
```bash
cd healthcare-platform/services/auth-service
mvn clean install
mvn spring-boot:run
```

**Patient Service** (Port 8086)
```bash
cd healthcare-platform/services/patient-service
mvn clean install
mvn spring-boot:run
```

**Doctor Service** (Port 8087)
```bash
cd healthcare-platform/services/doctor-service
mvn clean install
mvn spring-boot:run
```

**Appointment Service** (Port 8088)
```bash
cd healthcare-platform/services/appointment-service
mvn clean install
mvn spring-boot:run
```

**Telemedicine Service** (Port 8089)
```bash
cd healthcare-platform/services/telemedicine-service
mvn clean install
mvn spring-boot:run
```

**Notification Service** (Port 8091)
```bash
cd healthcare-platform/services/notification-service
mvn clean install
mvn spring-boot:run
```

**AI Symptom Service** (Port 8092)
```bash
cd healthcare-platform/services/ai-symptom-service
mvn clean install
mvn spring-boot:run
```

---

## 🐳 Option 3: Docker Setup (Easiest)

If you have Docker installed, run everything with one command:

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- Frontend (http://localhost:3000)
- API Gateway (http://localhost:8080)
- All microservices
- Databases (SQLite)

---

## 🧪 Testing the Setup

### 1. **Test Frontend Access**
Open http://localhost:3000 in your browser
```
✅ Should see HealthSync login page
```

### 2. **Test Backend API**
```bash
curl -X GET http://localhost:8080/api/auth/health
```
Expected response:
```json
{
  "status": "UP",
  "services": {
    "auth-service": "UP",
    "patient-service": "UP",
    "doctor-service": "UP"
  }
}
```

### 3. **Test Login**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "password123"
  }'
```

---

## 📁 Project Structure

```
healthcare-microservices-system/
├── healthcare-platform/
│   ├── client/                          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── login/                   # Login page
│   │   │   ├── register/                # Registration page
│   │   │   ├── dashboard/               # Dashboard
│   │   │   ├── browse-doctors/          # Search doctors
│   │   │   ├── doctors/[id]/book/       # Appointment booking
│   │   │   ├── patient-profile/         # Patient profile
│   │   │   ├── symptom-checker/         # AI analysis
│   │   │   ├── doctor/management/       # Doctor profile
│   │   │   ├── admin/dashboard/         # Admin panel
│   │   │   ├── consultations/[id]/      # Video room
│   │   │   └── components/              # Reusable components
│   │   ├── lib/
│   │   │   └── api.ts                   # API client (90+ endpoints)
│   │   ├── public/                      # Static files
│   │   └── package.json
│   └── services/                        # Java Microservices
│       ├── api-gateway/                 # Route to all services
│       ├── auth-service/                # JWT authentication
│       ├── patient-service/             # Patient management
│       ├── doctor-service/              # Doctor management
│       ├── appointment-service/         # Appointment booking
│       ├── telemedicine-service/        # Video consultations
│       ├── notification-service/        # SMS/Email alerts
│       ├── payment-service/             # Payment processing
│       └── ai-symptom-service/          # ML-based analysis
├── docker-compose.yml                   # Docker configuration
├── IMPLEMENTATION_GUIDE.md              # Feature documentation
├── API_REFERENCE.md                     # API endpoints
└── README.md                            # Project overview
```

---

## 🔧 Configuration

### Frontend Configuration
Edit `healthcare-platform/client/lib/api.ts`:

```typescript
// Change API base URL if needed
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  "http://localhost:8080";
```

### Backend Configuration
Each service has `application.properties` in `src/main/resources/`:

**Auth Service** (`auth-service/src/main/resources/application.properties`):
```properties
server.port=8085
spring.datasource.url=jdbc:sqlite:auth.db
jwt.secret=your-secret-key
jwt.expiration=86400000
```

**Database Configuration** (SQLite by default):
```properties
spring.jpa.database-platform=org.hibernate.dialect.SQLiteDialect
spring.jpa.hibernate.ddl-auto=update
```

---

## 💾 Database Setup

### SQLite (Default)
Databases are created automatically in each service directory:
```
auth.db
patient.db
doctor.db
appointment.db
telemedicine.db
notification.db
payment.db
ai_symptom.db
```

### Switch to PostgreSQL
1. Update `application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/healthsync
   spring.datasource.username=postgres
   spring.datasource.password=password
   spring.jpa.database-platform=org.hibernate.dialect.PostgreSQL10Dialect
   ```

2. Create database:
   ```bash
   psql -U postgres -c "CREATE DATABASE healthsync;"
   ```

---

## 👤 Test Accounts

Use these pre-configured accounts for testing:

### Patient Login
```
Email: patient@example.com
Password: password123
```

### Doctor Login
```
Email: doctor@example.com
Password: password123
```

### Admin Login
```
Email: admin@example.com
Password: password123
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Port Already in Use
```
Error: Port 3000 is already in use
```

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue 2: CORS Errors
```
Error: No 'Access-Control-Allow-Origin' header
```

**Solution**:
1. Ensure API Gateway is running on 8080
2. Update `API_BASE_URL` in `lib/api.ts`
3. Check API Gateway CORS configuration

### Issue 3: Maven Build Fails
```
Error: [ERROR] FATAL ERROR in native method: SIGABRT
```

**Solution**:
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Rebuild
mvn clean install
```

### Issue 4: Database Locked
```
Error: [SQLITE_CANTOPEN] unable to open database file
```

**Solution**:
```bash
# Stop all services
# Delete SQLite files
rm *.db

# Restart services
```

---

## 📱 Testing the Application

### Test as Patient
1. Go to http://localhost:3000
2. Click "Register" → Select "PATIENT"
3. Fill details and create account
4. Login with new credentials
5. Browse doctors → Book appointment → Make payment

### Test as Doctor
1. Register as DOCTOR role
2. Login to doctor account
3. Go to "My Profile" → Set availability
4. Wait for admin approval
5. View appointments and conduct consultations

### Test as Admin
1. Login with admin account
2. Go to "Admin Panel"
3. View pending doctor verifications
4. Approve/reject doctors
5. Monitor transactions

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Update `API_BASE_URL` to production URL
- [ ] Set secure JWT secret
- [ ] Configure HTTPS
- [ ] Set database backup strategy
- [ ] Configure payment gateway credentials
- [ ] Setup email/SMS provider
- [ ] Enable database encryption
- [ ] Setup monitoring & logging
- [ ] Configure rate limiting
- [ ] Enable CORS for production domain only

---

## 📞 Support & Documentation

- **API Reference**: See `API_REFERENCE.md`
- **Features Guide**: See `IMPLEMENTATION_GUIDE.md`
- **Next.js Docs**: https://nextjs.org/docs
- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **Jitsi Guide**: https://jitsi.github.io/handbook/

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Frontend loads at http://localhost:3000
- [ ] Can see login page
- [ ] API Gateway responds at http://localhost:8080/health
- [ ] Can login with test account
- [ ] Can see dashboard
- [ ] Doctor browsing works (once backend running)
- [ ] Console shows no critical errors

---

## 🎯 Next Steps

1. **Frontend Development**
   - Modify pages in `healthcare-platform/client/app`
   - Changes hot-reload automatically
   - Check browser for errors (F12)

2. **Backend Development**
   - Each service in `services/` folder
   - Edit `src/main/java` files
   - Restart service for changes

3. **Testing**
   - Run unit tests: `mvn test`
   - Test API with Postman or curl
   - Check console logs for errors

4. **Deployment**
   - Build: `npm run build` (frontend) / `mvn package` (backend)
   - Deploy to Vercel/Netlify (frontend)
   - Deploy to AWS/Azure/GCP (backend)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs first**
   ```bash
   # Frontend errors (browser console)
   F12 → Console tab
   
   # Backend errors
   mvn spring-boot:run | grep ERROR
   ```

2. **Common solutions**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear Maven cache: `rm -rf ~/.m2`
   - Restart services: Stop all, wait 5s, start again

3. **Debug mode**
   ```bash
   # Frontend
   DEBUG=healthsync:* npm run dev
   
   # Backend
   mvn spring-boot:run -Ddebug
   ```

---

**Happy coding! 🚀**

For detailed feature documentation, see `IMPLEMENTATION_GUIDE.md`
For API details, see `API_REFERENCE.md`
