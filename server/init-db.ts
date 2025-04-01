import { db } from './db';
import { users, decks, cards } from '@shared/schema';

/**
 * This script initializes the PostgreSQL database with sample data.
 * It should be run once after the database tables are created.
 */
export async function initializeDatabase() {
  console.log('Starting database initialization...');

  try {
    // Check if we already have data
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('Database already contains data, skipping initialization.');
      return;
    }

    console.log('Creating sample user...');
    // Create sample user
    const [user] = await db.insert(users).values({
      username: 'demo',
      password: 'password', // In a real app, this would be hashed
    }).returning();

    console.log(`Created user with ID: ${user.id}`);

    // Create sample decks
    console.log('Creating sample decks...');
    const [jlptDeck] = await db.insert(decks).values({
      name: 'JLPT N5 Vocabulary',
      description: 'Essential vocabulary for JLPT N5 level',
      userId: user.id,
      createdAt: new Date(),
      lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    }).returning();

    const [verbsDeck] = await db.insert(decks).values({
      name: 'Common Verbs',
      description: 'Most frequently used Japanese verbs',
      userId: user.id,
      createdAt: new Date(),
      lastStudied: new Date(),
    }).returning();

    const [radicalsDeck] = await db.insert(decks).values({
      name: 'Kanji Radicals',
      description: 'Basic kanji radicals and their meanings',
      userId: user.id,
      createdAt: new Date(),
      lastStudied: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    }).returning();

    console.log(`Created decks with IDs: ${jlptDeck.id}, ${verbsDeck.id}, ${radicalsDeck.id}`);

    // Create sample cards
    console.log('Creating sample cards...');
    await db.insert(cards).values([
      {
        deckId: jlptDeck.id,
        front: '食べる',
        back: 'to eat',
        reading: 'たべる (taberu)',
        partOfSpeech: 'Verb (Group 2)',
        example: '私はりんごを食べる。',
        exampleTranslation: 'I eat an apple.',
        createdAt: new Date(),
      },
      {
        deckId: jlptDeck.id,
        front: '図書館',
        back: 'library',
        reading: 'としょかん (toshokan)',
        partOfSpeech: 'Noun',
        example: '図書館で本を借りました。',
        exampleTranslation: 'I borrowed a book from the library.',
        createdAt: new Date(),
      }
    ]);

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}