# Removed Blocking Dialogs

## Issue
Using `window.alert()` and `window.confirm()` in Electron applications can cause the event loop to block, potentially freezing the application.

## Solution
Replaced all blocking dialogs with React-based AlertDialog components from Radix UI.

## Changes Made

### 1. Created AlertDialog Component
- **File:** `src/components/ui/alert-dialog.tsx`
- Radix UI-based AlertDialog component
- Non-blocking, accessible, and styled with Tailwind

### 2. Created Reusable ConfirmDialog
- **File:** `src/components/confirm-dialog.tsx`
- Wrapper component for common confirmation patterns
- Supports destructive and default variants

### 3. Fixed File Editor Dialog
- **File:** `src/components/file-editor-dialog.tsx`
- **Before:** Used `window.confirm()` when closing with unsaved changes
- **After:** Uses AlertDialog component
- Shows "Discard unsaved changes?" dialog
- Options: "Continue Editing" or "Discard Changes"

### 4. Settings Page (To Do)
- **File:** `src/components/settings-page.tsx`
- Still has `confirm()` calls for deleting credentials
- Should be updated to use ConfirmDialog component

### 5. Parameter Editor (To Do)
- **File:** `src/components/argocd-parameter-editor.tsx`
- Has placeholder `alert()` calls
- Should be replaced with proper toast notifications or dialogs

## Benefits

1. **Non-blocking:** Doesn't freeze the Electron event loop
2. **Better UX:** Styled dialogs that match the app theme
3. **Accessible:** Radix UI components are WCAG compliant
4. **Consistent:** All confirmations use the same pattern
5. **Themeable:** Automatically adapts to light/dark mode

## Usage Example

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog'

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    setShowConfirm(true)
  }

  const handleConfirmDelete = async () => {
    // Perform delete operation
    await deleteItem()
  }

  return (
    <>
      <Button onClick={handleDelete}>Delete</Button>
      
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete Item?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
```

## Remaining Work

1. Update settings-page.tsx to use ConfirmDialog for credential deletion
2. Replace alert() calls in argocd-parameter-editor.tsx with toast notifications
3. Search for any other blocking dialogs in the codebase

## Testing

- [x] File editor cancel with unsaved changes
- [ ] Git credential deletion confirmation
- [ ] Vault credential deletion confirmation
- [ ] ArgoCD credential deletion confirmation
