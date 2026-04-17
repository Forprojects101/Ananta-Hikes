# Price Derivation Debug Guide

## What Was Changed

Enhanced `/api/mountains/route.ts` to log detailed price derivation information for each mountain.

## What to Look For in Server Console

When you reload the booking page, check the terminal where you ran `npm run dev`. You should see logs like:

### 1. Database Summary
```
📊 [GET /api/mountains] Total mountains in database:
   All mountains count: 3
   Active (is_active=true): 2
   Inactive (is_active=false): 1
   Details:
   [1] Mt. Apo - is_active: true (ID: xxx)
   [2] Mt. Pulags - is_active: true (ID: yyy)
   [3] as - is_active: false (ID: zzz)
   ⚠️ FILTERED OUT (is_active=false):
   ❌ as (ID: 7d11ec78...)
```

### 2. Active Mountains Query Result
```
📊 [GET /api/mountains] Query result (ACTIVE only):
   Active mountains found: 2
   Error: None
```

### 3. Raw Data from Database
```
📋 [Raw data from database]
   [1] Mt. Pulags
       Raw price field: number = 0
       Direct properties: {"id":"e178b5da...","price":0,"is_active":true}
   [2] as
       Raw price field: null
       Direct properties: {"id":"7d11ec78...","price":null,"is_active":true}
```

### 4. Price Derivation for Each Mountain
As each mountain is normalized, you'll see logs like:

```
     Price source [1]: Direct price field = ₱5000
```
OR
```
     Price source [1]: Direct price is invalid, checking hike_types (found 3)
     Price source [1]: From hike_types, minimum = ₱2500
```
OR
```
     Price source [1]: NO PRICE FOUND - Using default 0
```

### 5. Final Output Summary
```
✅ [GET /api/mountains] Sending normalized mountains:
   Total count: 2
   [1] Mt. Pulags
       ID: e178b5da-295b-4db5-9cab-24a64bd9c1b5
       Location: Nueva Vizcaya
       Difficulty: Advanced
       Price: ₱0
       Active: true
       Image: ✓
   [2] as
       ID: 7d11ec78-894b-4be1-b23d-549abcd41fdd
       Location: sdsd
       Difficulty: Beginner
       Price: ₱0
       Active: true
       Image: ✗
```

## Key Information to Check

1. **Database Status**
   - How many mountains total?
   - How many are `is_active=true`?
   - Which mountain(s) are `is_active=false`?

2. **Price Field Values**
   - Is the `price` column:
     - A number (e.g., `5000`)?
     - NULL/null?
     - A string (e.g., `"5000"`)?
   - What does "Raw price field: ..." show?

3. **Price Source**
   - Is it coming from the direct `price` field on mountains?
   - Or is it derived from hike_types?
   - Or is it defaulting to 0?

## Why Price Shows as ₱0

### Scenario A: Direct Price Field is Null or 0
- Mountains table has `price` column set to NULL or 0
- No fallback hike_types
- Result: default ₱0

### Scenario B: Direct Price Field is Invalid
- Mountains table has `price` = null/undefined
- Tries to check hike_types
- No hike_types associated OR no prices set on hike_types
- Result: default ₱0

### Scenario C: Hike Types Have No Prices
- Mountains table has `price` = null
- Has associated hike_types
- But hike_types have price = null/0
- Result: uses minimum valid price from hike_types, or defaults to 0

## Steps to Fix Price = 0

### Option 1: Set Direct Price on Mountains Table (Recommended)
1. Go to Supabase Dashboard
2. Open `mountains` table
3. For each mountain, set the `price` column to desired amount (e.g., 5000)
4. Reload booking page
5. Check server logs: Should show "Price source: Direct price field = ₱5000"

### Option 2: Set Prices on Hike Types
1. Go to Supabase Dashboard
2. Open `hike_types` table
3. For each hike type, set the `price` column
4. Mountains with no direct price will use minimum hike_type price
5. Reload booking page
6. Check server logs: Should show "Price source: From hike_types, minimum = ₱..."

### Option 3: Both (Recommended for Maximum Control)
- Set direct price on mountains for the base/default price
- Set individual prices on hike_types for per-type pricing
- System will use direct price if available, fallback to hike_types minimum

## Testing Procedure

1. **Set a price** on one mountain in Supabase
2. **Hard refresh** booking page (Ctrl+Shift+R)
3. **Check server console** for:
   - "Price source: Direct price field = ₱[amount]"
4. **Check browser console** in booking page for:
   - The price showing correctly in MountainSelection output
5. **Verify on UI** that the price displays correctly

## Expected Output After Fix

Once a proper price is set, you should see:

**Server console:**
```
     Price source [1]: Direct price field = ₱5000
```

**Browser console:**
```
[MountainSelection] Mountains fetched:
   [1] Mt. Pulags
       Price: ₱5000  ✓ Correct!
```

**UI Display:**
- Mountain cards show proper pricing instead of ₱0
