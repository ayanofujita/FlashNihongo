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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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

  async createCard(card: InsertCard): Promise<Card> {
    const [newCard] = await db.insert(cards).values(card).returning();
    return newCard;
  }

  async updateCard(
    id: number,
    cardUpdate: Partial<InsertCard>,
  ): Promise<Card | undefined> {
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
        const updateData = { 
          ...update,
          lastReviewed: now 
        };
        
        console.log(`Updating existing progress with data:`, JSON.stringify(updateData));
  
        const [updatedProgress] = await db
          .update(studyProgress)
          .set(updateData)
          .where(
            and(
              eq(studyProgress.userId, userId),
              eq(studyProgress.cardId, cardId)
            )
          )
          .returning();
        
        console.log(
          `Progress updated for card ${cardId}, next review: ${updatedProgress.nextReview?.toISOString()}`
        );
        
        return updatedProgress;
      } else {
        // Create new progress
        const insertData = {
          cardId,
          userId,
          ease: update.ease || 250,
          interval: update.interval || 0,
          reviews: update.reviews || 1,
          lapses: update.lapses || 0,
          lastReviewed: now,
          nextReview: update.nextReview || now,
        };
        
        console.log(`Creating new progress with data:`, JSON.stringify(insertData));
  
        const [newProgress] = await db
          .insert(studyProgress)
          .values(insertData)
          .returning();
        
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
