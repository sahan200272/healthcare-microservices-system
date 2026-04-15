# HealthSync - Healthcare Microservices System

A comprehensive healthcare platform built with microservices architecture, featuring patient-doctor interactions, appointment booking, video consultations, payments, and AI-powered symptom analysis.

## 🎯 Project Overview

**HealthSync** is a full-stack healthcare management system that connects patients with doctors through a seamless digital platform. It includes:

- **Doctor Discovery**: Browse and search for specialists
- **Appointment Booking**: Schedule consultations with available time slots  
- **Video Consultations**: Real-time Jitsi Meet integration
- **Patient Profiles**: Medical records, documents, and prescriptions
- **Payments**: Secure payment gateway integration
- **Notifications**: SMS/Email confirmations and reminders
- **AI Symptom Checker**: Preliminary health analysis and specialist recommendations
- **Admin Dashboard**: User verification and transaction oversight

---

## 📋 Features Implemented

### 1. **Doctor Discovery & Search** (`/browse-doctors`)
- Search doctors by name (debounced)
- Filter by specialty (GP, Cardiology, Dermatology, etc.)
- Sort by rating, consultation fee, or experience
- Display quick booking buttons
- Verified doctor badges and star ratings

**Key Files:**
- `client/app/browse-doctors/page.tsx` (300+ lines)
- Uses `appointmentApi.searchDoctors()`

---

### 2. **Appointment Booking** (`/doctors/[id]/book`)
- Date picker with next 7 days
- Time slot selection (8am-6pm, 30-min intervals)
- Symptom description input
- Payment summary sidebar
- Success confirmation page
- Automatic notifications

**Key Files:**
- `client/app/doctors/[id]/book/page.tsx` (400+ lines)
- API Flow: `bookAppointment()` → `initiatePayment()` → `sendAppointmentConfirmation()`

---

### 3. **Patient Profile Management** (`/patient-profile`)
- Edit profile information (name, email, phone, address, blood type, allergies)
- Medical documents upload (drag-and-drop UI)
- Prescription history viewing
- Document download/delete functionality

**Key Files:**
- `client/app/patient-profile/page.tsx` (450+ lines)
- Tabbed interface: Profile | Documents | Prescriptions

---

### 4. **Video Consultations** (`/consultations/[id]`)
- Jitsi Meet integration (external API)
- Video/audio toggle controls
- In-app chat panel
- Session information display
- Automatic room generation
- End session handling

**Key Files:**
- `client/app/consultations/[id]/page.tsx` (350+ lines)
- Jitsi Server: `meet.jitsi.isip.dev`

---

### 5. **AI Symptom Checker** (`/symptom-checker`)
- 16 common symptoms grid
- Custom symptom input
- AI analysis with urgency levels (LOW/MEDIUM/HIGH)
- Specialist recommendations with relevance percentage
- Direct links to doctor browsing

**Key Files:**
- `client/app/symptom-checker/page.tsx` (400+ lines)
- Uses `aiSymptomApi.analyzeSympstoms()`

---

### 6. **Doctor Management** (`/doctor/management`)
- Profile editing (name, specialization, experience, fees)
- Availability scheduling (day/time slot management)
- Verification status display
- Add/remove availability slots

**Key Files:**
- `client/app/doctor/management/page.tsx` (450+ lines)
- Tabbed interface: Profile | Availability

---

### 7. **Admin Dashboard** (`/admin/dashboard`)
- Platform overview statistics
- Pending doctor verification queue
- Doctor approval/rejection with reason
- Transaction history with status filtering
- Revenue calculation

**Key Features:**
- Doctor verification workflow
- Transaction monitoring
- Platform analytics

**Key Files:**
- `client/app/admin/dashboard/page.tsx` (400+ lines)
- Tabbed interface: Overview | Pending Doctors | Transactions

---

## 🏗️ Architecture

### Frontend Stack
```
Framework:     Next.js 13+ (React 18, TypeScript)
Styling:       Tailwind CSS 3
Animation:     Framer Motion
Icons:         Lucide React
API Client:    Axios with JWT interceptors
State:         React Hooks (useState, useEffect)
Video:         Jitsi Meet External API
```

### Backend Services (Microservices)
```
1. Auth Service          - User authentication & JWT
2. Patient Service       - Patient profiles & medical records
3. Doctor Service        - Doctor profiles & availability
4. Appointment Service   - Booking & scheduling
5. Telemedicine Service  - Video consultations
6. Payment Service       - Payment processing
7. Notification Service  - SMS/Email alerts
8. AI Symptom Service    - Health analysis
9. API Gateway           - Request routing (Port 8080)
```

### Authentication Flow
```
1. User registers with PATIENT/DOCTOR role
2. Auth Service generates JWT token
3. Token stored in localStorage
4. Axios interceptor adds Bearer token to requests
5. 401 errors trigger logout
```

