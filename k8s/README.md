# Healthcare Microservices - Kubernetes Configuration

Complete Kubernetes configuration for deploying the healthcare microservices system on any Kubernetes cluster.

## 📁 File Structure

```
k8s/
├── namespace.yaml                 # Kubernetes namespace for healthcare services
├── configmap.yaml                 # ConfigMaps and Secrets for configuration
├── rbac.yaml                       # Role-based access control
├── api-gateway.yaml               # API Gateway deployment & service
├── auth-service-new.yaml          # Auth Service deployment & service
├── appointment-service.yaml       # Appointment Service deployment & service
├── doctor-service.yaml            # Doctor Service deployment & service
├── patient-service.yaml           # Patient Service deployment & service
├── telemedicine-service.yaml      # Telemedicine Service deployment & service
├── notification-service.yaml      # Notification Service deployment & service
├── payment-service.yaml           # Payment Service deployment & service
├── ai-symptom-service.yaml        # AI Symptom Service deployment & service
├── client.yaml                    # Frontend client deployment & service
├── ingress.yaml                   # Ingress configuration for API access
├── kustomization.yaml             # Kustomize configuration for unified deployment
├── deploy.sh                       # Automated deployment script (Linux/Mac)
├── cleanup.sh                      # Cleanup script to remove all resources
├── SETUP-WINDOWS.ps1             # Windows PowerShell setup guide
├── commands-reference.sh          # Quick reference for kubectl commands
├── DEPLOYMENT_GUIDE.md            # Comprehensive deployment documentation
└── README.md                       # This file
```

## 🚀 Quick Start

### Option 1: One-Click Deployment (Linux/Mac)

```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Step-by-Step Deployment

```bash
# Create namespace and configuration
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/rbac.yaml

# Deploy all services
kubectl apply -f k8s/

# Verify deployment
kubectl get pods -n healthcare
kubectl get services -n healthcare
```

### Option 3: Using Kustomize

```bash
kubectl apply -k k8s/
```

### Option 4: Windows PowerShell

```powershell
# Run the setup script
.\k8s\SETUP-WINDOWS.ps1
```

## 📋 Prerequisites

1. **Kubernetes Cluster** - Running on:
   - Docker Desktop (Windows/Mac)
   - Minikube
   - kubeadm cluster
   - Cloud provider (AWS EKS, GCP GKE, Azure AKS)

2. **kubectl** - Kubernetes command-line tool
   ```bash
   # macOS
   brew install kubectl
   
   # Windows (Chocolatey)
   choco install kubernetes-cli
   
   # Or download from: https://kubernetes.io/docs/tasks/tools/
   ```

3. **Docker Images** - Built and available locally
   ```bash
   docker build -t api-gateway:latest ./healthcare-platform/services/api-gateway
   # ... build all other services
   ```

## 🔧 Configuration

### Environment Variables

All configuration is managed through Kubernetes ConfigMaps and Secrets:

- **ConfigMap** (`configmap.yaml`):
  - JWT_SECRET
  - Service URLs for inter-service communication
  - Database URIs

- **Secrets** (`configmap.yaml`):
  - MongoDB connection strings
  - Sensitive credentials

### Customization

Edit `configmap.yaml` to update:
- JWT_SECRET
- Database URIs
- Service endpoints
- Other environment variables

## 📊 Service Topology

```
┌─────────────────────────────────────┐
│        Client (Next.js)             │
│        Port: 3000                   │
└────────────────┬────────────────────┘
                 │ (Port: 80)
┌────────────────▼────────────────────┐
│      API Gateway (Spring Boot)      │
│      Port: 8080                     │
└────────────────┬────────────────────┘
                 │
    ┌────────────┼────────────────────────────────┐
    │            │            │          │        │
    ▼            ▼            ▼          ▼        ▼
