# Database Migration - Create Junction Tables for Hike Types and Add-ons

## Issue
The admin dashboard **Edit Mountain** feature needs junction tables to link mountains to their associated hike types and add-ons with specific pricing.

Your current schema has:
- `mountains` table (main mountain records)
- `hike_types` master table (all available hike types)
- `add_ons` master table (all available add-ons)

**Missing:** Junction tables to create the M-to-N relationships.

## Solution
Create two junction tables:
1. `mountains_hike_types` - Links mountains to hike types with pricing
2. `mountains_add_ons` - Links mountains to add-ons with pricing

### Steps to Apply the Migration

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Go to SQL Editor

2. **Run the Migration SQL**
   - Copy the SQL from `docs/migration_add_jsonb_columns.sql`
   - Paste it into the SQL Editor
   - Click "Run"

3. **Verify the Migration**
   - Go to Database → Tables
   - You should see two new tables:
     - `mountains_hike_types` (links mountains to hike types)
     - `mountains_add_ons` (links mountains to add-ons)

### SQL Commands

```sql
-- Create junction table between mountains and hike_types
CREATE TABLE IF NOT EXISTS mountains_hike_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mountain_id UUID NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
  hike_type_id UUID NOT NULL REFERENCES hike_types(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mountain_id, hike_type_id)
);

CREATE INDEX IF NOT EXISTS idx_mountains_hike_types_mountain ON mountains_hike_types(mountain_id);
CREATE INDEX IF NOT EXISTS idx_mountains_hike_types_hike_type ON mountains_hike_types(hike_type_id);

-- Create junction table between mountains and add_ons
CREATE TABLE IF NOT EXISTS mountains_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mountain_id UUID NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mountain_id, add_on_id)
);

CREATE INDEX IF NOT EXISTS idx_mountains_add_ons_mountain ON mountains_add_ons(mountain_id);
CREATE INDEX IF NOT EXISTS idx_mountains_add_ons_add_on ON mountains_add_ons(add_on_id);
```

### After Migration
The mountain edit functionality will work correctly:
- ✅ Add hike types to mountains - saves to `mountains_hike_types` with price
- ✅ Edit hike type prices - updates price in `.mountains_hike_types`
- ✅ Add add-ons to mountains - saves to `mountains_add_ons` with price
- ✅ Edit add-on prices - updates price in `mountains_add_ons`
- ✅ Save changes button - no more 500 errors
- ✅ Delete hike types/add-ons from mountains - removes from junction tables

## Data Model

```
mountains (1) ──┬──< (M) mountains_hike_types ──< (1) hike_types
               │
               └──< (M) mountains_add_ons ──< (1) add_ons
```

- One mountain can have multiple hike types (each with different price)
- One hike type can be used by multiple mountains (at different prices)
- Same relationship for add-ons

