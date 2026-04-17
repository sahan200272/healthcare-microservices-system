#!/bin/bash

# Healthcare Microservices - Quick Kubernetes Commands Reference

# ========================================
# DEPLOYMENT & MANAGEMENT
# ========================================

# Deploy all services using Kustomize
# kubectl apply -k k8s/

# Deploy all services (alternative method)
# kubectl apply -f k8s/

# View deployment status
# kubectl get deployments -n healthcare
# kubectl get services -n healthcare
# kubectl get pods -n healthcare -o wide

# View pod details
# kubectl describe pod <pod-name> -n healthcare

# View deployment logs
# kubectl logs deployment/<service-name> -n healthcare
# kubectl logs -f deployment/<service-name> -n healthcare  # Follow logs

# Rollout status
# kubectl rollout status deployment/<service-name> -n healthcare

# ========================================
# PORT FORWARDING (LOCAL DEVELOPMENT)
# ========================================

# Forward API Gateway (http://localhost:8080)
# kubectl port-forward svc/api-gateway 8080:80 -n healthcare

# Forward Client (http://localhost:3000)
# kubectl port-forward svc/client 3000:3000 -n healthcare

# Forward Auth Service (http://localhost:8088)
# kubectl port-forward svc/auth-service 8088:8088 -n healthcare

# Forward Appointment Service (http://localhost:8082)
# kubectl port-forward svc/appointment-service 8082:8082 -n healthcare

# ========================================
# SCALING & UPDATES
# ========================================

# Scale a deployment
# kubectl scale deployment <service-name> --replicas=3 -n healthcare

# Update image
# kubectl set image deployment/<service-name> <service-name>=<new-image>:tag -n healthcare

# Restart deployment
# kubectl rollout restart deployment/<service-name> -n healthcare

# ========================================
# DEBUGGING & TROUBLESHOOTING
# ========================================

# Execute commands inside a pod
# kubectl exec -it <pod-name> -n healthcare -- /bin/bash
# kubectl exec -it <pod-name> -n healthcare -- /bin/sh

# Test service connectivity from within cluster
# kubectl exec -it <pod-name> -n healthcare -- curl http://api-gateway:8080

# Check service DNS
# kubectl exec -it <pod-name> -n healthcare -- nslookup api-gateway

# View events
# kubectl get events -n healthcare
# kubectl get events -n healthcare --sort-by='.lastTimestamp'

# Resource usage
# kubectl top nodes
# kubectl top pods -n healthcare

# ========================================
# CONFIGURATION MANAGEMENT
# ========================================

# View ConfigMap
# kubectl get configmap -n healthcare
# kubectl describe configmap healthcare-config -n healthcare

# View Secrets
# kubectl get secret -n healthcare
# kubectl describe secret mongo-credentials -n healthcare

# Edit ConfigMap
# kubectl edit configmap healthcare-config -n healthcare

# ========================================
# CLUSTER INFO
# ========================================

# Cluster information
# kubectl cluster-info
# kubectl get nodes
# kubectl describe node <node-name>

# Get API resources
# kubectl api-resources

# ========================================
# CLEANUP
# ========================================

# Delete specific service
# kubectl delete deployment <service-name> -n healthcare

# Delete all resources in namespace
# kubectl delete all --all -n healthcare

# Delete namespace (removes all resources)
# kubectl delete namespace healthcare

# ========================================
# USEFUL ALIASES (Add to ~/.bashrc or ~/.zshrc)
# ========================================

# alias k='kubectl'
# alias kgp='kubectl get pods -n healthcare'
# alias kgd='kubectl get deployments -n healthcare'
# alias kgs='kubectl get services -n healthcare'
# alias kl='kubectl logs -f'
# alias kdesc='kubectl describe'
# alias kex='kubectl exec -it'

echo "Healthcare Microservices - Kubernetes Commands Reference"
echo "Uncomment the commands you want to run and execute this file or copy-paste commands directly to terminal"
