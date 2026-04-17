# 🧪 Testing Plan - Mountain Sync Fix

## Quick Test (5 minutes)

### Setup:
1. Start the dev server: `npm run dev`
2. Open **2 browser tabs**:
   - Tab 1: http://localhost:3000 (Landing Page)
   - Tab 2: http://localhost:3000/booking (Booking Page)
3. Open **2 console windows**:
   - F12 → Console in Tab 1
   - F12 → Console in Tab 2
4. Open **3rd tab**: http://localhost:3000/admin (Admin Dashboard)
5. Navigate to: Admin → Mountains Management

### Test Steps:

#### Step 1: Verify Initial Load (30 seconds)
In **Tab 1 Console**, you should see:
```
📡 [DataSync] Registering listener for: mountains-updated
✅ [Home] Landing mountains loaded: X
📍 Mountain 1: Mt. Apo...
📍 Mountain 2: Mt. Pulags...
```

In **Tab 2 Console**, you should see:
```
📡 [MountainSelection] Setting up listener for mountains-updated event
✅ [MountainSelection] /api/mountains success
   mountainCount: X
   mountains: [{id: "...", name: "Mt. Apo", ...}, ...]
```

#### Step 2: Add New Mountain (1 minute)
1. In **Tab 3 (Admin)**, click "Add New Mountain"
2. Fill in:
   - Name: "Test Mountain Sync"
   - Location: "Test Location"
   - Difficulty: "Beginner"
   - Price: 2500
3. Set `is_active = true` ✅
4. Click "Add Mountain"

#### Step 3: Watch Real-Time Sync (1 minute)
**Tab 1 Console** should show:
```
🚀 [Home] Received mountains-updated event, refetching...
✅ [Home] Landing mountains loaded: X+1
📍 Mountain 1: Mt. Apo...
📍 Mountain 2: Mt. Pulags...
📍 Mountain 3: Test Mountain Sync...
```

**Tab 2 Console** should show:
```
🚀 [MountainSelection] Received mountains-updated event, refetching...
🏔️ [MountainSelection] Fetching mountains from /api/mountains
✅ [MountainSelection] /api/mountains success
   mountainCount: X+1
   mountains: [{...}, {...}, {id: "...", name: "Test Mountain Sync", ...}]
```

#### Step 4: Verify Visual Updates (1 minute)
- **Tab 1**: New mountain appears in carousel
- **Tab 2**: New mountain appears in selection grid

### Expected Result:
✅ **PASS** - Both pages update in real-time without manual refresh

---

## What If It Doesn't Work?

### Symptom 1: Console shows error "onSync is not a function"
**Solution:** Verify `useDataSync` is imported in MountainSelection
```typescript
import { useDataSync } from "@/context/DataSyncContext";
```

### Symptom 2: New mountain appears but takes 30+ seconds
**Solution:** Page might be refreshing due to periodic interval. Check for:
```
🔄 [Home] Periodic refresh (30s interval)
```
This is expected behavior. The sync should trigger immediately.

### Symptom 3: Mountain doesn't appear in UI but appears in console
**Solution:** Check if:
- Mountain has `is_active = true` in database
- App didn't crash (check for red errors in console)
- Network tab shows `/api/mountains` returning 200

### Symptom 4: "Permission denied" error in `/api/mountains`
**Solution:** Check `.env.local` has:
```
SUPABASE_SERVICE_ROLE_KEY=your_key
```

---

## Advanced Testing

### Test Across Different Browsers:
1. Chrome (Tab 1 + 2)
2. Firefox (Tab 3 + 4)
3. Add mountain from Chrome
4. Firefox tabs will NOT auto-update (different session)
5. **This is expected** - sync is per-browser-session only

### Test Backend Response:
```bash
curl -i "http://localhost:3000/api/mountains?t=$(date +%s)"
```

Should return:
```
HTTP/1.1 200 OK
Cache-Control: no-cache, no-store, must-revalidate
Content-Type: application/json

{"mountains": [...]}
```

---

## Checklist

- [ ] Initial load shows existing mountains
- [ ] Console shows "Setting up listener" on mount
- [ ] Adding mountain from admin triggers "mountains-updated" event
- [ ] Both pages refetch without manual refresh
- [ ] New mountain appears on landing page
- [ ] New mountain appears on booking page
- [ ] No errors in console
- [ ] Network requests return 200 OK

---

## Debug Commands (Browser Console)

### View last sync timestamp:
```javascript
// Will show last time mountains-updated was triggered
```

### Manually trigger sync (for testing):
```javascript
// In any page with DataSyncContext
useDataSync().triggerSync("mountains-updated");
```

### Check network cache:
```javascript
async function checkCache() {
  const res = await fetch("/api/mountains", {headers: {"Pragma": "no-cache"}});
  console.log("Mountains count:", (await res.json()).mountains.length);
}
checkCache();
```

---

**Estimated Time:** 5-10 minutes  
**Success Rate:** Should be 100% if setup is correct  
**Date Tested:** [Your Date]
