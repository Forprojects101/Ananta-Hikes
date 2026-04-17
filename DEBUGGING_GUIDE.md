# 🔍 Mountain Data Debugging Guide

## Enhanced Error Handling Added

I've added **comprehensive console logging** to help diagnose why new mountains aren't appearing. Now you can see exactly what's happening!

---

## 📋 What To Check

### Step 1: Open Browser Console
Press `F12` → Click **Console** tab

### Step 2: Hard Reload
`Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Step 3: Go to Booking Page
Navigate to: http://localhost:3000/booking

### Step 4: Look For These Logs

---

## ✅ What Success Looks Like

You should see something like this in console:

```
🏔️ [MountainSelection] Starting fetch request...
   Timestamp: 1712973584000
   Time: 2026-04-12T14:19:44.000Z
   URL: /api/mountains?t=1712973584000

📊 [MountainSelection] Response received:
   Status: 200 OK
   Content-Type: application/json
   Cache-Control: no-cache, no-store, must-revalidate
   Raw body length: 2456 characters

✅ [MountainSelection] /api/mountains success
   Request time: 2026-04-12T14:19:44.000Z
   Mountains count: 3
   [1] Mt. Apo
       ID: 550e8400-e29b-41d4-a716-446655440000
       Location: Davao
       Difficulty: Advanced
       Price: ₱2500
       Active: true
       Image: ✓ Present
   [2] Mt. Pulags
       ...
   [3] Your New Mountain
       ID: 550e8400-e29b-41d5-a716-446655440001
       Location: Your Location
       Difficulty: Beginner
       Price: ₱3000
       Active: true
       Image: ✗ Missing
```

---

## ❌ Common Problems & Solutions

### Problem 1: "Mountains count: 0"
**Console shows:**
```
Mountains count: 0
⚠️ [MountainSelection] WARNING: No mountains returned from API!
   Check if any mountains exist in database with is_active=true
```

**What To Do:**
1. Open Supabase dashboard
2. Go to: **Database** → **Table Editor** → **mountains**
3. Check if the new mountain exists
4. Check the `is_active` column is set to **true** (not false)
5. Check the mountain has all required fields: `name`, `location`, `difficulty`

**SQL Query to Check:**
```sql
SELECT id, name, location, is_active, created_at FROM mountains;
```

---

### Problem 2: "Status: 404 Not Found" or "Status: 500 Server Error"
**Console shows:**
```
❌ [MountainSelection] /api/mountains request failed
   Status: 404 Not Found
```

**What To Do:**
1. Check if dev server is running: `npm run dev`
2. API route might be broken
3. Look at server logs in terminal
4. Restart dev server with `Ctrl+C` then `npm run dev`

---

### Problem 3: Parse Error (JSON Cannot Be Parsed)
**Console shows:**
```
❌ [MountainSelection] Failed to parse JSON response
   Parse error: SyntaxError: Unexpected token < in JSON
   Raw response: <!DOCTYPE html> <html>...
```

**What To Do:**
1. Server returned HTML instead of JSON (usually means error page)
2. Look at server terminal for error messages
3. Restart dev server
4. Check `.env.local` has correct Supabase credentials

---

### Problem 4: Cache Still Being Used
**Console shows:**
```
Cache-Control: public, max-age=3600
```

**What To Do:**
1. API is still caching! This shouldn't happen with our code.
2. Check that `/api/mountains/route.ts` has the cache-busting headers
3. Clear browser cache completely:
   - Chrome: Settings → Privacy → Clear browsing data → All time
   - Firefox: History → Clear Recent History → Everything

---

### Problem 5: Mountains Appear But Old Data Not Updating
**Console shows:**
```
Mountains count: 3
   [1] Mt. Apo
   [2] Mt. Pulags
   (missing your new mountain)
```

**What To Do:**
1. New mountain isn't being saved to database
2. Check admin console logs for errors when you add mountain
3. Check database if mountain exists with same name
4. Go to admin panel and try adding again, watch for error messages

---

## 🔧 Server-Side Debugging

Open another terminal and look at the **server console** (where you ran `npm run dev`).

You should see:

```
🏔️ [GET /api/mountains] Request started
   Time: 2026-04-12T14:19:44.123Z
   Key Type: service_role

📊 [GET /api/mountains] Query result:
   Mountains found: 3
   Error: None

✅ [GET /api/mountains] Sending normalized mountains:
   Total count: 3
   [1] Mt. Apo
       ID: 550e8400-e29b-41d4-a716-446655440000
       Location: Davao
       Difficulty: Advanced
       Price: ₱2500
       Active: true
   [2] Mt. Pulags
   [3] New Mountain
```

### If Server Says "Mountains found: 0"
1. Check database directly with psql or your database UI
2. Mountains table might be empty
3. Or all mountains have `is_active = false`

### If Server Says "Key Type: anon"
You might have permission issues:
1. Add RLS policy to mountains table in Supabase
2. Or set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

## 📊 Complete Debugging Checklist

Print and check these:

- [ ] Browser console shows "Status: 200 OK"
- [ ] Browser console shows "Mountains count: X" (not 0)
- [ ] New mountain name appears in the list
- [ ] New mountain has "Active: true"
- [ ] New mountain has a numeric Price value
- [ ] Server console shows "Mountains found: X"
- [ ] Server console shows new mountain in the list
- [ ] No red errors in browser console
- [ ] No red errors in server console
- [ ] Response headers include "Cache-Control: no-cache..."

---

## 🆘 If Still Not Working

**Collect this info and let me know:**

1. **Browser Console Output** (Ctrl+C to copy)
   - Copy the entire "✅ [MountainSelection]" section
   - Copy any error messages

2. **Server Console Output** (Ctrl+C to copy)
   - Copy the entire "✅ [GET /api/mountains]" section
   - Copy any error messages

3. **Database Query Result**
   ```sql
   SELECT id, name, is_active, created_at FROM mountains LIMIT 10;
   ```
   Run this and share the results

4. **Mountain You Added**
   - Name of mountain
   - When you added it
   - Did you see success message?

5. **Browser Info**
   - Chrome/Firefox/Safari?
   - Clear cache before testing?

---

## 💡 Pro Tips

### Enable Verbose Logging
Add this to browser console to see even more details:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

### Test API Directly
Open a new tab and visit:
```
http://localhost:3000/api/mountains?t=12345
```

You should see raw JSON with mountains list.

### Clear Everything
Do this in order:
1. `Ctrl+Shift+Delete` → Clear browsing data → **All time**
2. Close all browser tabs
3. Restart dev server: `Ctrl+C` then `npm run dev`
4. Hard reload: `Ctrl+Shift+R`

---

## 📞 Next Steps

1. **Hard Reload** the booking page
2. **Watch Console** for the logs above
3. **Add a New Mountain** in admin panel
4. **Check Both Consoles** (browser + server)
5. **Compare** with the success logs above
6. **Share the logs** if something doesn't match

The new logging will tell us exactly where the problem is! 🎯
