---
# Kubernetes Deployment Guide for Healthcare Microservices System

## Prerequisites
- Kubernetes cluster (v1.19+) running locally (Docker Desktop, Minikube, or kubeadm)
- kubectl configured to access your cluster
- Docker images built and available locally

## Build Docker Images

Before deploying to Kubernetes, build all service images:

```bash
# From the root directory of the project

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

## Deployment Steps

### 1. Create the namespace and configuration
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
```

### 2. Create RBAC resources
```bash
kubectl apply -f k8s/rbac.yaml
```

### 3. Deploy all services
```bash
# Deploy in order to avoid dependency issues
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/auth-service-new.yaml
kubectl apply -f k8s/appointment-service.yaml
kubectl apply -f k8s/doctor-service.yaml
kubectl apply -f k8s/patient-service.yaml
kubectl apply -f k8s/telemedicine-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/ai-symptom-service.yaml
kubectl apply -f k8s/client.yaml
```

### 4. Or deploy all at once
```bash
kubectl apply -f k8s/
```

### 5. (Optional) Setup Ingress
```bash
# Install NGINX Ingress Controller (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Apply ingress configuration
kubectl apply -f k8s/ingress.yaml

# Add to your /etc/hosts file (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
# 127.0.0.1 healthcare.local
```

## Verification

### Check namespace and deployments
```bash
kubectl get namespace
kubectl get deployments -n healthcare
kubectl get services -n healthcare
kubectl get pods -n healthcare
```

### Check service status
```bash
kubectl describe service api-gateway -n healthcare
kubectl logs -f deployment/api-gateway -n healthcare
```

### Port Forwarding (Local Development)
```bash
# Forward API Gateway
kubectl port-forward svc/api-gateway 8080:80 -n healthcare

# Forward individual services
kubectl port-forward svc/auth-service 8088:8088 -n healthcare
kubectl port-forward svc/client 3000:3000 -n healthcare
```

## Environment Variables

The following environment variables are defined in `configmap.yaml` and `secrets.yaml`:

### ConfigMap (healthcare-config)
- JWT_SECRET
- AUTH_SERVICE_URL
- TELEMEDICINE_SERVICE_URL
- APPOINTMENT_SERVICE_URL
- DOCTOR_SERVICE_URL
- PATIENT_SERVICE_URL
- NOTIFICATION_SERVICE_URL
- PAYMENT_SERVICE_URL
- AI_SYMPTOM_SERVICE_URL

### Secrets (mongo-credentials)
- MONGO_URI_AUTH
- MONGO_URI_TELEMEDICINE
- MONGO_URI_APPOINTMENT
- MONGO_URI_DOCTOR
- MONGO_URI_PATIENT
- MONGO_URI_NOTIFICATION
- MONGO_URI_PAYMENT

## Cleanup

To remove all Kubernetes resources:
```bash
kubectl delete namespace healthcare
```

## Service Communication

Services communicate using internal DNS names (within the cluster):
- auth-service:8088
- api-gateway:8080
- appointment-service:8082
- doctor-service:8083
- notification-service:8084
- patient-service:8085
- payment-service:8086
- telemedicine-service:8087
- ai-symptom-service:8089
- client:3000

## Troubleshooting

### Check pod logs
```bash
kubectl logs pod/<pod-name> -n healthcare
```

### Describe pod for events
```bash
kubectl describe pod/<pod-name> -n healthcare
```

### Check if pods are running
```bash
kubectl get pods -n healthcare -o wide
```

### Check resource usage
```bash
kubectl top pods -n healthcare
kubectl top nodes
```

### Debug service connectivity
```bash
# Execute into a pod and test connectivity
kubectl exec -it <pod-name> -n healthcare -- /bin/sh
curl http://auth-service:8088/actuator/health
```

## Notes

- All services are deployed with 2 replicas for redundancy
- Resource requests: CPU 250m, Memory 256Mi
- Resource limits: CPU 500m, Memory 512Mi
- Health checks are configured with liveness and readiness probes
- Images use `Never` pull policy (useful for local development)
- MongoDB connection strings are stored in Kubernetes Secrets
- Change JWT_SECRET and MongoDB URIs to your actual values in configmap.yaml
