# Git Commit Summary: Configurable ArgoCD API Polling Interval

## Overview
Made the ArgoCD API polling interval configurable via the Settings page, allowing users to customize how frequently the application polls the GET /applications endpoint.

## Changes Made

### 1. Backend/Settings Changes

#### `src/hooks/use-environment-settings.ts`
- Added `refreshInterval: number` field to `argocd` settings interface
- Set default value to 30 seconds
- Type: number (represents seconds)

#### `src/components/settings-page.tsx`
- Added "Auto-Refresh (seconds)" input field in ArgoCD settings section
- Changed grid layout from 2 columns to 3 columns to accommodate new field
- Input validation: min=5, max=300 seconds
- Added helper text: "Polling interval: 5-300 seconds"
- Field updates settings in real-time via `updateSection`

### 2. Frontend/UI Changes

#### `src/components/argocd-page.tsx`
- Added import for `useEnvironmentSettings` hook
- Reads `refreshInterval` from settings (defaults to 30 if not set)
- Converts seconds to milliseconds for `useArgoCD` hook
- Passes dynamic `refreshInterval` to `useArgoCD` instead of hardcoded 30000ms

### 3. Documentation Updates

#### `ARGOCD_UI_GUIDE.md`
- Updated "Auto-Refresh" section with configuration details
- Added new "Step 1: Configure Settings (Optional)" with instructions
- Renumbered subsequent steps (Step 2-6)
- Clarified that interval is configurable (5-300 seconds)
- Added path to settings: Settings → ArgoCD → Auto-Refresh

#### `ARGOCD_NEW_FEATURES.md`
- Updated feature #7 from "Auto-Refresh" to "Configurable Auto-Refresh"
- Added range information: (5-300 seconds, default: 30)

#### `SAMPLE_APPS_README.md`
- Enhanced "Auto-Refresh Behavior" section
- Added "Configuration" line with settings path
- Added new "Adjusting the Interval" subsection with guidance:
  - Lower values (5-15s): More responsive, higher API load
  - Default (30s): Balanced responsiveness and performance
  - Higher values (60-300s): Reduced API load, less frequent updates

#### `src/components/help/help-dialog.tsx`
- Added "Configurable auto-refresh interval (5-300 seconds)" to features list
- Added new "Auto-Refresh Configuration" card with details:
  - Default: 30 seconds
  - Configurable range: 5-300 seconds
  - Settings path
  - API endpoint information
  - What gets updated
  - Manual refresh option

## Technical Details

### Configuration Flow
1. User sets value in Settings → ArgoCD → Auto-Refresh field
2. Value stored in localStorage via `useEnvironmentSettings`
3. `ArgoCDPage` component reads value on mount/update
4. Converts seconds to milliseconds
5. Passes to `useArgoCD` hook's `refreshInterval` parameter
6. Hook uses value in `setInterval` for polling

### Validation
- Input type: number
- Min value: 5 seconds (prevents excessive API calls)
- Max value: 300 seconds (5 minutes, prevents stale data)
- Default: 30 seconds (balanced approach)
- Fallback: If not set or invalid, defaults to 30 seconds

### User Experience
- Setting persists across sessions (localStorage)
- Changes take effect on next page load/refresh
- No application restart required
- Clear guidance in UI and documentation
- Visible in Settings page with helper text

## Benefits

1. **Flexibility**: Users can adjust based on their needs
2. **Performance**: Reduce API load for less critical environments
3. **Responsiveness**: Increase frequency for production monitoring
4. **Resource Management**: Balance between freshness and API usage
5. **User Control**: Empowers users to optimize for their use case

## Testing Recommendations

1. Set interval to 5 seconds, verify rapid updates
2. Set interval to 300 seconds, verify slower updates
3. Test with invalid values (negative, zero, >300)
4. Verify default of 30 seconds when not configured
5. Check localStorage persistence across sessions
6. Verify no breaking changes to existing functionality

## Migration Notes

- Existing users will automatically get default of 30 seconds
- No breaking changes to API or data structures
- Backward compatible with existing settings
- No database migrations required (localStorage only)

## Files Modified

### Code Files (4)
1. `src/hooks/use-environment-settings.ts` - Added refreshInterval field
2. `src/components/settings-page.tsx` - Added UI input field
3. `src/components/argocd-page.tsx` - Read and use dynamic interval
4. `src/components/help/help-dialog.tsx` - Added help documentation

### Documentation Files (3)
1. `ARGOCD_UI_GUIDE.md` - Updated auto-refresh section and steps
2. `ARGOCD_NEW_FEATURES.md` - Updated feature description
3. `SAMPLE_APPS_README.md` - Enhanced auto-refresh behavior section

## Suggested Commit Message

```
feat: add configurable ArgoCD API polling interval

Allow users to customize the ArgoCD GET /applications polling interval
via Settings page. Configurable range: 5-300 seconds (default: 30).

Changes:
- Add refreshInterval field to ArgoCD settings (5-300 seconds)
- Add Auto-Refresh input field in Settings → ArgoCD page
- Update ArgoCDPage to use dynamic interval from settings
- Update documentation with configuration instructions
- Add help dialog section explaining auto-refresh configuration

Benefits:
- Users can reduce API load for non-critical environments
- Increase polling frequency for production monitoring
- Better resource management and user control
- Maintains backward compatibility (defaults to 30 seconds)

Files modified:
- src/hooks/use-environment-settings.ts
- src/components/settings-page.tsx
- src/components/argocd-page.tsx
- src/components/help/help-dialog.tsx
- ARGOCD_UI_GUIDE.md
- ARGOCD_NEW_FEATURES.md
- SAMPLE_APPS_README.md
```

## Alternative Shorter Commit Message

```
feat: configurable ArgoCD polling interval

Add user-configurable auto-refresh interval (5-300s, default: 30s) for
ArgoCD API polling in Settings page. Updates documentation and help.

- Add refreshInterval to ArgoCD settings
- Add UI field in Settings → ArgoCD
- Update ArgoCDPage to use dynamic interval
- Update docs: ARGOCD_UI_GUIDE, ARGOCD_NEW_FEATURES, SAMPLE_APPS_README
- Add help dialog documentation
```
