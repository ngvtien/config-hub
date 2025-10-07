import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, FormInput, Code } from 'lucide-react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { customTheme } from '@/components/json-schema-form-theme'
import * as yaml from 'js-yaml'

// Built-in schema for testing (no Git required!)
const testSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Application Configuration",
  "description": "Configuration schema for application deployment",
  "type": "object",
  "required": ["replicaCount", "image"],
  "properties": {
    "replicaCount": {
      "type": "integer",
      "title": "Replica Count",
      "description": "Number of pod replicas to run",
      "default": 1,
      "minimum": 1,
      "maximum": 10
    },
    "image": {
      "type": "object",
      "title": "Container Image",
      "description": "Docker image configuration",
      "required": ["repository", "tag"],
      "properties": {
        "repository": {
          "type": "string",
          "title": "Repository",
          "description": "Docker image repository name",
          "examples": ["nginx", "myapp"]
        },
        "tag": {
          "type": "string",
          "title": "Tag",
          "description": "Docker image tag",
          "default": "latest",
          "pattern": "^[a-zA-Z0-9._-]+$"
        },
        "pullPolicy": {
          "type": "string",
          "title": "Pull Policy",
          "description": "Image pull policy",
          "enum": ["Always", "IfNotPresent", "Never"],
          "default": "IfNotPresent"
        }
      }
    },
    "environment": {
      "type": "string",
      "title": "Environment",
      "description": "Deployment environment",
      "enum": ["development", "staging", "production"],
      "default": "development"
    },
    "adminEmail": {
      "type": "string",
      "title": "Admin Email",
      "description": "Administrator email address",
      "format": "email",
      "examples": ["admin@example.com"]
    },
    "externalUrl": {
      "type": "string",
      "title": "External URL",
      "description": "External application URL",
      "format": "uri",
      "examples": ["https://app.example.com"]
    },
    "ingress": {
      "type": "object",
      "title": "Ingress Configuration",
      "properties": {
        "enabled": {
          "type": "boolean",
          "title": "Enable Ingress",
          "description": "Enable ingress for external access",
          "default": false
        },
        "host": {
          "type": "string",
          "title": "Hostname",
          "description": "Ingress hostname",
          "examples": ["app.example.com"]
        }
      }
    },
    "features": {
      "type": "array",
      "title": "Enabled Features",
      "description": "List of enabled feature flags",
      "items": {
        "type": "string",
        "enum": ["authentication", "monitoring", "logging", "caching"]
      },
      "uniqueItems": true
    }
  }
}

// Initial form data
const initialFormData = {
  replicaCount: 3,
  image: {
    repository: "myapp",
    tag: "1.2.3",
    pullPolicy: "IfNotPresent"
  },
  environment: "production",
  adminEmail: "admin@example.com",
  externalUrl: "https://app.example.com",
  ingress: {
    enabled: true,
    host: "app.example.com"
  },
  features: ["authentication", "monitoring", "logging"]
}

// Generate UI schema for better widget selection
function generateUISchema(schema: any): any {
  const uiSchema: any = {}
  
  if (!schema || !schema.properties) return uiSchema
  
  Object.keys(schema.properties).forEach((key) => {
    const prop = schema.properties[key]
    uiSchema[key] = {}
    
    if (prop.type === 'string') {
      if (prop.format === 'email') {
        uiSchema[key]['ui:widget'] = 'EmailWidget'
      } else if (prop.format === 'uri' || prop.format === 'url') {
        uiSchema[key]['ui:widget'] = 'URLWidget'
      }
    }
    
    if (prop.enum && Array.isArray(prop.enum) && prop.enum.length <= 5) {
      uiSchema[key]['ui:widget'] = 'RadioWidget'
    }
    
    if ((prop.type === 'number' || prop.type === 'integer') && 
        prop.minimum !== undefined && 
        prop.maximum !== undefined &&
        (prop.maximum - prop.minimum) <= 100) {
      uiSchema[key]['ui:widget'] = 'RangeWidget'
    }
    
    if (prop.type === 'object' && prop.properties) {
      uiSchema[key] = {
        ...uiSchema[key],
        ...generateUISchema(prop)
      }
    }
    
    if (prop.type === 'array') {
      uiSchema[key] = {
        ...uiSchema[key],
        'ui:options': {
          orderable: true,
          addable: true,
          removable: true,
        }
      }
    }
  })
  
  return uiSchema
}

