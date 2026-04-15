# HealthSync API Reference

Complete documentation of all available API endpoints for the HealthSync healthcare platform.

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Appointment Service](#appointment-service)
3. [Patient Service](#patient-service)
4. [Doctor Service](#doctor-service)
5. [Telemedicine Service](#telemedicine-service)
6. [Payment Service](#payment-service)
7. [Notification Service](#notification-service)
8. [Admin Service](#admin-service)
9. [AI Symptom Service](#ai-symptom-service)

---

## 🔐 Authentication

All requests require JWT token in header:
```
Authorization: Bearer <token>
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "doc123",
  "role": "DOCTOR",
  "name": "Dr. John Smith",
  "email": "doctor@example.com"
}
```

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "PATIENT",
  "phone": "0771234567"
}

Response:
{
  "userId": "pat123",
  "message": "Registration successful"
}
```

---

## 🏥 Appointment Service

### Search Doctors
```
GET /api/appointments/search?specialty=Cardiology&search=Dr. Smith&sort=rating
Query Parameters:
  - specialty (optional): Filter by specialization
  - search (optional): Search by doctor name
  - sort (optional): Sort by rating|fee|experience
  - limit (optional): Number of results (default: 10)

Response:
{
  "doctors": [
    {
      "id": "doc123",
      "name": "Dr. Ahmed Khan",
      "specialization": "Cardiology",
      "experience": 10,
      "consultationFee": 2500,
      "rating": 4.8,
      "ratingCount": 125,
      "verified": true,
      "clinic": "Heart Care Clinic",
      "location": "Colombo 3"
    }
  ],
  "total": 45
}
```

### Get Doctor Details
```
GET /api/appointments/doctors/{doctorId}

Response:
{
  "id": "doc123",
  "name": "Dr. Ahmed Khan",
  "email": "ahmed@clinic.com",
  "phone": "+94771234567",
  "specialization": "Cardiology",
  "experience": 10,
  "consultationFee": 2500,
  "bio": "Experienced cardiologist with 10+ years...",
  "clinic": "Heart Care Clinic",
  "location": "Colombo 3",
  "verified": true,
  "rating": 4.8,
  "ratingCount": 125
}
```

### Book Appointment
```
POST /api/appointments
Content-Type: application/json

{
  "doctorId": "doc123",
  "patientId": "pat123",
  "scheduledAt": "2024-02-15T14:30:00Z",
  "duration": 30,
  "notes": "Chest pain and shortness of breath for 2 weeks"
}

Response:
{
  "id": "apt123",
  "doctorId": "doc123",
  "patientId": "pat123",
  "scheduledAt": "2024-02-15T14:30:00Z",
  "duration": 30,
  "status": "BOOKED",
  "paymentStatus": "PENDING",
  "createdAt": "2024-02-10T10:00:00Z"
}
```

### Get User Appointments
```
GET /api/appointments/user/{userId}?role=PATIENT

Response:
{
  "appointments": [
    {
      "id": "apt123",
      "doctorId": "doc123",
      "doctorName": "Dr. Ahmed Khan",
      "patientId": "pat123",
      "patientName": "John Doe",
      "scheduledAt": "2024-02-15T14:30:00Z",
      "duration": 30,
      "status": "CONFIRMED",
      "paymentStatus": "COMPLETED",
      "consultationFee": 2500,
      "createdAt": "2024-02-10T10:00:00Z"
    }
  ],
  "total": 5
}
```

### Update Appointment Status
```
PUT /api/appointments/{appointmentId}/status
Content-Type: application/json

{
  "status": "CONFIRMED",
  "notes": "Appointment confirmed by doctor"
}

Response:
{
  "id": "apt123",
  "status": "CONFIRMED",
  "updatedAt": "2024-02-10T11:30:00Z"
}
```

### Cancel Appointment
```
DELETE /api/appointments/{appointmentId}

Response:
{
  "id": "apt123",
  "status": "CANCELLED",
  "refundAmount": 2500,
  "cancelledAt": "2024-02-10T11:35:00Z"
}
```

---

## 👤 Patient Service

### Get Patient Profile
```
GET /api/patients/{patientId}

Response:
{
  "id": "pat123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+94771234567",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "bloodType": "O+",
  "allergies": ["Penicillin", "Aspirin"],
  "address": "123 Main St, Colombo 3",
  "createdAt": "2023-01-10T10:00:00Z"
}
```

### Update Patient Profile
```
PUT /api/patients/{patientId}
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+94771234567",
  "address": "456 New St, Colombo 4",
  "bloodType": "O+",
  "allergies": ["Penicillin"],
  "dateOfBirth": "1990-05-15",
  "gender": "MALE"
}

Response:
{
  "id": "pat123",
  "name": "John Doe",
  "phone": "+94771234567",
  "address": "456 New St, Colombo 4",
  "updatedAt": "2024-02-10T11:00:00Z"
}
```

### Upload Medical Document
```
POST /api/patients/{patientId}/documents
Content-Type: multipart/form-data

Form Data:
  file: <binary file>
  documentType: REPORT | PRESCRIPTION | TEST_RESULT | OTHER

Response:
{
  "id": "doc456",
  "patientId": "pat123",
  "fileName": "blood-report-2024.pdf",
  "documentType": "TEST_RESULT",
  "fileSize": 2500,
  "uploadedAt": "2024-02-10T11:05:00Z",
  "downloadUrl": "https://api.healthsync.com/files/doc456"
}
```

### Get Patient Documents
```
GET /api/patients/{patientId}/documents?type=REPORT

Response:
{
  "documents": [
    {
      "id": "doc456",
      "fileName": "blood-report-2024.pdf",
      "documentType": "TEST_RESULT",
      "uploadedAt": "2024-02-10T11:05:00Z",
      "fileSize": 2500
    },
    {
      "id": "doc789",
      "fileName": "xray-chest.pdf",
      "documentType": "REPORT",
      "uploadedAt": "2024-01-20T09:30:00Z",
      "fileSize": 5000
    }
  ],
  "total": 2
}
```

### Get Prescriptions
```
GET /api/patients/{patientId}/prescriptions

Response:
{
  "prescriptions": [
    {
      "id": "presc123",
      "appointmentId": "apt123",
      "doctorName": "Dr. Ahmed Khan",
      "medicines": [
        {
          "name": "Aspirin",
          "dose": "100mg",
          "frequency": "Once daily",
          "duration": "7 days"
        }
      ],
      "instructions": "Take with food. Avoid alcohol.",
      "issuedAt": "2024-02-15T14:45:00Z"
    }
  ],
  "total": 3
}
```

### Get Medical History
```
GET /api/patients/{patientId}/medical-history

Response:
{
  "history": [
    {
      "year": 2023,
      "conditions": ["Hypertension", "Diabetes Type 2"],
      "treatments": ["Medication", "Diet Control"],
      "surgeries": []
    },
    {
      "year": 2022,
      "conditions": ["Common Cold"],
      "treatments": ["Rest and Fluids"],
      "surgeries": []
    }
  ]
}
```

---

## 👨‍⚕️ Doctor Service

### Get Doctor Profile
```
GET /api/doctors/{doctorId}

Response:
{
  "id": "doc123",
  "name": "Dr. Ahmed Khan",
  "email": "ahmed@clinic.com",
  "phone": "+94771234567",
  "specialization": "Cardiology",
  "experience": 10,
  "consultationFee": 2500,
  "bio": "Experienced cardiologist...",
  "clinic": "Heart Care Clinic",
  "location": "Colombo 3",
  "verified": true,
  "rating": 4.8,
  "issuedPrescriptions": 250
}
```

### Update Doctor Profile
```
PUT /api/doctors/{doctorId}
Content-Type: application/json

{
  "phone": "+94771234567",
  "consultationFee": 3000,
  "bio": "Updated bio...",
  "clinic": "New Clinic Name",
  "location": "Colombo 4"
}

Response:
{
  "id": "doc123",
  "updatedAt": "2024-02-10T11:10:00Z"
}
```

### Set Availability Slots
```
POST /api/doctors/{doctorId}/availability
Content-Type: application/json

{
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 30
}

Response:
{
  "id": "slot123",
  "doctorId": "doc123",
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "createdAt": "2024-02-10T11:15:00Z"
}
```

### Get Doctor Availability
```
GET /api/doctors/{doctorId}/availability

Response:
{
  "slots": [
    {
      "id": "slot123",
      "dayOfWeek": "Monday",
      "startTime": "09:00",
      "endTime": "17:00",
      "available": 16
    },
    {
      "id": "slot124",
      "dayOfWeek": "Tuesday",
      "startTime": "10:00",
      "endTime": "18:00",
      "available": 15
    }
  ]
}
```

### View Patient Reports
```
GET /api/doctors/{doctorId}/patient-reports/{patientId}

Response:
{
  "documents": [
    {
      "id": "doc456",
      "fileName": "blood-report-2024.pdf",
      "documentType": "TEST_RESULT",
      "uploadedAt": "2024-02-10T11:05:00Z"
    }
  ]
}
```

### Issue Prescription
```
POST /api/doctors/{doctorId}/prescriptions
Content-Type: application/json

{
  "appointmentId": "apt123",
  "medicines": [
    {
      "name": "Aspirin",
      "dose": "100mg",
      "frequency": "Once daily",
      "duration": "7 days"
    }
  ],
  "instructions": "Take with food. Avoid alcohol."
}

Response:
{
  "id": "presc123",
  "appointmentId": "apt123",
  "doctorId": "doc123",
  "createdAt": "2024-02-15T14:45:00Z"
}
```

---

## 📹 Telemedicine Service

### Start Consultation Session
```
POST /api/telemedicine/sessions
Content-Type: application/json

{
  "appointmentId": "apt123",
  "doctorId": "doc123",
  "patientId": "pat123"
}

Response:
{
  "sessionId": "session123",
  "roomName": "healthsync-session123",
  "jitsiServer": "meet.jitsi.isip.dev",
  "startedAt": "2024-02-15T14:30:00Z"
}
```

### End Consultation Session
```
PUT /api/telemedicine/sessions/{sessionId}/end
Content-Type: application/json

{
  "duration": 25,
  "summary": "Patient discussed symptoms, prescribed medication"
}

Response:
{
  "sessionId": "session123",
  "endedAt": "2024-02-15T14:55:00Z",
  "duration": 25,
  "recorded": true
}
```

### Get Session Details
```
GET /api/telemedicine/sessions/{sessionId}

Response:
{
  "sessionId": "session123",
  "appointmentId": "apt123",
  "doctorName": "Dr. Ahmed Khan",
  "patientName": "John Doe",
  "startedAt": "2024-02-15T14:30:00Z",
  "endedAt": "2024-02-15T14:55:00Z",
  "duration": 25,
  "roomName": "healthsync-session123"
}
```

---

## 💳 Payment Service

### Initiate Payment
```
POST /api/payments/initiate
Content-Type: application/json

{
  "appointmentId": "apt123",
  "amount": 2500,
  "currency": "LKR",
  "paymentMethod": "PAYHERE",
  "returnUrl": "https://app.healthsync.com/payment/success"
}

Response:
{
  "transactionId": "txn123",
  "paymentGatewayUrl": "https://payhere.lk/payment",
  "redirectUrl": "https://payhere.lk/pay/abc123xyz",
  "status": "PENDING"
}
```

### Verify Payment
```
GET /api/payments/{transactionId}/verify

Response:
{
  "transactionId": "txn123",
  "appointmentId": "apt123",
  "amount": 2500,
  "status": "COMPLETED",
  "paymentMethod": "PAYHERE",
  "verifiedAt": "2024-02-15T14:32:00Z"
}
```

### Get Payment Status
```
GET /api/payments/status/{transactionId}

Response:
{
  "transactionId": "txn123",
  "status": "COMPLETED",
  "amount": 2500,
  "commission": 75,
  "netAmount": 2425,
  "createdAt": "2024-02-15T14:30:00Z",
  "completedAt": "2024-02-15T14:32:00Z"
}
```

---

## 🔔 Notification Service

### Send Appointment Confirmation
```
POST /api/notifications/appointment/confirmation
Content-Type: application/json

{
  "appointmentId": "apt123",
  "patientPhone": "+94771234567",
  "patientEmail": "john@example.com",
  "doctorName": "Dr. Ahmed Khan",
  "scheduledAt": "2024-02-15T14:30:00Z",
  "consultationFee": 2500
}

Response:
{
  "notificationId": "notif123",
  "smsStatus": "SENT",
  "emailStatus": "SENT",
  "sentAt": "2024-02-15T14:31:00Z"
}
```

### Send Consultation Reminder
```
POST /api/notifications/consultation/reminder
Content-Type: application/json

{
  "appointmentId": "apt123",
  "patientPhone": "+94771234567",
  "patientEmail": "john@example.com",
  "minutesBefore": 30
}

Response:
{
  "notificationId": "notif124",
  "status": "SCHEDULED",
  "sendAt": "2024-02-15T14:00:00Z"
}
```

### Get User Notifications
```
GET /api/notifications/user/{userId}?limit=10&read=false

Response:
{
  "notifications": [
    {
      "id": "notif123",
      "type": "APPOINTMENT_CONFIRMED",
      "title": "Appointment Confirmed",
      "message": "Your appointment with Dr. Ahmed Khan is confirmed...",
      "read": false,
      "createdAt": "2024-02-15T14:31:00Z"
    }
  ],
  "total": 5,
  "unreadCount": 3
}
```

---

## 👨‍💼 Admin Service

### Get All Users
```
GET /api/admin/users?role=DOCTOR&verified=false&page=1&limit=20

Response:
{
  "users": [
    {
      "id": "doc123",
      "name": "Dr. Ahmed Khan",
      "email": "ahmed@clinic.com",
      "role": "DOCTOR",
      "verified": false,
      "createdAt": "2024-02-01T10:00:00Z",
      "appliedAt": "2024-02-01T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

### Get Pending Doctors
```
GET /api/admin/pending-doctors

Response:
{
  "pendingDoctors": [
    {
      "id": "doc123",
      "name": "Dr. Ahmed Khan",
      "email": "ahmed@clinic.com",
      "specialization": "Cardiology",
      "experience": 10,
      "documents": ["license.pdf", "credentials.pdf"],
      "appliedAt": "2024-02-01T10:00:00Z"
    }
  ],
  "total": 5
}
```

### Verify Doctor
```
PUT /api/admin/doctors/{doctorId}/verify
Content-Type: application/json

{
  "verified": true,
  "notes": "Credentials verified successfully"
}

Response:
{
  "doctorId": "doc123",
  "verified": true,
  "verifiedAt": "2024-02-10T12:00:00Z"
}
```

### Reject Doctor
```
PUT /api/admin/doctors/{doctorId}/reject
Content-Type: application/json

{
  "reason": "Credentials do not meet requirements",
  "notes": "Please resubmit with valid documentation"
}

Response:
{
  "doctorId": "doc123",
  "status": "REJECTED",
  "rejectionReason": "Credentials do not meet requirements",
  "rejectedAt": "2024-02-10T12:05:00Z"
}
```

### Get All Transactions
```
GET /api/admin/transactions?status=COMPLETED&startDate=2024-02-01&endDate=2024-02-10

Response:
{
  "transactions": [
    {
      "id": "txn123",
      "appointmentId": "apt123",
      "doctorName": "Dr. Ahmed Khan",
      "patientName": "John Doe",
      "amount": 2500,
      "commission": 75,
      "netAmount": 2425,
      "status": "COMPLETED",
      "createdAt": "2024-02-15T14:30:00Z"
    }
  ],
  "total": 150,
  "totalRevenue": 375000,
  "platformCommission": 11250
}
```

---

## 🧠 AI Symptom Service

### Analyze Symptoms
```
POST /api/ai/analyze-symptoms
Content-Type: application/json

{
  "symptoms": ["fever", "cough", "shortness of breath"],
  "duration": "3 days",
  "severity": "MODERATE",
  "ageGroup": "30-40",
  "gender": "MALE"
}

Response:
{
  "analysisId": "analysis123",
  "urgencyLevel": "MEDIUM",
  "summary": "Your symptoms suggest possible respiratory infection...",
  "recommendations": [
    "Consult a general practitioner immediately",
    "Get a chest X-ray if symptoms persist",
    "Monitor temperature regularly"
  ],
  "recommendedSpecialties": [
    "General Practitioner",
    "Pulmonologist"
  ],
  "disclaimer": "This is not a medical diagnosis. Please consult a qualified healthcare professional.",
  "analyzedAt": "2024-02-10T12:10:00Z"
}
```

### Get Recommended Specialties
```
POST /api/ai/recommend-specialties
Content-Type: application/json

{
  "symptoms": ["chest pain", "shortness of breath", "dizziness"]
}

Response:
{
  "recommendations": [
    {
      "specialty": "Cardiology",
      "relevance": 95,
      "reason": "Your symptoms are consistent with cardiac issues"
    },
    {
      "specialty": "General Practice",
      "relevance": 60,
      "reason": "Initial consultation recommended"
    }
  ]
}
```

---

## ⚠️ Error Responses

All endpoints return consistent error responses:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid appointment date",
  "timestamp": "2024-02-10T12:15:00Z",
  "path": "/api/appointments"
}
```

### Common HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔌 Integration Examples

### Example: Complete Booking Flow (JavaScript)

```javascript
// 1. Search doctors
const doctors = await appointmentApi.searchDoctors({ 
  specialty: "Cardiology" 
});

// 2. Book appointment
const appointment = await appointmentApi.bookAppointment({
  doctorId: doctors[0].id,
  patientId: patientId,
  scheduledAt: "2024-02-15T14:30:00Z",
  notes: "Chest pain"
});

// 3. Initiate payment
const payment = await paymentApi.initiatePayment({
  appointmentId: appointment.id,
  amount: 2500,
  paymentMethod: "PAYHERE"
});

// 4. Send confirmation
await notificationApi.sendAppointmentConfirmation({
  appointmentId: appointment.id,
  patientEmail: userEmail
});
```

---

## 📚 Rate Limiting

- **Limit**: 100 requests per minute per client
- **Header**: `X-RateLimit-Remaining`
- **Exceeded**: HTTP 429 Too Many Requests

---

## 🔒 Security Notes

1. Always use HTTPS in production
2. Never expose API tokens in client-side logs
3. Validate all input on backend
4. Use CORS properly to allow only trusted origins
5. Implement rate limiting
6. Use parameterized queries to prevent SQL injection

---

**Last Updated**: 2024
**API Version**: 1.0.0