### Database
```
Technology: SQLite (per microservice)
Schema:     Service-specific databases
Location:   Each service has independent DB
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Java 11+ (for Spring Boot services)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd healthcare-platform
```

2. **Frontend Setup**
```bash
cd client
npm install
npm run dev
```
Access at: `http://localhost:3000`

3. **Backend Services Setup**
```bash
# Each service
cd services/<service-name>
mvn clean install
mvn spring-boot:run
```

Default ports:
- API Gateway: 8080
- Auth Service: 8085
- Patient Service: 8086
- Doctor Service: 8087
- Appointment Service: 8088
- Telemedicine Service: 8089
- Payment Service: 8090
- Notification Service: 8091
- AI Symptom Service: 8092

### Using Docker Compose
```bash
docker-compose up -d
```

---

## 📱 Application Pages

| Route | Role | Description |
|-------|------|-------------|
| `/login` | All | User login with role selection |
| `/register` | All | Registration form |
| `/dashboard` | All | Role-based dashboard |
| `/browse-doctors` | Patient | Doctor discovery & search |
| `/doctors/[id]/book` | Patient | Appointment booking |
| `/patient-profile` | Patient | Medical records & documents |
| `/consultations/[id]` | Patient/Doctor | Video consultation room |
| `/symptom-checker` | Patient | AI health analysis |
| `/doctor/management` | Doctor | Profile & availability |
| `/admin/dashboard` | Admin | User verification & monitoring |

---

## 🔌 API Endpoints

### Appointment Service
```
GET    /api/appointments/search           - Search doctors
GET    /api/appointments/{id}             - Get doctor details
POST   /api/appointments                  - Book appointment
GET    /api/appointments/user/{userId}    - Get user appointments
PUT    /api/appointments/{id}/status      - Update appointment
DELETE /api/appointments/{id}             - Cancel appointment
```

### Patient Service
```
GET    /api/patients/{id}                 - Get profile
PUT    /api/patients/{id}                 - Update profile
POST   /api/patients/{id}/documents       - Upload document
GET    /api/patients/{id}/documents       - Get documents
GET    /api/patients/{id}/prescriptions   - Get prescriptions
GET    /api/patients/{id}/medical-history - Get history
```

### Doctor Service
```
GET    /api/doctors/{id}                  - Get profile
PUT    /api/doctors/{id}                  - Update profile
POST   /api/doctors/{id}/availability     - Set availability
GET    /api/doctors/{id}/availability     - Get availability
GET    /api/doctors/{id}/patient-reports  - View patient docs
POST   /api/doctors/{id}/prescriptions    - Issue prescription
```

### Payment Service
```
POST   /api/payments/initiate             - Start payment
GET    /api/payments/{id}/verify          - Verify payment
GET    /api/payments/transaction/{id}     - Get transaction
```

### Notification Service
```
POST   /api/notifications/appointment     - Send confirmation
POST   /api/notifications/reminder        - Send reminder
GET    /api/notifications/{userId}        - Get notifications
```

### Admin Service
```
GET    /api/admin/users                   - Get all users
GET    /api/admin/pending-doctors         - Get verification queue
PUT    /api/admin/doctors/{id}/verify     - Approve doctor
PUT    /api/admin/doctors/{id}/reject     - Reject doctor
GET    /api/admin/transactions            - Get all transactions
```

### AI Symptom Service
```
POST   /api/ai/analyze-symptoms           - Analyze symptoms
POST   /api/ai/recommend-specialties      - Get recommendations
```

---

## 🔐 Authentication & Authorization

### Roles
- **PATIENT**: Browse doctors, book appointments, view consultations
- **DOCTOR**: Manage profile, view appointments, conduct consultations
- **ADMIN**: Verify doctors, monitor transactions, platform oversight

### JWT Token
```
Header: Authorization: Bearer <token>
Payload: { userId, role, email, name }
Storage: localStorage
Expiry: Configurable (default: 24 hours)
```

### Role-Based Routing
```typescript
// Check role on mount
const role = localStorage.getItem("role");
if (role !== "PATIENT") {
  window.location.href = "/dashboard";
}
```

---

## 🎨 UI/UX Design

### Design System
- **Color Scheme**: Clinical (white, dark, gray) + Brand (primary, secondary)
- **Typography**: Bold headers, readable body text
- **Spacing**: Consistent padding/margins (multiples of 4px)
- **Animations**: Smooth Framer Motion transitions

### Component Patterns
- **Loading States**: Spinner with message
- **Error States**: Icon + description
- **Empty States**: Icon + helpful message
- **Success Feedback**: Green banners with checkmark
- **Forms**: Clean input fields with labels

### Responsive Design
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3+ columns

---

## 🧪 Testing

### Component Testing
```bash
npm test
```

