# 🎯 Quick Console Log Reference

## Copy These Steps:

### 1. Open Browser Console
```
F12 → Console Tab
```

### 2. Hard Reload
```
Ctrl + Shift + R  (Windows)
Cmd + Shift + R   (Mac)
```

### 3. Navigate to Booking Page
```
http://localhost:3000/booking
```

### 4. Watch For These Logs

---

## ✅ GOOD: You See This

```
🏔️ [MountainSelection] Starting fetch request...
   URL: /api/mountains?t=1712973584000

📊 [MountainSelection] Response received:
   Status: 200 OK
   ✓ Cache-Control: no-cache, no-store, must-revalidate

✅ [MountainSelection] /api/mountains success
   Mountains count: 3 ← IMPORTANT!
   [1] Mt. Apo
   [2] Mt. Pulags
   [3] Your New Mountain ← If here, new mountain exists!
```

**Expected result:** New mountain appears on the page ✨

---

## ❌ BAD: You See This

### Scenario A: Zero Mountains
```
⚠️ [MountainSelection] WARNING: No mountains returned from API!
   Mountains count: 0
```
**Problem:** Database is empty or all mountains have `is_active = false`
**Fix:** Check Supabase dashboard → mountains table

###Scenario B: Error Status
```
❌ [MountainSelection] /api/mountains request failed
   Status: 404 OR 500
```
**Problem:** API route is broken
**Fix:** Restart dev server: `Ctrl+C` then `npm run dev`

### Scenario C: Parse Error
```
❌ [MountainSelection] Failed to parse JSON response
   Parse error: SyntaxError: Unexpected token <
```
**Problem:** Server returned error HTML instead of JSON
**Fix:** Check server console for errors, restart dev server

### Scenario D: Unknown Error
```
❌ [MountainSelection] fetchMountains exception
   Error message: [some error]
```
**Problem:** Network or JSON parsing failed
**Fix:** See full error message, screenshot it, and share

---

## 🔧 Server Terminal (Other Console Window)

Should show:

```
🏔️ [GET /api/mountains] Request started
📊 [GET /api/mountains] Query result:
   Mountains found: 3 ← Should match browser!
✅ [GET /api/mountains] Sending normalized mountains:
   [1] Mt. Apo
   [2] Mt. Pulags
   [3] Your New Mountain ← If here, API has it!
```

---

## 🔍 Quick Diagnosis Table

| Browser Shows | Server Shows | Meaning | What To Do |
|---|---|---|---|
| ✅ Count: 3 | ✅ Found: 3 | All good! | New mountain should appear |
| ❌ Count: 0 | ✅ Found: 3 | Browser error | Restart browser, clear cache |
| ✅ Count: 3 | ❌ Found: 0 | Database issue | Check mountains table in Supabase |
| ❌ Count: 0 | ❌ Found: 0 | No mountains | Add mountains to database first |
| 404 Error | Error in logs | API broken | Restart dev server |

---

## 💻 Test Database Directly

Run this in **Supabase SQL Editor**:

```sql
-- Check if new mountain exists
SELECT id, name, location, is_active, created_at 
FROM mountains 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;
```

Should show your new mountain with recent `created_at` date.

---

## 🚀 Full Testing Flow

```
1. Hard Reload Booking Page
   ↓
2. Check Browser Console for status
   ↓
3. Check Server Console for query result
   ↓
4. Both should show SAME number of mountains
   ↓
5. If numbers match → New mountain on page ✅
   ↓
6. If numbers differ → Clear cache & restart server
   ↓
7. If error → Check database in Supabase
```

---

## 📝 Sample Screenshots to Compare

### Browser Console (Good)
```
🏔️ [MountainSelection] Starting...
📊 Response: 200 OK
✅ Mountains count: 3
   [1] Mt. Apo
   [2] Mt. Pulags  
   [3] Test Mountain
Full API response: {mountains: Array(3)}
```

### Server Console (Good)
```
🏔️ [GET /api/mountains] Request started
📊 Query result: Mountains found: 3
✅ Sending normalized mountains:
   [1] Mt. Apo
   [2] Mt. Pulags
   [3] Test Mountain
```

---

## ✅ Mountain Getting Added But Not Showing?

Check in this order:

1. **Booking page console** - Does it have 3 mountains?
2. **Server console** - Does it say 3 mountains found?
3. **Supabase UI** - Is new mountain visible in table?
4. **is_active column** - Is it `true` (not `false`)?
5. **Price field** - Does new mountain have a number?
6. **Name field** - Is it not empty?

If all are ✅, then it should appear. If not, see DEBUGGING_GUIDE.md.

---

**Status Check:** ✅ Enhanced error logging is now active!

Restart dev server if needed: `npm run dev`