┌────────┐  ┌──────────┐  ┌────────┐ ┌──────┐ ┌────────┐
│  Auth  │  │Telemedicine│ │Appt   │ │Doctor│ │Patient │
│  8088  │  │   8087     │ │ 8082  │ │ 8083 │ │ 8085   │
└────────┘  └──────────┘  └────────┘ └──────┘ └────────┘
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
┌────────────────────┐        ┌──────────────────┐
│   Notification     │        │    Payment       │
│      8084          │        │     8086         │
└────────────────────┘        └──────────────────┘

┌───────────────────────────────────────┐
│   AI Symptom Service                  │
│        8089                           │
└───────────────────────────────────────┘
```

## 🔄 Service Communication

All services communicate through Kubernetes internal DNS within the cluster:

- **DNS Format**: `<service-name>:<port>`
- **Example**: `auth-service:8088`, `api-gateway:8080`

## 📝 Common Operations

### Check Deployment Status

```bash
kubectl get deployments -n healthcare
kubectl get pods -n healthcare
kubectl get services -n healthcare
```

### View Logs

```bash
# View logs from a deployment
kubectl logs deployment/api-gateway -n healthcare

# Follow logs in real-time
kubectl logs -f deployment/api-gateway -n healthcare

# View logs from a specific pod
kubectl logs <pod-name> -n healthcare
```

### Port Forwarding (Local Development)

```bash
# Forward API Gateway
kubectl port-forward svc/api-gateway 8080:80 -n healthcare

# Forward Client (in another terminal)
kubectl port-forward svc/client 3000:3000 -n healthcare

# Forward Auth Service
kubectl port-forward svc/auth-service 8088:8088 -n healthcare
```

### Scale Services

```bash
# Scale API Gateway to 3 replicas
kubectl scale deployment api-gateway --replicas=3 -n healthcare

# Check updated status
kubectl get deployments -n healthcare
```

### Update Service Image

```bash
kubectl set image deployment/api-gateway \
  api-gateway=api-gateway:v2 \
  -n healthcare
```

### Restart Deployment

```bash
kubectl rollout restart deployment/api-gateway -n healthcare
```

## 🩺 Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n healthcare

# Check pod logs
kubectl logs <pod-name> -n healthcare

# Check resource availability
kubectl top nodes
kubectl top pods -n healthcare
```

### Service Not Accessible

```bash
# Check service status
kubectl describe service api-gateway -n healthcare

# Test service connectivity
kubectl exec -it <pod-name> -n healthcare -- curl http://api-gateway:8080

# Check DNS resolution
kubectl exec -it <pod-name> -n healthcare -- nslookup api-gateway
```

### Database Connection Issues

```bash
# Check secrets
kubectl get secrets -n healthcare
kubectl describe secret mongo-credentials -n healthcare

# Test connectivity from pod
kubectl exec -it <pod-name> -n healthcare -- \
  curl "mongodb+srv://username:password@host/database"
```

## 🧹 Cleanup

### Remove All Resources

```bash
# Using namespace deletion (removes everything)
kubectl delete namespace healthcare

# Or using the cleanup script
./k8s/cleanup.sh
```

### Remove Specific Service

```bash
kubectl delete deployment <service-name> -n healthcare
kubectl delete service <service-name> -n healthcare
```

## 📦 Deployment Environments

### Local Development

```bash
# Using port-forwarding
kubectl port-forward svc/api-gateway 8080:80 -n healthcare
kubectl port-forward svc/client 3000:3000 -n healthcare
```

### Production

For production deployment, consider:
1. Using private Docker registries
2. Setting resource quotas and limits
3. Implementing autoscaling (HPA)
4. Using persistent volumes for data
5. Setting up monitoring and logging
6. Configuring TLS/SSL for services
7. Using NetworkPolicies for security

## 📚 Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

## 🤝 Support

For issues or questions:
1. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed documentation
2. Review pod logs: `kubectl logs deployment/<service> -n healthcare`
3. Check events: `kubectl get events -n healthcare`

---

**Last Updated**: April 2026
**Platform**: Healthcare Microservices System v1.0
