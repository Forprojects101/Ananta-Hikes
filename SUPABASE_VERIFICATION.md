# Supabase Verification Checklist

Follow these steps in order to verify and fix your Supabase setup.

---

## ✅ STEP 1: Check Your Supabase Credentials

Go to [Your Supabase Dashboard](https://app.supabase.com/) and verify:

1. **Project Name**: Must match what's in your `.env` file
2. **URL**: Should be `https://xrrolaaqaufjadolkqxh.supabase.co`
3. **API Key (anon)**: Should be present in `.env` 
4. **Service Role Key**: Should be in `.env`

---

## ⚠️ STEP 2: Check Row Level Security (RLS) Status

**Go to:** Supabase Dashboard → **SQL Editor** → Click **New Query**

**Run this verification query:**
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('mountains', 'bookings', 'content_settings');
```

**Expected result:**
```
schemaname | tablename         | rowsecurity
public     | mountains         | t (TRUE)
public     | bookings          | t (TRUE)
public     | content_settings  | t (TRUE)
```

### ❌ If rowsecurity shows FALSE:
**RLS is NOT enabled!** Run the setup SQL to enable it.

---

## ⚠️ STEP 3: Check RLS Policies

**Go to:** Supabase Dashboard → **SQL Editor** → Click **New Query**

**Run this:**
```sql
SELECT table_name, policyname, cmd, permissive
FROM pg_policies
WHERE table_name IN ('mountains', 'bookings', 'content_settings')
ORDER BY table_name;
```

**Expected result: Should show at least these policies for mountains:**
```
table_name | policyname                          | cmd    | permissive
mountains  | allow_public_read_active_mountains  | SELECT | t
mountains  | allow_authenticated_read_all        | SELECT | t
mountains  | allow_admin_insert_mountains        | INSERT | t
mountains  | allow_admin_update_mountains        | UPDATE | t
mountains  | allow_admin_delete_mountains        | DELETE | t
```

### ❌ If you see NO policies:
**You need to run the RLS setup SQL!**

---

## ⚠️ STEP 4: Check Realtime Status

**Go to:** Supabase Dashboard → **SQL Editor** → Click **New Query**

**Run this:**
```sql
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**Expected result: Should show these tables:**
```
pubname             | schemaname | tablename
supabase_realtime   | public     | mountains
supabase_realtime   | public     | bookings
supabase_realtime   | public     | content_settings
```

### ❌ If they're NOT listed:
**Realtime is not enabled!** You need to enable it.

---

## 🔧 STEP 5: Run Complete Supabase Setup

If Step 1-4 show missing policies or realtime, **run the complete setup SQL**:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy **ALL** the SQL from `docs/SUPABASE_SETUP_SAFE.sql`
4. Paste it into the editor
5. Click **Run** at the bottom

**Expected output:**
```
✅ ALTER TABLE
✅ CREATE POLICY
✅ CREATE POLICY
... (more policies)
✅ ALTER PUBLICATION
... (more publications)
✅ Your query executed successfully
```

### If you see errors:
- **"Policy already exists"** → That's OK, it means they were already run once
- **"RLS is not enabled"** → The setup will enable it
- **Other errors** → Check that the `mountains`, `bookings` tables exist

---

## 🔍 STEP 6: Check Your Mountains Data

**Go to:** Supabase Dashboard → **Table Editor**

1. Click on **mountains** table
2. Look for these columns:
   - `id` (should have values)
   - `name` (should have values)
   - `is_active` (should be TRUE for visible mountains)
   - `price` (may be null/0 - this is the pricing problem)

3. **Count the mountains**: How many rows total?
4. **Count active mountains**: How many have `is_active = true`?

### ⚠️ Common Issues:

**Issue A: Only 2 mountains showing (3rd is missing)**
- Check if 3rd mountain has `is_active = false`
- **Solution**: Set it to `true` and reload page

**Issue B: Price shows as ₱0**
- Check if `price` column is NULL/0 for all mountains
- Check if `hike_types` table exists and has prices linked
- **Solution**: Set prices in either `mountains.price` or `hike_types.price`

---

## ✅ STEP 7: Verify Everything Works

### Test 1: Check RLS Policy (Active Mountains Only)
```sql
-- This simulates what public/anon users see:
SELECT * FROM mountains;  
-- Should only show mountains where is_active = true
```

### Test 2: Check All Mountains (Authenticated)
```sql
-- This simulates what authenticated/admin users see:
SELECT * FROM mountains;  
-- Should show ALL mountains (active and inactive)
```

---

## 🐛 Debugging: Why are only 2 mountains showing?

**The API filters mountains by:** `WHERE is_active = true`

**Run this query to see which mountains are active:**

```sql
SELECT id, name, is_active, price, difficulty_level 
FROM mountains 
ORDER BY created_at DESC;
```

**Look at the output:**
- **is_active = true** → Will show on booking page ✅
- **is_active = false** → Will NOT show on booking page ❌

**If the 3rd mountain has is_active = false:**
```sql
UPDATE mountains 
SET is_active = true
WHERE name = 'Mt. Apo';  -- or whatever the mountain name is
```

---

## 💰 Debugging: Why is price ₱0?

**Run this to see price data:**
```sql
SELECT id, name, price, is_active FROM mountains;

SELECT id, name, price, mount_id FROM hike_types;
```

**Solutions:**

### Option A: Set Price Directly on Mountains
```sql
UPDATE mountains SET price = 5000 WHERE name = 'Mt. Apo';
UPDATE mountains SET price = 3500 WHERE name = 'Mt. Pulags';
```

### Option B: Set Prices on Hike Types
```sql
SELECT * FROM hike_types;  -- First check what exists

UPDATE hike_types SET price = 2500 WHERE name = 'Day Hike';
UPDATE hike_types SET price = 5000 WHERE name = 'Overnight';
```

### Option C: Do Both (Recommended)
- Set `mountains.price` = base/default price
- Set `hike_types.price` = specific type prices
- System uses `mountains.price` if available, falls back to hike_types minimum

---

## 🚀 After Making Changes

**Always do this after fixing Supabase:**

1. **Hard refresh the app**: `Ctrl + Shift + R`
2. **Check browser console**: Should see mountains loading
3. **Check server terminal**: Should see mountains count
4. **Reload booking page**: Should show updated mountains/prices

---

## Quick Command Reference

**Enable RLS on mountains:**
```sql
ALTER TABLE mountains ENABLE ROW LEVEL SECURITY;
```

**Add a policy to read active mountains:**
```sql
CREATE POLICY "allow_public_read_active_mountains"
ON mountains FOR SELECT
TO anon, authenticated
USING (is_active = true);
```

**Enable realtime on mountains:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE mountains;
```

**Check a specific mountain:**
```sql
SELECT * FROM mountains WHERE name = 'Mt. Pulags';
```

**Update mountain to active:**
```sql
UPDATE mountains SET is_active = true WHERE id = 'some-id';
```

---

## Need More Help?

If you complete all steps above and still have issues:

1. **Take screenshots** of:
   - Your mountains table with all rows visible
   - RLS policy check result
   - Realtime check result

2. **Share the output** of:
   ```sql
   SELECT COUNT(*) FROM mountains;
   SELECT COUNT(*) FROM mountains WHERE is_active = true;
   SELECT * FROM mountains ORDER BY created_at DESC;
   ```

3. **Check server logs** when loading booking page for price derivation traces

