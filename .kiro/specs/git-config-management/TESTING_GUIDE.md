# File Editor Testing Guide

## How to Access the Test Page

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Navigate to the test page:**
   - From the dashboard, click the **"Test File Editor"** button in the "Test Pages" section
   - Or navigate directly by clicking on the sidebar

## Test Files Available

### 1. deployment.yaml
- **Type:** Valid Kubernetes YAML
- **Purpose:** Test YAML syntax highlighting and validation
- **What to test:**
  - Syntax highlighting for YAML
  - Real-time validation (should show green checkmark)
  - Edit and watch validation update
  - Save functionality

### 2. config.json
- **Type:** Valid JSON configuration
- **Purpose:** Test JSON syntax highlighting and validation
- **What to test:**
  - JSON syntax highlighting
  - Bracket matching and colorization
  - Validation on edit
  - Format on paste

### 3. main.tf
- **Type:** Terraform HCL configuration
- **Purpose:** Test custom HCL language support
- **What to test:**
  - HCL syntax highlighting (keywords, strings, comments)
  - No validation (HCL doesn't have validation)
  - Code folding
  - Auto-closing brackets

### 4. invalid.yaml
- **Type:** Invalid YAML with syntax errors
- **Purpose:** Test validation error display
- **What to test:**
  - Red validation status indicator
  - Error messages with line/column numbers
  - Save button should be disabled
  - Error alert displayed above editor

## Features to Test

### ✅ Syntax Highlighting
1. Open each file type (YAML, JSON, HCL)
2. Verify colors for:
   - Keywords (blue)
   - Strings (green/orange)
   - Numbers (light green)
   - Comments (gray)
   - Brackets (rainbow colors)

### ✅ Real-time Validation
1. Open `deployment.yaml`
2. Make it invalid (e.g., remove a colon)
3. Wait 300ms - validation status should turn red
4. Fix the error - status should turn green
5. Check that error messages show line numbers

### ✅ Theme Switching
1. Open any file
2. Toggle between light and dark mode (use theme switcher in header)
3. Verify editor theme changes instantly:
   - Light mode: white background
   - Dark mode: dark background
4. Check that syntax colors adapt to theme

### ✅ Keyboard Shortcuts
1. Open any file
2. Make some changes
3. Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)
4. Verify save happens (success message appears)
5. Check that "Press Ctrl+S to save" hint is visible in footer

### ✅ Save Protection
1. Open `invalid.yaml`
2. Try to click the Save button
3. Verify:
   - Button is disabled (grayed out)
   - Error message explains why
   - Cannot save until errors are fixed

### ✅ Unsaved Changes Warning
1. Open any file
2. Make changes (don't save)
3. Try to close the dialog (click X or Cancel)
4. Verify confirmation dialog appears
5. Test both "Stay" and "Leave" options

### ✅ Loading States
1. Open any file
2. Make changes and click Save
3. Verify:
   - Spinner appears on Save button
   - Button is disabled during save
   - Success message after save completes

### ✅ Editor Features
1. **Line Numbers:** Verify they're visible
2. **Word Wrap:** Long lines should wrap
3. **Indentation Guides:** Vertical lines showing indentation
4. **Bracket Matching:** Click on a bracket, its pair should highlight
5. **Auto-completion:** Start typing in YAML/JSON, suggestions should appear
6. **Font:** Should use JetBrains Mono with ligatures

## Expected Behavior

### Valid Files
- ✅ Green checkmark with "Valid YAML/JSON"
- ✅ Save button enabled when changes made
- ✅ No error messages
- ✅ Smooth editing experience

### Invalid Files
- ❌ Red alert icon with "Invalid YAML/JSON"
- ❌ Save button disabled
- ❌ Error messages displayed with line numbers
- ❌ Cannot save until fixed

### During Validation
- 🔄 Spinner with "Validating..."
- 🔄 Brief delay (300ms) after typing stops
- 🔄 Save button disabled

## Common Issues to Check

### Issue: Validation not working
- **Check:** Is the file YAML or JSON? (Other formats don't validate)
- **Check:** Wait 300ms after typing for debounce

### Issue: Theme not switching
- **Check:** Toggle theme in app header
- **Check:** Editor should update within 1 second

### Issue: Keyboard shortcut not working
- **Check:** Dialog must be open
- **Check:** Try both Ctrl+S and Cmd+S
- **Check:** Check browser console for errors

### Issue: Save button always disabled
- **Check:** Have you made changes?
- **Check:** Is validation passing?
- **Check:** Is validation still in progress?

## Performance Checks

1. **Large Files:** Try pasting a large YAML file (1000+ lines)
   - Should load smoothly
   - Scrolling should be smooth
   - Validation should complete within 1 second

2. **Rapid Typing:** Type quickly in the editor
   - No lag or stuttering
   - Validation should debounce properly
   - Only validates after you stop typing

3. **Theme Switching:** Toggle theme multiple times
   - Should be instant
   - No flashing or artifacts
   - Editor content preserved

## Success Criteria

All features working correctly:
- ✅ Syntax highlighting for YAML, JSON, HCL
- ✅ Real-time validation with 300ms debounce
- ✅ Visual validation status indicator
- ✅ Inline error messages with line numbers
- ✅ Save button protection (disabled on errors)
- ✅ Keyboard shortcuts (Ctrl+S / Cmd+S)
- ✅ Theme switching (light/dark)
- ✅ Unsaved changes warning
- ✅ Loading states during save
- ✅ Clean, professional UI

## Reporting Issues

If you find any issues, note:
1. Which file you were editing
2. What action you took
3. What you expected to happen
4. What actually happened
5. Browser console errors (if any)

## Next Steps

After testing is complete and all features work:
1. Proceed to Phase 5: Form-Based Editor (Tasks 11.1-11.6)
2. Or continue with other Git configuration management tasks
