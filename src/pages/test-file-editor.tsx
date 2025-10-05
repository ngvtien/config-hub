import { useState } from 'react'
import { FileEditorDialog } from '@/components/file-editor-dialog'
import { DiffPreviewDialog } from '@/components/diff-preview-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, FileText, GitCompare } from 'lucide-react'

const sampleYaml = `# Sample Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80`

const sampleJson = `{
  "name": "my-app",
  "version": "1.0.0",
  "description": "Sample application configuration",
  "config": {
    "port": 3000,
    "host": "localhost",
    "database": {
      "host": "db.example.com",
      "port": 5432,
      "name": "myapp_db"
    }
  },
  "features": {
    "authentication": true,
    "logging": true,
    "monitoring": false
  }
}`

const sampleHcl = `# Terraform Configuration
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "HelloWorld"
    Environment = "production"
  }
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}`

const invalidYaml = `# Invalid YAML - missing colon
apiVersion apps/v1
kind: Deployment
metadata
  name: nginx-deployment
  labels:
    app nginx`

interface TestFile {
  name: string
  path: string
  content: string
  description: string
}

const testFiles: TestFile[] = [
  {
    name: 'deployment.yaml',
    path: 'k8s/deployment.yaml',
    content: sampleYaml,
    description: 'Valid Kubernetes YAML with syntax highlighting',
  },
  {
    name: 'config.json',
    path: 'config/config.json',
    content: sampleJson,
    description: 'Valid JSON configuration file',
  },
  {
    name: 'main.tf',
    path: 'terraform/main.tf',
    content: sampleHcl,
    description: 'Terraform HCL configuration',
  },
  {
    name: 'invalid.yaml',
    path: 'test/invalid.yaml',
    content: invalidYaml,
    description: 'Invalid YAML to test validation',
  },
]

export function TestFileEditor() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [diffDialogOpen, setDiffDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<TestFile | null>(null)
  const [saveResult, setSaveResult] = useState<string | null>(null)
  const [savedContent, setSavedContent] = useState<string>('')
  const [modifiedContent, setModifiedContent] = useState<string>('')

  const handleOpenFile = (file: TestFile) => {
    setSelectedFile(file)
    setSaveResult(null)
    setDialogOpen(true)
  }

  const handleViewDiff = (file: TestFile) => {
    setSelectedFile(file)
    // Simulate modified content (add some changes)
    const modified = file.content + '\n# Modified by user\nnewKey: newValue'
    setModifiedContent(modified)
    setDiffDialogOpen(true)
  }

  const handleSave = async (content: string) => {
    // Simulate save operation
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setSavedContent(content)
        setModifiedContent(content)
        setSaveResult(`Successfully saved ${selectedFile?.name}`)
        resolve()
      }, 500)
    })
  }

  const handleCreatePR = () => {
    setSaveResult('Pull Request creation would be triggered here')
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">File Editor Dialog Test</h1>
        <p className="text-muted-foreground">
          Test the Monaco Editor integration with YAML validation, syntax highlighting, and save functionality
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

      {/* Test Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {testFiles.map((file) => (
          <Card key={file.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {file.name}
              </CardTitle>
              <CardDescription>{file.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs font-mono text-muted-foreground">
                  Path: {file.path}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleOpenFile(file)} className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={() => handleViewDiff(file)} variant="outline" className="flex-1">
                    <GitCompare className="w-4 h-4 mr-2" />
                    Diff
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features to Test */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Features to Test</CardTitle>
          <CardDescription>Try these features in the editor</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Syntax Highlighting:</strong> Open different file types to see YAML, JSON, and HCL highlighting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Real-time Validation:</strong> Edit YAML/JSON files and watch validation status update</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Error Display:</strong> Open invalid.yaml to see validation errors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Theme Switching:</strong> Toggle dark/light mode to see editor theme adapt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Keyboard Shortcuts:</strong> Press Ctrl+S (or Cmd+S) to save</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Save Protection:</strong> Try to save invalid YAML - button should be disabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Unsaved Changes:</strong> Make changes and try to close - should show confirmation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Diff Preview:</strong> Click "Diff" button to see side-by-side comparison with statistics</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Saved Content Preview */}
      {savedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Last Saved Content</CardTitle>
            <CardDescription>Preview of what was saved</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs font-mono">
              {savedContent}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* File Editor Dialog */}
      {selectedFile && (
        <>
          <FileEditorDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            filePath={selectedFile.path}
            fileName={selectedFile.name}
            branch="main"
            initialContent={selectedFile.content}
            onSave={handleSave}
          />
          
          <DiffPreviewDialog
            open={diffDialogOpen}
            onOpenChange={setDiffDialogOpen}
            fileName={selectedFile.name}
            filePath={selectedFile.path}
            branch="main"
            originalContent={selectedFile.content}
            modifiedContent={modifiedContent || selectedFile.content}
            onCreatePullRequest={handleCreatePR}
          />
        </>
      )}
    </div>
  )
}
