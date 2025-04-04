/**
 * This script fixes the interval field in the study_progress table
 * to ensure all intervals are stored as numeric values in the database.
 * 
 * Even though we store intervals as strings in the database (PostgreSQL requirement),
 * this script ensures they're valid numeric strings.
 */

import { db } from '../server/db.js';
import { studyProgress } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function fixIntervals() {
  console.log('Starting interval data cleanup...');
  
  try {
    // 1. First get all study progress records
    const allProgress = await db.select().from(studyProgress);
    console.log(`Found ${allProgress.length} study progress records to analyze`);
    
    let updateCount = 0;
    
    // 2. Process each record
    for (const progress of allProgress) {
      const { id, interval, cardId, userId } = progress;
      
      // Check if the interval is already a valid number stored as string
      const currentInterval = interval ? String(interval) : '0';
      const parsedInterval = parseFloat(currentInterval);
      
      // If current interval isn't a valid number, fix it
      if (isNaN(parsedInterval)) {
        console.log(`Found invalid interval "${interval}" for progress ID ${id}`);
        
        // Update with a default of 0
        await db.update(studyProgress)
          .set({ interval: '0' })
          .where(eq(studyProgress.id, id));
          
        updateCount++;
        console.log(`Fixed progress ID ${id} interval to "0"`);
      }
    }
    
    console.log(`Completed interval cleanup. Fixed ${updateCount} records.`);
  } catch (error) {
    console.error('Error fixing intervals:', error);
  } finally {
    // Always close the DB connection
    process.exit(0);
  }
}

// Run the function
fixIntervals();