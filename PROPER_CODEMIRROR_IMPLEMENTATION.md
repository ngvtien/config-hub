# Proper CodeMirror Implementation

## Current Issue
We're using a custom textarea with syntax highlighting overlay, which causes:
- Re-rendering issues
- Poor performance
- Not a real code editor experience

## Reference Implementation
The `.output/codebase` uses proper CodeMirror with `@uiw/react-codemirror`.

## Installation Required

```bash
npm install @uiw/react-codemirror
```

We already have:
- ✅ `@codemirror/lang-yaml`
- ✅ `@codemirror/lang-json`
- ✅ `@codemirror/view`
- ✅ Other CodeMirror packages

## Implementation

### Replace src/components/codemirror-editor.tsx with:

```typescript
import { memo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { json } from '@codemirror/lang-json'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: 'light' | 'dark'
  readOnly?: boolean
  onValidationChange?: (status: string, errors: string[]) => void
}

const CodeMirrorEditorComponent = ({
  value,
  onChange,
  language = 'yaml',
  theme = 'light',
  readOnly = false,
}: CodeMirrorEditorProps) => {
  const extensions = []
  
  if (language === 'yaml') extensions.push(yaml())
  if (language === 'json') extensions.push(json())
  if (readOnly) extensions.push(EditorView.editable.of(false))
  
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme === 'dark' ? oneDark : 'light'}
      extensions={extensions}
      onChange={(value) => onChange(value)}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
      }}
      className="h-full"
    />
  )
}

export const CodeMirrorEditor = memo(CodeMirrorEditorComponent)
```

## Benefits

### Performance:
- ✅ **No re-rendering issues** - CodeMirror manages its own state
- ✅ **Efficient updates** - Only updates changed parts
- ✅ **Better memory usage** - Proper virtual scrolling

### Features:
- ✅ **Real code editor** - Not a textarea hack
- ✅ **Syntax highlighting** - Built-in, not overlay
- ✅ **Code folding** - Collapse/expand sections
- ✅ **Line numbers** - Proper gutter
- ✅ **Search/replace** - Built-in
- ✅ **Multiple cursors** - Advanced editing

### User Experience:
- ✅ **Smooth scrolling** - No lag
- ✅ **Fast typing** - No input delay
- ✅ **Professional feel** - Like VS Code

## Migration Steps

1. Install package:
   ```bash
   npm install @uiw/react-codemirror
   ```

2. Replace `src/components/codemirror-editor.tsx` with proper implementation

3. Test all editors:
   - values.yaml form view
   - secrets.yaml form view
   - Regular YAML editing

4. Remove old textarea-based code

## Expected Results

- ✅ **No more re-rendering issues** in values.yaml
- ✅ **Smooth editing experience**
- ✅ **Better performance**
- ✅ **Professional code editor**

This is the proper solution that the reference codebase uses!
