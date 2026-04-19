#!/bin/bash

# Healthcare Microservices Kubernetes Deployment Script
# This script automates the deployment of all services to Kubernetes

set -e

NAMESPACE="healthcare"
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Healthcare Microservices K8s Deployment"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found. Please install kubectl first."
    exit 1
fi

print_info "kubectl version: $(kubectl version --client --short)"
echo ""

# Step 1: Check cluster connectivity
print_info "Checking Kubernetes cluster connectivity..."
if kubectl cluster-info &> /dev/null; then
    print_info "Connected to cluster: $(kubectl cluster-info | grep 'Kubernetes master')"
else
    print_error "Could not connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi
echo ""

# Step 2: Create namespace
print_info "Creating namespace: $NAMESPACE"
kubectl apply -f "$K8S_DIR/namespace.yaml"
echo ""

# Step 3: Create ConfigMap and Secrets
print_info "Creating ConfigMap and Secrets..."
kubectl apply -f "$K8S_DIR/configmap.yaml"
echo ""

# Step 4: Create RBAC resources
print_info "Creating RBAC resources..."
kubectl apply -f "$K8S_DIR/rbac.yaml"
echo ""

# Step 5: Deploy services in order
print_info "Deploying services..."
echo ""

services=(
    "api-gateway"
    "auth-service-new"
    "appointment-service"
    "doctor-service"
    "patient-service"
    "telemedicine-service"
    "notification-service"
    "payment-service"
    "ai-symptom-service"
    "client"
)

for service in "${services[@]}"; do
    file="$K8S_DIR/${service}.yaml"
    if [ -f "$file" ]; then
        print_info "Deploying $service..."
        kubectl apply -f "$file"
    else
        print_warn "File not found: $file"
    fi
done
echo ""

# Step 6: Apply Ingress (optional)
if [ -f "$K8S_DIR/ingress.yaml" ]; then
    print_info "Deploying Ingress..."
    kubectl apply -f "$K8S_DIR/ingress.yaml"
fi
echo ""

# Step 7: Wait for deployments to be ready
print_info "Waiting for deployments to be ready (timeout: 5 minutes)..."
kubectl rollout status deployment -n $NAMESPACE --all --timeout=5m
echo ""

# Step 8: Display deployment status
print_info "Deployment Status:"
echo ""
kubectl get deployments -n $NAMESPACE
echo ""
kubectl get services -n $NAMESPACE
echo ""
kubectl get pods -n $NAMESPACE
echo ""

# Step 9: Display port forwarding instructions
print_info "Port Forwarding Commands (for local development):"
echo ""
echo "  kubectl port-forward svc/api-gateway 8080:80 -n $NAMESPACE"
echo "  kubectl port-forward svc/client 3000:3000 -n $NAMESPACE"
echo "  kubectl port-forward svc/auth-service 8088:8088 -n $NAMESPACE"
echo ""

# Step 10: Success message
echo ""
print_info "Deployment completed successfully!"
print_info "Use 'kubectl get pods -n $NAMESPACE' to monitor the pods"
print_info "Use 'kubectl logs -f deployment/<service> -n $NAMESPACE' to view logs"
