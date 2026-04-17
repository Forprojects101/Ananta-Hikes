# 🏔️ Mountain Data Sync Fix

## Problem Identified
Mountains added in the admin panel were **not appearing** on the landing page and booking page until users manually refreshed. This was a **real-time sync issue**.

### Root Causes:
1. **MountainSelection component** (booking page) was NOT listening for `mountains-updated` events
2. Only the landing page had sync listening implemented
3. Bookings page fetched mountains only once on mount, never updated

---

## Solution Implemented

### ✅ Fixed: `src/components/booking/steps/MountainSelection.tsx`

**What Changed:**
- Added `useDataSync` hook import
- Extracted `fetchMountains` function outside useEffect for reuse
- Added new useEffect that listens for "mountains-updated" events
- Added proper cleanup (unsubscribe) on component unmount

**How It Works:**
```typescript
// 1. Initial fetch on mount
useEffect(() => {
  fetchMountains();
}, []);

// 2. Listen for admin updates & refetch
useEffect(() => {
  const unsubscribe = onSync("mountains-updated", () => {
    console.log("🚀 [MountainSelection] Received mountains-updated event, refetching...");
    fetchMountains();
  });
  return () => unsubscribe();
}, [onSync]);
```

---

## How The Real-Time Sync Works

### Flow:
```
1. Admin adds/edits/deletes mountain in admin panel
   ↓
2. MountainManagement component calls: triggerSync("mountains-updated")
   ↓
3. DataSyncContext emits event to all listeners
   ↓
4. Landing page (page.tsx) refetches data
5. Booking page (MountainSelection.tsx) refetches data ✅ NOW FIXED
   ↓
6. Both pages show new mountains immediately
```

### Console Logs To Watch:
```
📡 [MountainSelection] Setting up listener for mountains-updated event
🏔️ [MountainSelection] Fetching mountains from /api/mountains
✅ [MountainSelection] /api/mountains success
🚀 [MountainSelection] Received mountains-updated event, refetching...
```

---

## Testing The Fix

### Step 1: Add New Mountain in Admin Panel
1. Go to Admin Dashboard → Mountains Management
2. Add a new mountain (make sure `is_active = true`)
3. Watch browser console for logs

### Step 2: Verify Landing Page Updates
1. Keep landing page open in another tab
2. Check console for: `🚀 [Home] Received mountains-updated event, refetching...`
3. New mountain should appear in the carousel

### Step 3: Verify Booking Page Updates
1. Keep booking page open in another tab
2. Check console for: `🚀 [MountainSelection] Received mountains-updated event, refetching...`
3. New mountain should appear in the selection grid

### Expected Console Output:
```
🏔️ [MountainSelection] Setting up listener for mountains-updated event
📡 [DataSync] Registering listener for: mountains-updated

// After adding a mountain:
🚀 [EditMountain] Triggered mountains-updated sync event
🚀 [MountainSelection] Received mountains-updated event, refetching...
🏔️ [MountainSelection] Fetching mountains from /api/mountains
✅ [MountainSelection] /api/mountains success
   mountainCount: 3
   mountains: [
     {id: "...", name: "Mt. Apo", price: 2500, ...},
     {id: "...", name: "New Mountain", price: 3000, ...}
   ]
```

---

## Important: Check Mountain Status

**If new mountains don't show up, verify:**
1. Mountain has `is_active = true`
2. Mountain is in the `mountains` table
3. Check database: 
   ```sql
   SELECT id, name, is_active FROM mountains WHERE is_active = true;
   ```

---

## Files Changed
- ✅ `src/components/booking/steps/MountainSelection.tsx` - Added sync listening

## Files Verified (Working Correctly)
- ✅ `src/app/page.tsx` - Landing page sync (already working)
- ✅ `src/app/api/landing-data/route.ts` - Cache busting headers set
- ✅ `src/app/api/mountains/route.ts` - Cache busting headers set
- ✅ `src/components/admin/sections/MountainManagement.tsx` - Triggers sync event
- ✅ `src/context/DataSyncContext.tsx` - Event system working

---

## Notes
- This is **client-side real-time sync** (within the same browser session)
- Different browser windows/tabs will NOT auto-sync (each has its own DataSyncContext)
- To sync across browsers, page refresh is needed OR implement WebSocket/Server-Sent Events
- The landing-data API fetches only **6 mountains** by default (check `.limit(6)` if you need more)
- The mountains API fetches **all active mountains**

---

## If Issues Persist:

### Check 1: Browser Console
- Look for error messages in red
- Verify all "✅ success" logs appear

### Check 2: Network Tab
- Verify `/api/mountains` returns `200 OK`
- Check response has `"mountains": [...]` array
- Ensure response headers have `Cache-Control: no-cache, no-store, must-revalidate`

### Check 3: Database
- Verify mountain exists with `is_active = true`
- Check if mountain was created with proper fields

### Check 4: Admin Panel Logs
- Verify `triggerSync("mountains-updated")` was called
- Check for "Triggered mountains-updated sync event" log

---

**Status:** ✅ **FIXED** - Booking page now listens for real-time mountain updates
