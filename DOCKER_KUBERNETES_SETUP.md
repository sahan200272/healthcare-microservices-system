# Docker & Kubernetes Setup Guide

## 🐳 Docker Setup

### Build Client Docker Image

```powershell
cd healthcare-platform/client
docker build -t healthcare-client:latest .
```

### Build All Services

```powershell
# From root directory
docker-compose build
```

### Run All Services with Docker Compose

```powershell
# From root directory
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Access Services

- **Client**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Auth Service**: http://localhost:8088
- **Appointment Service**: http://localhost:8082
- **Doctor Service**: http://localhost:8083
- **Patient Service**: http://localhost:8085
- **Telemedicine Service**: http://localhost:8087
- **Notification Service**: http://localhost:8084
- **Payment Service**: http://localhost:8086
- **AI Symptom Service**: http://localhost:8089

---

## ☸️ Kubernetes Setup

### 1. Start Kubernetes Cluster

**Option A: Docker Desktop (Recommended for Windows)**
- Open Docker Desktop
- Settings → Kubernetes → Enable Kubernetes
- Wait for status to show "Kubernetes is running"

**Option B: Minikube**
```powershell
minikube start
```

**Option C: Check if running**
```powershell
kubectl cluster-info
kubectl get nodes
```

### 2. Build Docker Images for Kubernetes

Before deploying to Kubernetes, build all images:

```powershell
# From root directory

# Backend Services
docker build -t api-gateway:latest ./healthcare-platform/services/api-gateway
docker build -t auth-service:latest ./healthcare-platform/services/auth-service
docker build -t appointment-service:latest ./healthcare-platform/services/appointment-service
docker build -t doctor-service:latest ./healthcare-platform/services/doctor-service
docker build -t patient-service:latest ./healthcare-platform/services/patient-service
docker build -t telemedicine-service:latest ./healthcare-platform/services/telemedicine-service
docker build -t notification-service:latest ./healthcare-platform/services/notification-service
docker build -t payment-service:latest ./healthcare-platform/services/payment-service
docker build -t ai-symptom-service:latest ./healthcare-platform/services/ai-symptom-service

# Frontend Client
docker build -t healthcare-client:latest ./healthcare-platform/client
```

### 3. Deploy to Kubernetes

```powershell
cd k8s

# Create namespace and configuration
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f rbac.yaml

# Deploy all services
kubectl apply -f .

# Or deploy one by one
kubectl apply -f api-gateway.yaml
kubectl apply -f auth-service-new.yaml
# ... etc
```

### 4. Verify Deployment

```powershell
# Check namespace
kubectl get namespace

# Check deployments
kubectl get deployments -n healthcare

# Check services
kubectl get services -n healthcare

# Check pods
kubectl get pods -n healthcare

# View pod details
kubectl describe pod <pod-name> -n healthcare

# View logs
kubectl logs deployment/api-gateway -n healthcare
```

### 5. Port Forwarding for Local Access

```powershell
# In one terminal - API Gateway
kubectl port-forward svc/api-gateway 8080:80 -n healthcare

# In another terminal - Client
kubectl port-forward svc/client 3000:3000 -n healthcare

# In another terminal - Auth Service
kubectl port-forward svc/auth-service 8088:8088 -n healthcare
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Connection refused" with kubectl

**Cause**: Kubernetes cluster is not running

**Solution**:
```powershell
# Check if running
kubectl cluster-info

# If not running, start it
# For Docker Desktop: Enable in Settings
# For Minikube:
minikube start
```

### Issue: Pods stuck in "Pending"

**Diagnosis**:
```powershell
kubectl describe pod <pod-name> -n healthcare
```

**Common causes**:
- Resource constraints
- Docker image not available locally
- MongoDB connection issues

**Solution**: Check logs and ensure images are built

### Issue: "ImagePullBackOff"

**Cause**: Docker image not found

**Solution**: Rebuild the image with correct tag
```powershell
docker build -t <service-name>:latest ./path/to/service
```

### Issue: Service cannot connect to another service

**Diagnosis**:
```powershell
# Test from within pod
kubectl exec -it <pod-name> -n healthcare -- curl http://api-gateway:8080
```

**Solution**: Ensure both services are running and check ConfigMap URLs

---

## 📊 Service Communication

### Docker Compose Network
Services communicate via service name (DNS):
- `auth-service:8088`
- `api-gateway:8080`
- etc.

### Kubernetes Network
Services communicate via DNS within the cluster:
- `auth-service.healthcare.svc.cluster.local:8088`
- Or simply: `auth-service:8088`

---

## 🧹 Cleanup

### Remove Docker Containers
```powershell
docker-compose down -v  # -v removes volumes too
```

### Remove Kubernetes Resources
```powershell
kubectl delete namespace healthcare
# or
./k8s/cleanup.sh
```

### Stop Kubernetes
```powershell
# For Minikube
minikube stop

# For Docker Desktop: Disable in Settings
```

---

## 📝 Environment Variables

Create a `.env` file in root directory:

```env
JWT_SECRET=your_super_secret_key_make_it_long_and_random
MONGO_URI_AUTH=mongodb+srv://user:pass@cluster.mongodb.net/authdbDB
MONGO_URI_TELEMEDICINE=mongodb+srv://user:pass@cluster.mongodb.net/telemedicineDB
MONGO_URI_APPOINTMENT=mongodb+srv://user:pass@cluster.mongodb.net/appointmentDB
MONGO_URI_DOCTOR=mongodb+srv://user:pass@cluster.mongodb.net/doctorDB
MONGO_URI_PATIENT=mongodb+srv://user:pass@cluster.mongodb.net/patientDB
MONGO_URI_NOTIFICATION=mongodb+srv://user:pass@cluster.mongodb.net/notificationDB
MONGO_URI_PAYMENT=mongodb+srv://user:pass@cluster.mongodb.net/paymentDB
```

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start all services (Docker) |
| `docker-compose logs -f` | View all service logs |
| `kubectl apply -f k8s/` | Deploy to Kubernetes |
| `kubectl get pods -n healthcare` | List all pods |
| `kubectl logs deployment/api-gateway -n healthcare` | View pod logs |
| `kubectl port-forward svc/api-gateway 8080:80 -n healthcare` | Forward port locally |
| `kubectl delete namespace healthcare` | Remove all resources |

---

**Last Updated**: April 2026
