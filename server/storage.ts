import { 
  users, type User, type InsertUser,
  decks, type Deck, type InsertDeck,
  cards, type Card, type InsertCard,
  studyProgress, type StudyProgress, type InsertStudyProgress 
} from "@shared/schema";

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
  getStudyProgress(userId: number, cardId: number): Promise<StudyProgress | undefined>;
  getCardsDueForReview(userId: number, deckIds: number[]): Promise<Card[]>;
  updateStudyProgress(cardId: number, userId: number, update: Partial<InsertStudyProgress>): Promise<StudyProgress>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private decks: Map<number, Deck>;
  private cards: Map<number, Card>;
  private studyProgresses: Map<string, StudyProgress>;
  
  private userIdCounter: number;
  private deckIdCounter: number;
  private cardIdCounter: number;
  private studyProgressIdCounter: number;

  constructor() {
    this.users = new Map();
    this.decks = new Map();
    this.cards = new Map();
    this.studyProgresses = new Map();
    
    this.userIdCounter = 1;
    this.deckIdCounter = 1;
    this.cardIdCounter = 1;
    this.studyProgressIdCounter = 1;
    
    // Add some initial sample data
    this.loadSampleData();
  }

  private loadSampleData() {
    // Create sample user
    const user: User = {
      id: this.userIdCounter++,
      username: "demo",
      password: "password", // In a real app, this would be hashed
    };
    this.users.set(user.id, user);

    // Create sample decks
    const jlptDeck: Deck = {
      id: this.deckIdCounter++,
      name: "JLPT N5 Vocabulary",
      description: "Essential vocabulary for JLPT N5 level",
      userId: user.id,
      createdAt: new Date(),
      lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    };
    this.decks.set(jlptDeck.id, jlptDeck);

    const verbsDeck: Deck = {
      id: this.deckIdCounter++,
      name: "Common Verbs",
      description: "Most frequently used Japanese verbs",
      userId: user.id,
      createdAt: new Date(),
      lastStudied: new Date(),
    };
    this.decks.set(verbsDeck.id, verbsDeck);

    const radicalsDeck: Deck = {
      id: this.deckIdCounter++,
      name: "Kanji Radicals",
      description: "Basic kanji radicals and their meanings",
      userId: user.id,
      createdAt: new Date(),
      lastStudied: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    };
    this.decks.set(radicalsDeck.id, radicalsDeck);

    // Create sample cards
    const card1: Card = {
      id: this.cardIdCounter++,
      deckId: jlptDeck.id,
      front: "食べる",
      back: "to eat",
      reading: "たべる (taberu)",
      partOfSpeech: "Verb (Group 2)",
      example: "私はりんごを食べる。",
      exampleTranslation: "I eat an apple.",
      createdAt: new Date(),
    };
    this.cards.set(card1.id, card1);

    const card2: Card = {
      id: this.cardIdCounter++,
      deckId: jlptDeck.id,
      front: "図書館",
      back: "library",
      reading: "としょかん (toshokan)",
      partOfSpeech: "Noun",
      example: "図書館で本を借りました。",
      exampleTranslation: "I borrowed a book from the library.",
      createdAt: new Date(),
    };
    this.cards.set(card2.id, card2);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Deck operations
  async getDecks(): Promise<Deck[]> {
    return Array.from(this.decks.values());
  }

  async getDecksByUserId(userId: number): Promise<Deck[]> {
    return Array.from(this.decks.values()).filter(
      (deck) => deck.userId === userId
    );
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    return this.decks.get(id);
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const id = this.deckIdCounter++;
    const now = new Date();
    const newDeck: Deck = { 
      id,
      name: deck.name,
      description: deck.description ?? null,
      userId: deck.userId ?? null,
      createdAt: now,
      lastStudied: null
    };
    this.decks.set(id, newDeck);
    return newDeck;
  }

  async updateDeck(id: number, deck: Partial<InsertDeck>): Promise<Deck | undefined> {
    const existingDeck = this.decks.get(id);
    if (!existingDeck) return undefined;

    const updatedDeck: Deck = { ...existingDeck, ...deck };
    this.decks.set(id, updatedDeck);
    return updatedDeck;
  }

  async deleteDeck(id: number): Promise<boolean> {
    // First delete all cards in this deck
    const deckCards = Array.from(this.cards.values()).filter(
      (card) => card.deckId === id
    );
    
    for (const card of deckCards) {
      await this.deleteCard(card.id);
    }
    
    return this.decks.delete(id);
  }

  async updateDeckLastStudied(id: number): Promise<boolean> {
    const deck = this.decks.get(id);
    if (!deck) return false;
    
    deck.lastStudied = new Date();
    this.decks.set(id, deck);
    return true;
  }

  // Card operations
  async getCards(deckId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.deckId === deckId
    );
  }

  async getCard(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async createCard(card: InsertCard): Promise<Card> {
    const id = this.cardIdCounter++;
    const now = new Date();
    const newCard: Card = { 
      id, 
      deckId: card.deckId,
      front: card.front,
      back: card.back,
      reading: card.reading ?? null,
      example: card.example ?? null,
      exampleTranslation: card.exampleTranslation ?? null,
      partOfSpeech: card.partOfSpeech ?? null,
      createdAt: now
    };
    this.cards.set(id, newCard);
    return newCard;
  }

  async updateCard(id: number, card: Partial<InsertCard>): Promise<Card | undefined> {
    const existingCard = this.cards.get(id);
    if (!existingCard) return undefined;

    const updatedCard: Card = { ...existingCard, ...card };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteCard(id: number): Promise<boolean> {
    // Delete any study progress for this card
    // Find and delete all keys associated with this card
    const keysToDelete: string[] = [];
    
    this.studyProgresses.forEach((progress, key) => {
      if (progress.cardId === id) {
        keysToDelete.push(key);
      }
    });
    
    // Now delete all keys we found
    keysToDelete.forEach(key => {
      this.studyProgresses.delete(key);
    });
    
    return this.cards.delete(id);
  }

  // Study progress operations
  async getStudyProgress(userId: number, cardId: number): Promise<StudyProgress | undefined> {
    const key = `${userId}-${cardId}`;
    return this.studyProgresses.get(key);
  }

  async getCardsDueForReview(userId: number, deckIds: number[]): Promise<Card[]> {
    const now = new Date();
    const dueCards: Card[] = [];
    
    // Get all cards from the specified decks
    const deckCards = Array.from(this.cards.values()).filter(
      (card) => deckIds.includes(card.deckId)
    );
    
    console.log(`Checking ${deckCards.length} cards for user ${userId}`);
    
    for (const card of deckCards) {
      const key = `${userId}-${card.id}`;
      const progress = this.studyProgresses.get(key);
      const cardCreatedAt = card.createdAt ? new Date(card.createdAt) : null;
      
      // Only consider a card created within the last hour as "new" to avoid showing too many cards
      const createdRecently = cardCreatedAt && 
        ((now.getTime() - cardCreatedAt.getTime()) < 1 * 60 * 60 * 1000); // Created less than 1 hour ago
      
      // Check if the card is due for review
      const isDue = !progress || !progress.nextReview || progress.nextReview <= now;
      
      // Log for debugging purposes
      if (progress) {
        const nextReviewDate = progress.nextReview ? progress.nextReview.toISOString() : "undefined";
        console.log(`Card ${card.id} - nextReview: ${nextReviewDate}, isDue: ${isDue}, now: ${now.toISOString()}`);
      } else {
        console.log(`Card ${card.id} - No progress record, consider due`);
      }
      
      // Cards are due if:
      // 1. No progress record exists, or
      // 2. Next review date is <= now, or
      // 3. Card was created recently (within last hour)
      if (isDue || createdRecently) {
        dueCards.push(card);
      }
    }
    
    // Sort cards so that newly created cards appear first, followed by cards due for review
    dueCards.sort((a, b) => {
      const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreatedAt - aCreatedAt; // Newer cards first
    });
    
    console.log(`Returning ${dueCards.length} due cards for review`);
    return dueCards;
  }

  async updateStudyProgress(cardId: number, userId: number, update: Partial<InsertStudyProgress>): Promise<StudyProgress> {
    const key = `${userId}-${cardId}`;
    const now = new Date();
    let progress = this.studyProgresses.get(key);
    
    if (progress) {
      // Update existing progress
      progress = { ...progress, ...update, lastReviewed: now };
    } else {
      // Create new progress
      const id = this.studyProgressIdCounter++;
      progress = {
        id,
        cardId,
        userId,
        ease: update.ease || 250,
        interval: update.interval || 0,
        reviews: update.reviews || 1,
        lapses: update.lapses || 0,
        lastReviewed: now,
        nextReview: update.nextReview || now,
      };
    }
    
    this.studyProgresses.set(key, progress);
    return progress;
  }
}

export const storage = new MemStorage();
