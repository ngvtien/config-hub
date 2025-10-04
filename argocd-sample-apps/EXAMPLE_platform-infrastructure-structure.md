# Platform Infrastructure Repository Structure

This document shows the recommended structure for the `platform-infrastructure` repository.

## Directory Structure

```
platform-infrastructure/
├── applicationsets/
│   ├── 11-product-customer-matrix-set.yaml
│   ├── 12-product-by-environment-set.yaml
│   └── 13-customer-product-list-set.yaml
├── products/
│   ├── product-a/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── deployment.yaml
│   │       ├── service.yaml
│   │       └── ingress.yaml
│   ├── product-b/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   └── product-c/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── base-manifests/
│   ├── databases/
│   │   ├── postgres/
│   │   └── redis/
│   └── monitoring/
│       ├── prometheus/
│       └── grafana/
├── charts/
│   └── (external chart references)
└── README.md
```

## Example Product Chart

### products/product-a/Chart.yaml
```yaml
apiVersion: v2
name: product-a
description: Product A Helm Chart
type: application
version: 1.0.0
appVersion: "1.0.0"
```

### products/product-a/values.yaml
```yaml
# Default values - can be overridden by customer-configs
replicaCount: 2

image:
  repository: myregistry/product-a
  pullPolicy: IfNotPresent
  tag: ""

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: nginx
  annotations: {}
  hosts: []
  tls: []

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

### products/product-a/templates/deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "product-a.fullname" . }}
  labels:
    {{- include "product-a.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "product-a.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "product-a.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        resources:
          {{- toYaml .Values.resources | nindent 12 }}
```

## Benefits

- **Version Control**: All infrastructure as code
- **Reusability**: Shared Helm charts for all customers
- **Consistency**: Same deployment patterns across products
- **GitOps**: ArgoCD ApplicationSets automatically deploy from this repo
