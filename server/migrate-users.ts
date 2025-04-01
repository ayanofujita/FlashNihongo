import { db } from './db';
import { sql } from 'drizzle-orm';

async function migrateUsersTable() {
  console.log('Starting users table migration...');
  
  try {
    // Add new columns
    console.log('Adding new columns to users table...');
    
    // Make password nullable
    await db.execute(sql`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);
    console.log('- Made password column nullable');
    
    // Add email column
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`);
    console.log('- Added email column');
    
    // Add displayName column
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`);
    console.log('- Added display_name column');
    
    // Add googleId column
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`);
    console.log('- Added google_id column');
    
    // Add profilePicture column
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT`);
    console.log('- Added profile_picture column');
    
    console.log('Users table migration completed successfully!');
  } catch (error) {
    console.error('Error migrating users table:', error);
  }
}

// Run the migration
migrateUsersTable().then(() => {
  console.log('Migration completed.');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});