### API Testing
```bash
# Using Postman or cURL
curl -X GET http://localhost:8080/api/appointments/search \
  -H "Authorization: Bearer <token>"
```

### End-to-End Testing
```bash
npm run e2e
```

---

## 🐛 Troubleshooting

### CORS Errors
**Problem**: Frontend on 192.168.1.5:3000 can't access API at localhost:8080

**Solution**:
```bash
# Update API base URL in lib/api.ts
const API_BASE_URL = "http://192.168.1.5:8080";
```

### Jitsi Meet Issues
**Problem**: Video conference not connecting

**Solution**:
1. Check firewall (ports 10000-20000 for WebRTC)
2. Verify Jitsi server status
3. Use alternative server: `meet.jitsi.example.com`

### Payment Gateway Connection
**Problem**: Payment endpoints returning 404

**Solution**:
1. Ensure Payment Service is running
2. Check API Gateway routing configuration
3. Verify payment provider credentials

### Token Expiration
**Problem**: User logged out unexpectedly

**Solution**:
1. Check token expiry time in Auth Service
2. Implement token refresh mechanism
3. Handle 401 responses in interceptor

---

## 📊 Database Schema Overview

### Users Table
```sql
id, email, password, role, name, phone, created_at
```

### Patient Table
```sql
id, user_id, blood_type, allergies, address, dob, gender
```

### Doctor Table
```sql
id, user_id, specialization, experience, consultation_fee, 
clinic, location, verified, bio
```

### Appointments Table
```sql
id, doctor_id, patient_id, scheduled_at, duration, notes,
status, payment_status, created_at
```

### Documents Table
```sql
id, patient_id, file_name, file_path, uploaded_at
```

### Prescriptions Table
```sql
id, appointment_id, medicines, instructions, issued_at
```

---

## 🔄 Workflow Examples

### Doctor Booking Workflow
```
1. Patient searches for doctors → /browse-doctors
2. Selects specialist → /doctors/{id}/book
3. Chooses date/time → Appointment created
4. Makes payment → Payment verified
5. Receives confirmation → SMS/Email
6. Doctor receives notification → Accepts/Rejects
7. Video session scheduled → Jitsi link sent
```

### Symptom Analysis Workflow
```
1. Patient clicks "Symptom Checker"
2. Selects symptoms from grid or adds custom
3. Submits for AI analysis
4. System returns urgency level + recommendations
5. Patient can browse recommended doctors
6. Books appointment if needed
```

### Doctor Verification Workflow
```
1. Doctor registers with credentials
2. Admin reviews pending doctors → /admin/dashboard
3. Admin approves/rejects with reason
4. Doctor receives notification
5. Verified doctors appear in search
```

---

## 📈 Performance Optimization

### Frontend
- Code splitting per route
- Image optimization
- Lazy loading components
- Memoization with React.memo

### Backend
- Database indexing on frequently queried fields
- Connection pooling
- API response caching
- Pagination for large datasets

### Network
- JWT token caching
- Request deduplication
- Gzip compression
- CDN for static assets

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
npm start
```

### Backend (Docker/Kubernetes)
```bash
docker build -t healthsync-api-gateway .
docker push your-registry/healthsync-api-gateway
kubectl apply -f k8s/api-gateway-deployment.yaml
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Stripe Payment Integration](https://stripe.com/docs)
- [Jitsi Meet External API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-web)
- [MongoDB Schema Design](https://docs.mongodb.com/manual/)

---

## 👥 Team & Contributions

This is a university assignment for SE3020 - Healthcare Microservices System.

---

## 📝 License

MIT License - See LICENSE file for details

---

## ❓ FAQ

**Q: Can I use a different video conferencing service?**
A: Yes! Replace Jitsi Meet with Twilio, Daily.co, or Agora by updating the consultation page.

**Q: How do I integrate a real payment gateway?**
A: Update `paymentApi.initiatePayment()` to call PayHere/Stripe/Dialog Genie APIs.

**Q: Is the AI Symptom Checker free to use?**
A: Currently UI-only. Integrate OpenAI or specialized medical APIs for real analysis.

**Q: Can doctors see patient medical history?**
A: Yes! Via `doctorApi.viewPatientReports()` - fetch patient documents in doctor's consultation view.

**Q: How do I backup patient data?**
A: Configure daily database exports and S3 uploads in the backend services.

---

## 🎯 Next Steps

1. **Implement Backend Microservices**: Create database schemas and business logic
2. **Connect Payment Gateway**: Integrate PayHere or Stripe
3. **Add Email/SMS**: Connect SendGrid and Twilio
4. **Deploy on Cloud**: Use AWS/Azure/GCP with Kubernetes
5. **Monitor Performance**: Set up analytics and error tracking
6. **User Testing**: Gather feedback and iterate

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready (Frontend), Pending Backend Implementation
