# Connections System - Database Setup

## How to Apply the Connections Table to Supabase

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your `afroconnect` project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `create-connections.sql`
6. Paste into the SQL editor
7. Click **Run** button
8. Verify success message appears

### Option 2: Supabase CLI

```bash
# Navigate to project directory
cd C:\Users\Admin\afroconnect

# Run the SQL file
supabase db push --file sql/create-connections.sql
```

## What This Creates

### Tables
- **connections** - Stores connection requests and relationships between users

### Functions
- `are_users_connected(user_a, user_b)` - Check if two users are connected
- `get_connection_status(user_a, user_b)` - Get connection status between users

### Security
- Row Level Security (RLS) policies ensure users can only:
  - View their own connections
  - Send connection requests
  - Accept/decline requests sent to them
  - Cancel their own pending requests
  - Remove accepted connections

### Indexes
- Optimized for fast lookups of connections by user
- Efficient checking of connection status between two users

## Verification

After running the SQL, verify the table was created:

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'connections';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'connections';
```

## Next Steps

After applying this SQL:
1. The connections table will be ready
2. You can proceed with frontend implementation
3. Test connection requests in development
4. Monitor performance with the created indexes

## Rollback (If Needed)

To remove the connections system:

```sql
DROP TABLE IF EXISTS connections CASCADE;
DROP FUNCTION IF EXISTS are_users_connected(UUID, UUID);
DROP FUNCTION IF EXISTS get_connection_status(UUID, UUID);
DROP FUNCTION IF EXISTS update_connections_updated_at();
```

**Note**: Only run rollback if you need to completely remove the connections feature!
