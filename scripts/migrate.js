#!/usr/bin/env node

/**
 * Database Migration Runner
 * Run with: node scripts/migrate.js
 */

import { runMigrations, getMigrationStatus } from '../src/shared/infrastructure/migrations.js'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'run'
  
  switch (command) {
    case 'run':
      console.log('🚀 Running database migrations...')
      const success = await runMigrations()
      process.exit(success ? 0 : 1)
      break
      
    case 'status':
      console.log('📊 Checking migration status...')
      const status = await getMigrationStatus()
      if (status) {
        console.table(status)
      } else {
        console.error('❌ Failed to get migration status')
        process.exit(1)
      }
      break
      
    default:
      console.log(`
Usage: node scripts/migrate.js [command]

Commands:
  run     Run all pending migrations (default)
  status  Show migration status
      `)
      break
  }
}

main().catch(err => {
  console.error('❌ Migration runner error:', err)
  process.exit(1)
})