export function TestFormGeneration() {
  const [formData, setFormData] = useState(initialFormData)
  const [yamlOutput, setYamlOutput] = useState('')
  const [showYaml, setShowYaml] = useState(false)
  const [saveResult, setSaveResult] = useState<string | null>(null)

  const handleFormChange = (data: any) => {
    setFormData(data.formData)
    setSaveResult(null)
  }

  const handleGenerateYaml = () => {
    try {
      const yamlContent = yaml.dump(formData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
      setYamlOutput(yamlContent)
      setShowYaml(true)
      setSaveResult('✅ YAML generated successfully!')
    } catch (err) {
      setSaveResult('❌ Failed to generate YAML: ' + (err as Error).message)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎨 Form Generation Test</h1>
        <p className="text-muted-foreground">
          Interactive demo of JSON Schema form generation - No Git required!
        </p>
      </div>

      {/* Success Message */}
      {saveResult && (
        <Alert className="mb-6 border-green-600 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600 dark:text-green-400">
            {saveResult}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FormInput className="h-5 w-5" />
            Interactive Form Demo
          </CardTitle>
          <CardDescription>
            Edit the form below and see the generated YAML output
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>This demo shows all the form generation features:</p>
            <ul className="space-y-1 text-muted-foreground ml-4">
              <li>🎚️ <strong>Slider</strong> for replica count (1-10)</li>
              <li>🔘 <strong>Radio buttons</strong> for environment (dev/staging/prod)</li>
              <li>📧 <strong>Email input</strong> with validation</li>
              <li>🔗 <strong>URL input</strong> with validation</li>
              <li>📦 <strong>Nested object</strong> for image configuration</li>
              <li>☑️ <strong>Checkbox</strong> for ingress enabled</li>
              <li>➕ <strong>Array controls</strong> with add/remove for features</li>
            </ul>
            <p className="text-primary font-medium mt-4">
              Try changing values and click "Generate YAML" to see the output!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* The Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Form</CardTitle>
            <CardDescription>
              Automatically generated from JSON Schema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <Form
                schema={testSchema}
                formData={formData}
                validator={validator}
                onChange={handleFormChange}
                onSubmit={() => {}}
                onError={(errors) => {
                  console.log('Form validation errors:', errors)
                }}
                {...customTheme}
                uiSchema={generateUISchema(testSchema)}
                showErrorList="top"
                liveValidate={false}
                noHtml5Validate={true}
              >
                {/* Hide the default submit button */}
                <div style={{ display: 'none' }}>
                  <button type="submit" />
                </div>
              </Form>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={handleGenerateYaml}
                className="w-full"
                size="lg"
              >
                <Code className="w-4 h-4 mr-2" />
                Generate YAML
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: YAML Output */}
        <Card>
          <CardHeader>
            <CardTitle>YAML Output</CardTitle>
            <CardDescription>
              Generated from form data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showYaml ? (
              <div className="max-h-[600px] overflow-y-auto">
                <pre className="bg-muted p-4 rounded-md text-xs font-mono">
                  {yamlOutput}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                <div className="text-center">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Generate YAML" to see the output</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Form Generation Features</CardTitle>
          <CardDescription>All features demonstrated in this form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Widget Types:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Text inputs</li>
                <li>✓ Number sliders</li>
                <li>✓ Radio buttons</li>
                <li>✓ Checkboxes</li>
                <li>✓ Email inputs</li>
                <li>✓ URL inputs</li>
                <li>✓ Nested objects</li>
                <li>✓ Arrays</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Validation:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Required fields (*)</li>
                <li>✓ Min/max ranges</li>
                <li>✓ Pattern matching</li>
                <li>✓ Format validation</li>
                <li>✓ Real-time errors</li>
                <li>✓ Field descriptions</li>
                <li>✓ Default values</li>
                <li>✓ Validation hints</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Smart Selection:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Auto widget selection</li>
                <li>✓ Format detection</li>
                <li>✓ Enum optimization</li>
                <li>✓ Range sliders</li>
                <li>✓ Nested handling</li>
                <li>✓ Array controls</li>
                <li>✓ Type conversion</li>
                <li>✓ YAML sync</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
