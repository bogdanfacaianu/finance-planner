# Database Migration Setup Options

## Option 1: Supabase CLI (Recommended)

### 1. Install Supabase CLI
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### 2. Initialize Supabase project
```bash
supabase init
supabase login
supabase link --project-ref your-project-ref
```

### 3. Create and apply migrations
```bash
# Create a new migration
supabase migration new add_user_categories

# Edit the migration file in supabase/migrations/
# Then apply migrations
supabase db push
```

### 4. Generate types (bonus)
```bash
supabase gen types typescript --local > src/types/supabase.ts
```

## Option 2: Custom Migration Script (Quick setup)

Add migration scripts to package.json and create a migrations system.

## Option 3: Direct SQL Execution via Code

Create migration functions that execute SQL directly through the Supabase client.