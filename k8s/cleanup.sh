#!/bin/bash

# Script to delete all Kubernetes resources for healthcare microservices

set -e

NAMESPACE="healthcare"

echo "=========================================="
echo "Healthcare Microservices K8s Cleanup"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Confirm deletion
read -p "Are you sure you want to delete the $NAMESPACE namespace and all resources? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    print_info "Cleanup cancelled."
    exit 0
fi

print_info "Deleting namespace: $NAMESPACE"
kubectl delete namespace $NAMESPACE --ignore-not-found=true

print_info "Cleanup completed successfully!"
