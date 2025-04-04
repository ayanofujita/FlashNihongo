import {
  users,
  type User,
  type InsertUser,
  decks,
  type Deck,
  type InsertDeck,
  cards,
  type Card,
  type InsertCard,
  studyProgress,
  type StudyProgress,
  type InsertStudyProgress,
  userStats,
  type UserStats,
  type InsertUserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // User Stats operations
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined>;
  updateStreak(userId: number): Promise<UserStats | undefined>;
  incrementReviewStats(userId: number, correct: boolean): Promise<UserStats | undefined>;
  
  // Deck operations
  getDecks(): Promise<Deck[]>;
  getDecksByUserId(userId: number): Promise<Deck[]>;
  getDeck(id: number): Promise<Deck | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, deck: Partial<InsertDeck>): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<boolean>;
  updateDeckLastStudied(id: number): Promise<boolean>;

  // Card operations
  getCards(deckId: number): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, card: Partial<InsertCard>): Promise<Card | undefined>;
  deleteCard(id: number): Promise<boolean>;

  // Study progress operations
  getStudyProgress(
    userId: number,
    cardId: number,
  ): Promise<StudyProgress | undefined>;
  getCardsDueForReview(userId: number, deckIds: number[]): Promise<Card[]>;
  updateStudyProgress(
    cardId: number,
    userId: number,
    update: Partial<InsertStudyProgress>,
  ): Promise<StudyProgress>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Create initial user stats for the new user
    await this.createUserStats({
      userId: user.id,
      totalReviews: 0,
      totalCorrect: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      cardsLearned: 0,
      studyTime: 0,
    });
    
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // User Stats operations
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const [newStats] = await db.insert(userStats).values(stats).returning();
    return newStats;
  }

  async updateUserStats(
    userId: number,
    statsUpdate: Partial<InsertUserStats>
  ): Promise<UserStats | undefined> {
    const [updatedStats] = await db
      .update(userStats)
      .set(statsUpdate)
      .where(eq(userStats.userId, userId))
      .returning();
    return updatedStats;
  }

  async updateStreak(userId: number): Promise<UserStats | undefined> {
    // Get current user stats
    const stats = await this.getUserStats(userId);
    if (!stats) {
      // Create new stats if none exist
      return await this.createUserStats({
        userId,
        totalReviews: 0,
        totalCorrect: 0,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: new Date().toISOString().split('T')[0],
        cardsLearned: 0,
        studyTime: 0,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const lastStudyDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
    if (lastStudyDate) {
      lastStudyDate.setHours(0, 0, 0, 0); // Start of last study date
    }

    let currentStreak = stats.currentStreak || 0;
    let longestStreak = stats.longestStreak || 0;

    // If never studied before or last study was not yesterday or today
    if (!lastStudyDate) {
      // First study ever, start streak at 1
      currentStreak = 1;
    } else if (lastStudyDate.getTime() === today.getTime()) {
      // Already studied today, don't change streak
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastStudyDate.getTime() === yesterday.getTime()) {
        // Studied yesterday, increment streak
        currentStreak += 1;
      } else {
        // Streak broken, start new streak
        currentStreak = 1;
      }
    }

    // Update longest streak if needed
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Update stats with new streak info
    return await this.updateUserStats(userId, {
      currentStreak,
      longestStreak,
      lastStudyDate: today.toISOString().split('T')[0],
    });
  }

  async incrementReviewStats(userId: number, correct: boolean): Promise<UserStats | undefined> {
    const stats = await this.getUserStats(userId);
    if (!stats) {
      // Create new stats if none exist
      return await this.createUserStats({
        userId,
        totalReviews: 1,
        totalCorrect: correct ? 1 : 0,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        cardsLearned: 0,
        studyTime: 0,
      });
    }

    return await this.updateUserStats(userId, {
      totalReviews: (stats.totalReviews || 0) + 1,
      totalCorrect: (stats.totalCorrect || 0) + (correct ? 1 : 0),
    });
  }

  // Deck operations
  async getDecks(): Promise<Deck[]> {
    return await db.select().from(decks);
  }

  async getDecksByUserId(userId: number): Promise<Deck[]> {
    return await db.select().from(decks).where(eq(decks.userId, userId));
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    return deck;
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const [newDeck] = await db.insert(decks).values(deck).returning();
    return newDeck;
  }

  async updateDeck(
    id: number,
    deckUpdate: Partial<InsertDeck>,
  ): Promise<Deck | undefined> {
    const [updatedDeck] = await db
      .update(decks)
      .set(deckUpdate)
      .where(eq(decks.id, id))
      .returning();
    return updatedDeck;
  }

  async deleteDeck(id: number): Promise<boolean> {
    // First delete all study progress records related to cards in this deck
    const deckCards = await this.getCards(id);
    for (const card of deckCards) {
      // Delete the card which will cascade to delete its study progress
      await this.deleteCard(card.id);
    }

    // Now delete the deck
    const result = await db.delete(decks).where(eq(decks.id, id)).returning({ id: decks.id });
    return result.length > 0;
  }

  async updateDeckLastStudied(id: number): Promise<boolean> {
    const result = await db
      .update(decks)
      .set({ lastStudied: new Date() })
      .where(eq(decks.id, id))
      .returning({ id: decks.id });
    return result.length > 0;
  }

  // Card operations
  async getCards(deckId: number): Promise<Card[]> {
    return await db.select().from(cards).where(eq(cards.deckId, deckId));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card;
  }

  async checkCardExists(deckId: number, front: string): Promise<boolean> {
    // Check if a card with the same front text already exists in the deck
    const existingCards = await db
      .select()
      .from(cards)
      .where(and(
        eq(cards.deckId, deckId),
        eq(cards.front, front)
      ));
    
    return existingCards.length > 0;
  }

  async createCard(card: InsertCard): Promise<Card> {
    // Check if card with same front text already exists in the deck
    const exists = await this.checkCardExists(card.deckId, card.front);
    if (exists) {
      throw new Error(`Card with text "${card.front}" already exists in this deck`);
    }
    
    const [newCard] = await db.insert(cards).values(card).returning();
    return newCard;
  }

  async updateCard(
    id: number,
    cardUpdate: Partial<InsertCard>,
  ): Promise<Card | undefined> {
    // If updating the front text, check if it would create a duplicate
    if (cardUpdate.front) {
      // First get the current card to get its deck ID
      const currentCard = await this.getCard(id);
      if (currentCard) {
        // If front text changed, check for duplicates
        if (currentCard.front !== cardUpdate.front) {
          const exists = await this.checkCardExists(currentCard.deckId, cardUpdate.front);
          if (exists) {
            throw new Error(`Card with text "${cardUpdate.front}" already exists in this deck`);
          }
        }
      }
    }
    
    const [updatedCard] = await db
      .update(cards)
      .set(cardUpdate)
      .where(eq(cards.id, id))
      .returning();
    return updatedCard;
  }

  async deleteCard(id: number): Promise<boolean> {
    // First delete all study progress related to this card
    await db
      .delete(studyProgress)
      .where(eq(studyProgress.cardId, id));

    // Now delete the card
    const result = await db
      .delete(cards)
      .where(eq(cards.id, id))
      .returning({ id: cards.id });
    return result.length > 0;
  }

  // Study progress operations
  async getStudyProgress(
    userId: number,
    cardId: number,
  ): Promise<StudyProgress | undefined> {
    const [progress] = await db
      .select()
      .from(studyProgress)
      .where(
        and(
          eq(studyProgress.userId, userId),
          eq(studyProgress.cardId, cardId)
        )
      );
    return progress;
  }

  async getCardsDueForReview(
    userId: number,
    deckIds: number[],
  ): Promise<Card[]> {
    const now = new Date();
    console.log(`Checking cards in decks [${deckIds.join(', ')}] for user ${userId}`);

    // Get all cards from specified decks
    const deckCards = await db
      .select()
      .from(cards)
      .where(inArray(cards.deckId, deckIds));

    const dueCards: Card[] = [];
    
    for (const card of deckCards) {
      // Check if there's a study progress record for this card
      const [progress] = await db
        .select()
        .from(studyProgress)
        .where(
          and(
            eq(studyProgress.userId, userId),
            eq(studyProgress.cardId, card.id)
          )
        );

      // Check if the card is due for review
      const isDue = !progress || !progress.nextReview || progress.nextReview <= now;

      // Log for debugging purposes
      if (progress) {
        const nextReviewDate = progress.nextReview
          ? progress.nextReview.toISOString()
          : "undefined";
        console.log(
          `Card ${card.id} - nextReview: ${nextReviewDate}, isDue: ${isDue}, now: ${now.toISOString()}`
        );
      } else {
        console.log(`Card ${card.id} - No progress record, consider due`);
      }

      if (isDue) {
        dueCards.push(card);
      }
    }

    // Sort cards so newer cards appear first
    dueCards.sort((a, b) => {
      const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreatedAt - aCreatedAt; // Newer cards first
    });

    console.log(`Returning ${dueCards.length} due cards for review`);
    return dueCards;
  }

  async updateStudyProgress(
    cardId: number,
    userId: number,
    update: Partial<InsertStudyProgress>,
  ): Promise<StudyProgress> {
    const now = new Date();
    
    try {
      // Check if progress already exists
      const existingProgress = await this.getStudyProgress(userId, cardId);
  
      if (existingProgress) {
        // Update existing progress
        // Create a properly typed update object for Drizzle with explicit typing
        const typedUpdateData: Record<string, any> = {
          lastReviewed: now
        };
        
        // Only include fields that are present in the update
        if (update.ease !== undefined) typedUpdateData.ease = update.ease;
        if (update.reviews !== undefined) typedUpdateData.reviews = update.reviews;
        if (update.lapses !== undefined) typedUpdateData.lapses = update.lapses;
        if (update.nextReview !== undefined) typedUpdateData.nextReview = update.nextReview;
        
        // Handle interval carefully - make sure it's stored as a string in the database
        if (update.interval !== undefined) {
          // Log interval type before conversion
          console.log(`INTERVAL UPDATE - original value: ${update.interval}, type: ${typeof update.interval}`);
          
          // Convert to string for storage
          typedUpdateData.interval = String(update.interval);
          
          console.log(`INTERVAL UPDATE - converted to: ${typedUpdateData.interval}`);
        }
        
        console.log(`Updating existing progress with data:`, JSON.stringify(typedUpdateData));
  
        const [updatedProgress] = await db
          .update(studyProgress)
          .set(typedUpdateData as any)
          .where(
            and(
              eq(studyProgress.userId, userId),
              eq(studyProgress.cardId, cardId)
            )
          )
          .returning();
        
        console.log(
          `Progress updated for card ${cardId}, next review: ${updatedProgress.nextReview?.toISOString()}, interval: ${updatedProgress.interval}, ease: ${updatedProgress.ease}`
        );
        
        return updatedProgress;
      } else {
        // Create new progress
        // Handle the interval value - make sure it's always a string for storage
        let intervalValue = "0";
        if (update.interval !== undefined) {
          console.log(`NEW PROGRESS INTERVAL - original value: ${update.interval}, type: ${typeof update.interval}`);
          intervalValue = String(update.interval);
          console.log(`NEW PROGRESS INTERVAL - converted to: ${intervalValue}`);
        }
        
        const insertData = {
          cardId,
          userId,
          ease: update.ease || 250,
          interval: intervalValue,
          reviews: update.reviews || 1,
          lapses: update.lapses || 0,
          lastReviewed: now,
          nextReview: update.nextReview || now,
        };
        
        console.log(`Creating new progress with data:`, JSON.stringify(insertData));
  
        const newProgressResult = await db
          .insert(studyProgress)
          .values([insertData])
          .returning();
          
        const newProgress = newProgressResult[0];
        
        console.log(
          `New progress created for card ${cardId}, next review: ${newProgress.nextReview?.toISOString()}`
        );
        
        return newProgress;
      }
    } catch (error) {
      console.error(`Error in updateStudyProgress for card ${cardId}, user ${userId}:`, error);
      throw error;
    }
  }
}

// Initialize with the database storage implementation
export const storage = new DatabaseStorage();
