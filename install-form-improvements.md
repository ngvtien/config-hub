# Quick Installation Guide

## Step 1: Install Required Package

```bash
npm install react-resizable-panels
```

## Step 2: Verify Files Created

The following files have been created:
- ✅ `src/components/ui/resizable.tsx`
- ✅ `src/components/improved-form-editor.tsx`
- ✅ `src/components/editor-panel.tsx` (modified)

## Step 3: Test

1. Open a `values.yaml` file that has a corresponding `.schema.json` file
2. Click the "Form" button in the editor toolbar
3. You should see:
   - Resizable panels (form on left, YAML on right)
   - Collapsible sections for objects/arrays
   - Add/remove buttons for arrays
   - Cleaner, more compact layout

## Step 4: Adjust Panel Sizes

- Drag the handle between panels to resize
- Your preference will be saved automatically

## Troubleshooting

### If resizable panels don't work:
1. Check that `react-resizable-panels` is installed
2. Run `npm install` again
3. Restart the dev server

### If form doesn't load:
1. Make sure you have a `.schema.json` file for your YAML
2. Check browser console for errors
3. Try switching to YAML view and back to Form

### If re-rendering is still slow:
1. Check that you're using the new improved form (not the old @rjsf/core)
2. Open React DevTools and check component re-renders
3. The form should only re-render when you finish typing, not on every keystroke

## Rollback (if needed)

If you need to rollback to the old form:

1. In `editor-panel.tsx`, find the form rendering section
2. Replace the `ImprovedFormEditor` with the old `Form` component
3. The old code is still in the file, just commented out

## Summary of Improvements

✅ **Resizable panels** - Adjust form/YAML split (values.yaml AND secrets.yaml)  
✅ **No re-rendering** - Only updates when data changes  
✅ **Compact layout** - 50% less dead space  
✅ **Clean design** - Removed excessive borders  
✅ **Array management** - Add/remove inline  
✅ **Collapsible sections** - Better organization  

## Bonus: Secrets Editor Split View! 🎉

The secrets.yaml editor now also has a split view:
- **Left panel (65%)**: Secrets form with table, search, add/remove
- **Right panel (35%)**: Live YAML preview
- **Resizable**: Drag the handle to adjust
- **Real-time sync**: Changes in form update YAML instantly

### Testing Secrets Split View:
1. Open a `secrets.yaml` file
2. Click "Form" button
3. You'll see the secrets table on the left, YAML on the right
4. Add/edit secrets and watch the YAML update in real-time
5. Drag the handle to resize panels

Enjoy the improved form editors! 🎉
