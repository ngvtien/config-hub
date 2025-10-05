# ArgoCD UI Features Guide

## 🎯 What You Should See

Based on your deployed applications, here's what Config Hub will display:

### Application Status Overview

```
┌─────────────────────────────────────────────────────────────┐
│ ArgoCD Applications                                         │
│ Manage and monitor your ArgoCD applications                 │
│                                  [Test Connection] [Refresh]│
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 🔍 Search Applications                                      │
│                                                              │
│ Product Name: [____________]  Customer: [____________]       │
│ Version: [____________]       Sync Status: [Any status ▼]    │
│                                                              │
│ [Search] [Clear]                                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ nginx-ingress    │ │ metrics-server   │ │ redis            │
│ argocd           │ │ argocd           │ │ argocd           │
│                  │ │                  │ │                  │
│ 🌿 main          │ │ 🌿 main          │ │ 🌿 main          │
│                  │ │                  │ │                  │
│ ✓ Synced         │ │ ✓ Synced         │ │ ⚠ Unknown        │
│ ✓ Healthy        │ │ ✓ Healthy        │ │ ✓ Healthy        │
│                  │ │                  │ │                  │
│ kubernetes.gi... │ │ kubernetes-si... │ │ charts.helm.s... │
│ • demo-apps      │ │ • demo-apps      │ │ • demo-apps      │
└──────────────────┘ └──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ grafana          │ │ prometheus       │ │ cert-manager     │
│ argocd           │ │ argocd           │ │ argocd           │
│                  │ │                  │ │                  │
│ 🌿 main          │ │ 🌿 main          │ │ 🌿 main          │
│                  │ │                  │ │                  │
│ ✓ Synced         │ │ ✓ Synced         │ │ ✓ Synced         │
│ ✓ Healthy        │ │ ⏱ Progressing    │ │ ✓ Healthy        │
│                  │ │                  │ │                  │
│ grafana.githu... │ │ prometheus-co... │ │ charts.jetsta... │
│ • demo-apps      │ │ • demo-apps      │ │ • demo-apps      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## ✅ Features Already Implemented

### 1. **Search by Product** ✓

**How it works:**
- The app extracts product name from labels: `app.kubernetes.io/name`, `product`, or `app`
- Type in "Product Name" field to filter

**Try these searches:**

```
Product Name: "monitoring"
→ Shows: grafana, prometheus, metrics-server

Product Name: "infrastructure"
→ Shows: nginx-ingress, cert-manager

Product Name: "database"
→ Shows: redis
```

### 2. **Filter by Customer** ✓

**How it works:**
- Extracts customer from labels: `customer` or `tenant`
- Type in "Customer Name" field to filter

**Try these searches:**

```
Customer Name: "acme-corp"
→ Shows: redis, grafana

Customer Name: "demo"
→ Shows: nginx-ingress, metrics-server, prometheus, cert-manager
```

### 3. **Filter by Version** ✓

**How it works:**
- Extracts from `app.kubernetes.io/version`, `version` label, or target revision
- Type in "Version/Tag" field to filter

**Try these searches:**

```
Version: "1.0.0"
→ Shows: nginx-ingress, metrics-server

Version: "7.0.0"
→ Shows: redis

Version: "10.0.0"
→ Shows: grafana
```

### 4. **Filter by Sync Status** ✓

**How it works:**
- Dropdown with predefined options
- Filters based on ArgoCD sync status

**Try these filters:**

```
Sync Status: "Synced"
→ Shows: All apps except redis (which is Unknown)

Sync Status: "OutOfSync"
→ Shows: None (all are synced)

Sync Status: "Unknown"
→ Shows: redis
```

### 5. **Filter by Health Status** ✓

**How it works:**
- Filters based on ArgoCD health status
- Shows color-coded badges

**Current statuses from your apps:**

```
Health Status: "Healthy"
→ Shows: nginx-ingress, metrics-server, redis, grafana, cert-manager

Health Status: "Progressing"
→ Shows: prometheus (still deploying)

