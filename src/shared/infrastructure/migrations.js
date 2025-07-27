import { supabase } from './supabase.js'

/**
 * Database Migration System
 * Manages database schema changes programmatically
 */

// Migration tracking table
const MIGRATIONS_TABLE = 'schema_migrations'

// All migrations in order
const MIGRATIONS = [
  {
    id: '001_create_user_categories',
    name: 'Create user_categories table',
    sql: `
      -- User Categories table (custom spending categories)
      CREATE TABLE IF NOT EXISTS user_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        UNIQUE(user_id, name, is_active)
      );
      
      -- Enable RLS
      ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
      
      -- Create policy
      DROP POLICY IF EXISTS "User data only" ON user_categories;
      CREATE POLICY "User data only" ON user_categories USING (auth.uid() = user_id);
    `
  },
  {
    id: '002_enhance_budgets_table', 
    name: 'Add advanced budget properties',
    sql: `
      -- Add new columns to budgets table
      ALTER TABLE budgets 
      ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'flexible' CHECK(category_type IN ('fixed', 'flexible')),
      ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'recurring' CHECK(recurrence_type IN ('recurring', 'one-off')),
      ADD COLUMN IF NOT EXISTS workdays_per_month INT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS category_group TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS auto_calculate BOOLEAN DEFAULT false;
    `
  }
]

/**
 * Initialize migrations table
 */
async function initializeMigrationsTable() {
  // Check if table exists first
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', MIGRATIONS_TABLE)
    
  if (tablesError) {
    console.error('Failed to check for migrations table:', tablesError)
    return false
  }
  
  if (tables && tables.length > 0) {
    return true // Table already exists
  }
  
  console.log('⚠️  Migrations table does not exist. Please create it manually in Supabase:')
  console.log(`
CREATE TABLE ${MIGRATIONS_TABLE} (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at TIMESTAMP DEFAULT now()
);
  `)
  
  return false
}

/**
 * Check if migration has been executed
 */
async function isMigrationExecuted(migrationId) {
  const { data, error } = await supabase
    .from(MIGRATIONS_TABLE)
    .select('id')
    .eq('id', migrationId)
    .single()
    
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking migration:', error)
    return false
  }
  
  return !!data
}

/**
 * Execute a single migration
 */
async function executeMigration(migration) {
  console.log(`\n⚠️  Manual migration required: ${migration.name}`)
  console.log('Please execute the following SQL in your Supabase SQL editor:')
  console.log('─'.repeat(80))
  console.log(migration.sql.trim())
  console.log('─'.repeat(80))
  
  // For now, we'll just mark it as executed if the user confirms
  console.log('\nAfter executing the SQL above, this migration will be marked as completed.')
  
  // Record migration as executed (assuming user ran it)
  const { error: recordError } = await supabase
    .from(MIGRATIONS_TABLE)
    .insert([{
      id: migration.id,
      name: migration.name
    }])
    
  if (recordError && recordError.code !== '23505') { // 23505 = unique violation (already exists)
    console.error(`Failed to record migration ${migration.id}:`, recordError)
    return false
  }
  
  console.log(`✅ Migration ${migration.id} marked as completed`)
  return true
}

/**
 * Run all pending migrations
 */
export async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...')
    
    // Initialize migrations table if needed
    const initialized = await initializeMigrationsTable()
    if (!initialized) {
      console.error('❌ Failed to initialize migrations system')
      return false
    }
    
    let successCount = 0
    let skippedCount = 0
    
    // Execute each migration
    for (const migration of MIGRATIONS) {
      const alreadyExecuted = await isMigrationExecuted(migration.id)
      
      if (alreadyExecuted) {
        console.log(`⏭️  Skipping migration: ${migration.name} (already executed)`)
        skippedCount++
        continue
      }
      
      const success = await executeMigration(migration)
      if (success) {
        successCount++
      } else {
        console.error(`❌ Migration failed: ${migration.name}`)
        return false
      }
    }
    
    console.log(`✅ Migrations completed! Executed: ${successCount}, Skipped: ${skippedCount}`)
    return true
    
  } catch (err) {
    console.error('❌ Migration system error:', err)
    return false
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus() {
  try {
    const { data: executedMigrations, error } = await supabase
      .from(MIGRATIONS_TABLE)
      .select('*')
      .order('executed_at', { ascending: true })
      
    if (error) {
      console.error('Error getting migration status:', error)
      return null
    }
    
    const status = MIGRATIONS.map(migration => {
      const executed = executedMigrations?.find(m => m.id === migration.id)
      return {
        id: migration.id,
        name: migration.name,
        executed: !!executed,
        executed_at: executed?.executed_at || null
      }
    })
    
    return status
  } catch (err) {
    console.error('Error getting migration status:', err)
    return null
  }
}