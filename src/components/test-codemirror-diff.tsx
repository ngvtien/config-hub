import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CodeMirrorDiffDialog } from './codemirror-diff-dialog'
import { DebugFirstFileOnly } from './debug-first-file-only'

export function TestCodeMirrorDiff() {
  const [showDiff, setShowDiff] = useState(false)
  const [showPRDiff, setShowPRDiff] = useState(false)
  const [showCombinedDiff, setShowCombinedDiff] = useState(false)

  const originalContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: nginx:1.20
        ports:
        - containerPort: 80`

  const modifiedContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        version: v2
    spec:
      containers:
      - name: my-app
        image: nginx:1.21
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"`

  // Test both scenarios: separate files and combined diff
  const testSeparateFileDiffs = [
    {
      path: 'Chart.yaml',
      diff: `diff --git a/Chart.yaml b/Chart.yaml
--- a/Chart.yaml
+++ b/Chart.yaml
@@ -1,4 +1,4 @@
 name: my-chart
 description: A Helm chart
-version: 1.0.0
+version: 2.0.0
 type: application`
    },
    {
      path: 'values.yaml',
      diff: `diff --git a/values.yaml b/values.yaml
--- a/values.yaml
+++ b/values.yaml
@@ -1,4 +1,4 @@
 image:
   repository: nginx
   tag: latest
-replicaCount: 1
+replicaCount: 3`
    }
  ]

  // Test combined diff (this is probably what the API returns)
  const testCombinedDiff = [{
    path: 'combined',
    diff: `diff --git a/Chart.yaml b/Chart.yaml
index 1234567..abcdefg 100644
--- a/Chart.yaml
+++ b/Chart.yaml
@@ -1,4 +1,4 @@
 name: my-chart
 description: A Helm chart
-version: 1.0.0
+version: 2.0.0
 type: application
diff --git a/values.yaml b/values.yaml
index 7890abc..def1234 100644
--- a/values.yaml
+++ b/values.yaml
@@ -1,4 +1,4 @@
 image:
   repository: nginx
   tag: latest
-replicaCount: 1
+replicaCount: 3`
  }]

  return (
    <div className="p-4 space-y-4">
      <Button onClick={() => setShowDiff(true)}>
        Test Single File Diff
      </Button>

      <Button onClick={() => setShowPRDiff(true)}>
        Test Separate File Diffs
      </Button>

      <Button onClick={() => setShowCombinedDiff(true)}>
        Test Combined Diff (Real API Format)
      </Button>

      <CodeMirrorDiffDialog
        open={showDiff}
        onOpenChange={setShowDiff}
        fileName="deployment.yaml"
        filePath="k8s/deployment.yaml"
        branch="main"
        originalContent={originalContent}
        modifiedContent={modifiedContent}
        language="yaml"
        onCreatePullRequest={() => {
          console.log('Create PR clicked')
          setShowDiff(false)
        }}
        onRevert={() => {
          console.log('Revert clicked')
          setShowDiff(false)
        }}
      />

      {/* Test PR Diff Dialog */}
      <Dialog open={showPRDiff} onOpenChange={setShowPRDiff}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Test Multi-File PR Diff</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <DebugFirstFileOnly
              fileDiffs={testSeparateFileDiffs}
              theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Combined Diff Dialog */}
      <Dialog open={showCombinedDiff} onOpenChange={setShowCombinedDiff}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Test Combined Diff (Real API Format)</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <DebugFirstFileOnly
              fileDiffs={testCombinedDiff}
              theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}