Health Status: "Degraded"
→ Shows: None (all healthy or progressing)
```

### 6. **View Application Details** ✓

**How it works:**
- Click any application card
- Opens detailed view with tabs

**What you'll see:**
- Overview tab: Full application details
- Parameters tab: Helm chart parameters
- Logs tab: Application logs
- Events tab: ArgoCD events
- Actions: Refresh, Sync, Dry Run

---

## 🎨 Visual Elements

### Status Badges

**Sync Status:**
- ✅ **Synced** (Green) - Application is in sync
- ⚠️ **OutOfSync** (Red) - Needs sync
- ⏱️ **Unknown** (Gray) - Status unknown

**Health Status:**
- ✅ **Healthy** (Green) - All resources healthy
- ⏱️ **Progressing** (Yellow) - Deployment in progress
- ❌ **Degraded** (Red) - Some resources unhealthy
- ❓ **Unknown** (Gray) - Health unknown

### Application Cards

Each card shows:
```
┌──────────────────────────────┐
│ Application Name         [👁] │
│ namespace                     │
│                               │
│ 🌿 branch/tag                 │
│                               │
│ ✓ Synced    ✓ Healthy        │
│                               │
│ repository-url                │
│ path • destination-namespace  │
└──────────────────────────────┘
```

---

## 🚀 How to Use

### Step 1: Configure Settings (Optional)
```
1. Go to Settings → ArgoCD
2. Adjust "Auto-Refresh (seconds)" field (default: 30)
3. Range: 5-300 seconds
4. Lower = more responsive, Higher = less API load
5. Click "Save Configuration"
```

### Step 2: Open Config Hub
```bash
npm run dev
```

### Step 3: Navigate to ArgoCD
- Click "ArgoCD" in the sidebar
- Wait for applications to load (~2-3 seconds)

### Step 4: View Your Applications
You should see all 6 applications:
- ✅ nginx-ingress (Synced, Healthy)
- ✅ metrics-server (Synced, Healthy)
- ⚠️ redis (Unknown, Healthy) - ComparisonError
- ✅ grafana (Synced, Healthy)
- ⏱️ prometheus (Synced, Progressing)
- ✅ cert-manager (Synced, Healthy)

### Step 5: Try Filtering

**Example 1: Find all monitoring apps**
1. Type `monitoring` in "Product Name"
2. Click "Search"
3. See: grafana, prometheus, metrics-server

**Example 2: Find acme-corp apps**
1. Type `acme-corp` in "Customer Name"
2. Click "Search"
3. See: redis, grafana

**Example 3: Find healthy apps**
1. Select "Healthy" in Health Status dropdown
2. Click "Search"
3. See: All except prometheus (which is Progressing)

### Step 6: View Details
1. Click on any application card
2. See detailed information:
   - Source repository
   - Destination cluster
   - Current parameters
   - Resource status
3. Click "Back" to return to list

---

## 🐛 Troubleshooting

### Not Seeing Applications?

**Check 1: Credentials Configured**
```
1. Go to Settings → ArgoCD
2. Verify Server URL: https://argocd.k8s.local
3. Verify Username/Password or Token is set
4. Click "Test Connection" - should show success
5. Click "Save Configuration"
```

**Check 2: Applications Exist**
```bash
argocd app list
# Should show 6 applications
```

**Check 3: Console Errors**
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Check Network tab for failed requests
```

### Applications Not Loading?

**Check credential ID:**
```
1. Go to Settings → ArgoCD
2. Look for "Secure credentials stored" message
3. Note the Credential ID
4. Go back to ArgoCD page
5. Check console for "Getting applications for credential: <id>"
```

### Search Not Working?

**The search is case-insensitive and uses partial matching:**
```
✅ "monitor" matches "monitoring"
✅ "acme" matches "acme-corp"
✅ "1.0" matches "1.0.0"
❌ Exact match not required
```

### Redis Showing "Unknown" Status?

This is expected! The error message shows:
```
argocd/redis  Unknown  Healthy  ComparisonError
```

This happens because:
- The Helm chart repository might have issues
- The chart version might not be available
- ArgoCD can't compare desired vs actual state

**It's still healthy and running!** The "Unknown" is just the sync status.

---

## 📊 Expected Behavior

### Auto-Refresh
- Applications refresh automatically at a configurable interval (default: 30 seconds)
- The GET /applications API endpoint is polled at the configured interval
- Configurable in Settings → ArgoCD → Auto-Refresh (5-300 seconds)
- You'll see the refresh icon spin briefly during refresh
- Status badges update in real-time
- Manual refresh available via the Refresh button anytime

### Connection Status
- If not connected, you'll see a red banner at the top
- Click "Test Connection" to verify
- Check Settings if connection fails

### Loading States
- Spinner shows while loading applications
- Cards appear once data is fetched
- Empty state shows if no applications found

---

## 🎯 Testing Checklist

- [ ] Open Config Hub
- [ ] Click ArgoCD in sidebar
- [ ] See 6 application cards
- [ ] Each card shows sync and health status
- [ ] Search by product "monitoring" → 3 apps
- [ ] Search by customer "acme-corp" → 2 apps
- [ ] Filter by sync status "Synced" → 5 apps
- [ ] Filter by health "Healthy" → 5 apps
- [ ] Click on an app → See details
- [ ] Click "Back" → Return to list
- [ ] Click "Refresh" → Apps reload
- [ ] Wait 30 seconds → Auto-refresh works

---

## ✨ Summary

Your Config Hub already has **all the features** you mentioned:

1. ✅ Search by Product (monitoring, infrastructure, database)
2. ✅ Filter by Customer (demo, acme-corp)
3. ✅ Filter by Version (1.0.0, 7.0.0, etc.)
4. ✅ Filter by Sync Status (Synced, OutOfSync, Unknown)
5. ✅ Filter by Health Status (Healthy, Progressing, Degraded)
6. ✅ View Application Details (click any card)
7. ✅ Auto-refresh every 30 seconds
8. ✅ Test connection button
9. ✅ Manual refresh button
10. ✅ Color-coded status badges

**Just open the app and click "ArgoCD" in the sidebar!** 🚀

All your 6 deployed applications should appear with their current status.
