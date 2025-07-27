# Database Migrations

This directory contains SQL migration files for the Finance Planner application.

## How to Apply Migrations

### Option 1: Manual Application (Current)
1. Copy the SQL from each migration file
2. Go to your Supabase project → SQL Editor
3. Paste and execute the SQL

### Option 2: Using npm Scripts (Semi-Automated)
```bash
# Show migration status
npm run migrate:status

# Run pending migrations (will show SQL to execute manually)
npm run migrate
```

### Option 3: Full Automation (Requires setup)
Install Supabase CLI and set up local development:
```bash
npm install -g supabase
supabase init
supabase link --project-ref your-project-ref
supabase db push
```

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `001_user_categories.sql` | Creates user_categories table for custom categories | ⏳ Pending |
| `002_enhance_budgets.sql` | Adds advanced properties to budgets table | ⏳ Pending |

## Current Database Schema

After applying all migrations, your database will have:

### Tables
- `user_categories` - Custom user-defined spending categories
- `budgets` - Enhanced with category types, recurrence, workdays, grouping
- `expenses` - Existing expense tracking
- `rides` - Existing shared rides feature

### Key Features Enabled
- ✅ Custom categories (Flying, Meals Out, Coffee, etc.)
- ✅ Fixed vs Flexible budget types
- ✅ Recurring vs One-off budgets  
- ✅ Auto-calculation based on workdays
- ✅ Category grouping for summaries

## Quick Start

If you're setting up the database for the first time:

1. **Copy and run in Supabase SQL Editor:**
```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

2. **Apply migration 001:**
```bash
cat migrations/001_user_categories.sql
# Copy output and run in Supabase SQL Editor
```

3. **Apply migration 002:**
```bash
cat migrations/002_enhance_budgets.sql  
# Copy output and run in Supabase SQL Editor
```

4. **Verify setup:**
```bash
npm run migrate:status
```

## Troubleshooting

### If you get permission errors:
- Make sure you're running SQL as the postgres user in Supabase
- Check that RLS policies are correctly applied

### If tables already exist:
- The migrations use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
- Safe to re-run migrations

### For production deployment:
- Consider using Supabase CLI for automated deployments
- Test migrations on staging environment first