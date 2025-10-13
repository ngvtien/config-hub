# Form-Based Editing Test

## How to Test the Form View

1. **Create a test schema file** (e.g., `values.schema.json`):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Application Configuration",
  "description": "Configuration values for the application",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "title": "Replica Count",
      "description": "Number of replicas to run",
      "minimum": 1,
      "maximum": 10,
      "default": 1
    },
    "image": {
      "type": "object",
      "title": "Container Image",
      "properties": {
        "repository": {
          "type": "string",
          "title": "Repository",
          "description": "Docker image repository",
          "default": "nginx"
        },
        "tag": {
          "type": "string",
          "title": "Tag",
          "description": "Image tag",
          "default": "latest"
        },
        "pullPolicy": {
          "type": "string",
          "title": "Pull Policy",
          "enum": ["Always", "IfNotPresent", "Never"],
          "default": "IfNotPresent"
        }
      },
      "required": ["repository", "tag"]
    },
    "service": {
      "type": "object",
      "title": "Service Configuration",
      "properties": {
        "type": {
          "type": "string",
          "title": "Service Type",
          "enum": ["ClusterIP", "NodePort", "LoadBalancer"],
          "default": "ClusterIP"
        },
        "port": {
          "type": "integer",
          "title": "Port",
          "minimum": 1,
          "maximum": 65535,
          "default": 80
        }
      }
    },
    "ingress": {
      "type": "object",
      "title": "Ingress Configuration",
      "properties": {
        "enabled": {
          "type": "boolean",
          "title": "Enable Ingress",
          "default": false
        },
        "host": {
          "type": "string",
          "title": "Host",
          "format": "hostname",
          "description": "Ingress hostname"
        },
        "tls": {
          "type": "boolean",
          "title": "Enable TLS",
          "default": false
        }
      }
    }
  },
  "required": ["replicaCount", "image"]
}
```

2. **Create corresponding YAML file** (e.g., `values.yaml`):
```yaml
replicaCount: 1

image:
  repository: nginx
  tag: "1.21"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  host: ""
  tls: false
```

## Expected Behavior

1. **YAML View**: Shows Monaco editor with syntax highlighting and validation
2. **Form View**: 
   - Only available when schema file exists
   - Shows structured form with proper field types:
     - Number inputs for integers with min/max validation
     - Dropdowns for enums
     - Checkboxes for booleans
     - Text inputs for strings
     - Grouped sections for objects
   - Real-time validation with error messages
   - Changes sync back to YAML automatically

## Form Features Implemented

✅ **Field Types**:
- Text inputs (with validation)
- Number inputs (with range validation)
- Checkboxes for booleans
- Select dropdowns for enums
- Email/URL/Password inputs for formatted strings
- Textarea for long strings

✅ **Validation**:
- Required field indicators
- Min/max length for strings
- Min/max values for numbers
- Pattern validation
- Real-time error display

✅ **UI Enhancements**:
- Proper labels and descriptions
- Help text from schema descriptions
- Grouped object fields
- Array support with add/remove
- Read-only field indicators

✅ **Integration**:
- Seamless YAML ↔ Form switching
- Changes sync automatically
- Schema auto-detection
- Template file detection (disables form view)