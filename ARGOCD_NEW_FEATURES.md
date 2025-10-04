# ArgoCD Page - New Features

## 🎉 What's New

### 1. View Mode Toggle (Grid/List)

Switch between grid and list views using the toggle buttons in the header.

**Grid View** (Default):
- Card-based layout
- 3 columns on large screens
- 2 columns on medium screens
- 1 column on mobile
- Shows all details in cards

**List View**:
- Compact row-based layout
- More applications visible at once
- Better for scanning many apps
- Shows key info in a single row

**How to use:**
- Click the grid icon (⊞) for grid view
- Click the list icon (☰) for list view
- Toggle persists during your session

---

### 2. Quick Search Bar

Instant search across all application fields without clicking "Search" button.

**Searches across:**
- Application name
- Namespace
- Repository URL
- Product label
- Customer label

**Features:**
- Real-time filtering as you type
- Case-insensitive
- Partial matching
- Clear button (X) to reset

**Examples:**
```
Type "nginx" → Shows nginx-ingress
Type "monitoring" → Shows grafana, prometheus, metrics-server
Type "acme" → Shows redis, grafana
Type "demo-apps" → Shows all apps in demo-apps namespace
Type "github" → Shows apps from GitHub repos
```

---

## 🎨 UI Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│ ArgoCD Applications                 [⊞][☰] [Test] [Refresh]│
│ Manage and monitor your applications                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🔍 Quick search by name, namespace, repository...     [X]   │
└─────────────────────────────────────────────────────────────┘
```

### Grid View
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ nginx-ingress│ │ metrics-srv  │ │ redis        │
│ argocd       │ │ argocd       │ │ argocd       │
│              │ │              │ │              │
│ Product: inf │ │ Product: mon │ │ Product: db  │
│ Customer:demo│ │ Customer:demo│ │ Customer:acme│
│ 🌿 4.8.3     │ │ 🌿 3.11.0    │ │ 🌿 17.11.3   │
│              │ │              │ │              │
│ ✓ Synced     │ │ ✓ Synced     │ │ ⚠ Unknown    │
│ ✓ Healthy    │ │ ✓ Healthy    │ │ ✓ Healthy    │
│              │ │              │ │              │
│ kubernetes...│ │ kubernetes...│ │ charts.helm..│
└──────────────┘ └──────────────┘ └──────────────┘
```

### List View
```
┌─────────────────────────────────────────────────────────────┐
│ nginx-ingress argocd                                        │
│ Product: infrastructure  Customer: demo  🌿 4.8.3           │
│ kubernetes.github.io/ingress-nginx  • demo-apps             │
│                                    ✓ Synced  ✓ Healthy  [👁]│
├─────────────────────────────────────────────────────────────┤
│ metrics-server argocd                                       │
│ Product: monitoring  Customer: demo  🌿 3.11.0              │
│ kubernetes-sigs.github.io/metrics-server  • demo-apps       │
│                                    ✓ Synced  ✓ Healthy  [👁]│
├─────────────────────────────────────────────────────────────┤
│ redis argocd                                                │
│ Product: database  Customer: acme-corp  🌿 17.11.3          │
│ charts.helm.sh/stable  • demo-apps                          │
│                                    ⚠ Unknown  ✓ Healthy [👁]│
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Usage Examples

### Example 1: Find All Monitoring Apps
1. Type `monitoring` in quick search
2. See: grafana, prometheus, metrics-server
3. Switch to list view for compact display

### Example 2: Find Apps by Customer
1. Type `acme` in quick search
2. See: redis, grafana
3. Click any app to view details

### Example 3: Find Apps in Specific Namespace
1. Type `demo-apps` in quick search
2. See: All 6 applications
3. Use grid view to see full details

### Example 4: Find Apps from Specific Repo
1. Type `github` in quick search
2. See: Apps from GitHub repositories
3. Use list view to compare repos

### Example 5: Combine Quick Search with Filters
1. Type `monitoring` in quick search
2. Select "Healthy" in Health Status filter
3. Click "Search"
4. See: Only healthy monitoring apps

---

## 💡 Tips & Tricks

### Quick Search Tips
- **Start typing immediately** - No need to click in the field
- **Use partial words** - "mon" matches "monitoring"
- **Search by repo** - Find all apps from a specific repository
- **Clear quickly** - Click X or press Escape

### View Mode Tips
- **Grid view** - Best for detailed overview
- **List view** - Best for scanning many apps
- **Mobile** - List view works better on small screens
- **Large screens** - Grid view shows more at once

### Combining Features
1. **Quick search** for instant filtering
2. **Advanced filters** for precise queries
3. **View toggle** for preferred layout
4. **Click app** to see full details

---

## 🎯 Feature Comparison

| Feature | Quick Search | Advanced Filters |
|---------|-------------|------------------|
| **Speed** | Instant | Click "Search" |
| **Fields** | Name, namespace, repo, labels | Product, customer, version, status |
| **Use Case** | Quick lookup | Precise filtering |
| **Clearing** | Click X | Click "Clear" |
| **Combining** | ✅ Works together | ✅ Works together |

---

## 📱 Responsive Behavior

### Desktop (Large Screens)
- Grid: 3 columns
- List: Full details visible
- All labels shown

### Tablet (Medium Screens)
- Grid: 2 columns
- List: Repository info hidden
- Key labels shown

### Mobile (Small Screens)
- Grid: 1 column
- List: Compact layout
- Essential info only

---

## ⌨️ Keyboard Shortcuts (Future)

Coming soon:
- `/` - Focus quick search
- `Escape` - Clear quick search
- `G` - Switch to grid view
- `L` - Switch to list view
- `R` - Refresh applications

---

## 🎨 Visual Indicators

### Status Badges
- ✅ **Green** - Synced/Healthy
- ⚠️ **Yellow** - Progressing
- ❌ **Red** - OutOfSync/Degraded
- ⏱️ **Gray** - Unknown

### Icons
- 🔍 **Search** - Quick search field
- ⊞ **Grid** - Grid view mode
- ☰ **List** - List view mode
- 👁 **Eye** - View details
- 🌿 **Branch** - Git revision
- ⟳ **Refresh** - Reload apps

---

## ✨ Summary

### New Features Added:
1. ✅ **View Mode Toggle** - Switch between grid and list
2. ✅ **Quick Search Bar** - Instant filtering across all fields
3. ✅ **Enhanced Grid View** - Shows product and customer labels
4. ✅ **Compact List View** - More apps visible at once
5. ✅ **Clear Button** - Quick reset of search
6. ✅ **Real-time Filtering** - No need to click search
7. ✅ **Configurable Auto-Refresh** - Polls ArgoCD API at customizable intervals (5-300 seconds, default: 30)

### Benefits:
- 🚀 **Faster** - Find apps instantly
- 👀 **Flexible** - Choose your preferred view
- 📱 **Responsive** - Works on all screen sizes
- 🎯 **Powerful** - Combine quick search with filters
- 💡 **Intuitive** - Simple and easy to use

Enjoy the enhanced ArgoCD experience! 🎉
