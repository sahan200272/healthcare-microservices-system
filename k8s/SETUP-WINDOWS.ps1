# Healthcare Microservices Kubernetes Setup - Windows PowerShell Guide

# ========================================
# PREREQUISITES
# ========================================

# 1. Install kubectl
#    Download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
#    or via Chocolatey: choco install kubernetes-cli

# 2. Setup Kubernetes cluster
#    - Docker Desktop (Recommended for Windows)
#    - Minikube for Windows
#    - WSL 2 backend for Docker Desktop

# 3. Verify installation
Get-Command kubectl
kubectl version --client

# ========================================
# BUILD DOCKER IMAGES
# ========================================

# Change to project root
Set-Location "D:\SLIIT\3rd Year 2nd Semester\DS - SE3020\Assignment 01\healthcare-microservices-system"

# Build all service images
docker build -t api-gateway:latest ./healthcare-platform/services/api-gateway
docker build -t auth-service:latest ./healthcare-platform/services/auth-service
docker build -t appointment-service:latest ./healthcare-platform/services/appointment-service
docker build -t doctor-service:latest ./healthcare-platform/services/doctor-service
docker build -t patient-service:latest ./healthcare-platform/services/patient-service
docker build -t telemedicine-service:latest ./healthcare-platform/services/telemedicine-service
docker build -t notification-service:latest ./healthcare-platform/services/notification-service
docker build -t payment-service:latest ./healthcare-platform/services/payment-service
docker build -t ai-symptom-service:latest ./healthcare-platform/services/ai-symptom-service

# Build client image
docker build -t healthcare-client:latest ./healthcare-platform/client

# Verify images
docker images | findstr healthcare

# ========================================
# DEPLOYMENT
# ========================================

# Navigate to k8s directory
Set-Location k8s

# Create namespace
kubectl apply -f namespace.yaml

# Create ConfigMap and Secrets
kubectl apply -f configmap.yaml

# Create RBAC resources
kubectl apply -f rbac.yaml

# Deploy all services
kubectl apply -f api-gateway.yaml
kubectl apply -f auth-service-new.yaml
kubectl apply -f appointment-service.yaml
kubectl apply -f doctor-service.yaml
kubectl apply -f patient-service.yaml
kubectl apply -f telemedicine-service.yaml
kubectl apply -f notification-service.yaml
kubectl apply -f payment-service.yaml
kubectl apply -f ai-symptom-service.yaml
kubectl apply -f client.yaml

# Or deploy all at once
kubectl apply -f .

# ========================================
# VERIFICATION
# ========================================

# Check namespace
kubectl get namespace

# Check deployments
kubectl get deployments -n healthcare

# Check services
kubectl get services -n healthcare

# Check pods
kubectl get pods -n healthcare
kubectl get pods -n healthcare -o wide

# Check pod logs
kubectl logs deployment/api-gateway -n healthcare
kubectl logs deployment/auth-service -n healthcare

# ========================================
# PORT FORWARDING (LOCAL DEVELOPMENT)
# ========================================

# Forward API Gateway to localhost:8080
kubectl port-forward svc/api-gateway 8080:80 -n healthcare

# In another PowerShell window, forward client
kubectl port-forward svc/client 3000:3000 -n healthcare

# Forward Auth Service to localhost:8088
kubectl port-forward svc/auth-service 8088:8088 -n healthcare

# ========================================
# DEBUGGING
# ========================================

# Get pod name
$podName = kubectl get pods -n healthcare -l app=api-gateway -o jsonpath='{.items[0].metadata.name}'

# View pod logs
kubectl logs $podName -n healthcare
kubectl logs $podName -n healthcare -f  # Follow logs

# Describe pod
kubectl describe pod $podName -n healthcare

# Execute command in pod
kubectl exec -it $podName -n healthcare -- powershell
kubectl exec -it $podName -n healthcare -- cmd

# ========================================
# SCALING
# ========================================

# Scale deployment to 3 replicas
kubectl scale deployment api-gateway --replicas=3 -n healthcare

# Check updated deployment
kubectl get deployments -n healthcare

# ========================================
# CLEANUP
# ========================================

# Delete all resources in healthcare namespace
kubectl delete namespace healthcare

# Delete specific service
kubectl delete deployment api-gateway -n healthcare

# ========================================
# TROUBLESHOOTING
# ========================================

# Check cluster info
kubectl cluster-info

# Get nodes
kubectl get nodes

# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods -n healthcare

# Get events
kubectl get events -n healthcare

# Describe service
kubectl describe service api-gateway -n healthcare

Write-Host "Healthcare Microservices Kubernetes Setup - PowerShell Guide" -ForegroundColor Green
