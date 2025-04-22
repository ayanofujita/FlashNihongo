import { pgTable, text, serial, integer, boolean, timestamp, json, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").unique(),
  displayName: text("display_name"),
  googleId: text("google_id").unique(),
  profilePicture: text("profile_picture"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
  googleId: true,
  profilePicture: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Stats schema
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  totalReviews: integer("total_reviews").default(0),
  totalCorrect: integer("total_correct").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastStudyDate: date("last_study_date"),
  cardsLearned: integer("cards_learned").default(0),
  studyTime: integer("study_time_minutes").default(0), // Total time spent studying in minutes
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  totalReviews: true,
  totalCorrect: true,
  currentStreak: true,
  longestStreak: true,
  lastStudyDate: true,
  cardsLearned: true,
  studyTime: true,
});

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

// Deck schema
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  lastStudied: timestamp("last_studied"),
});

export const insertDeckSchema = createInsertSchema(decks).pick({
  name: true,
  description: true,
  userId: true,
});

export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Deck = typeof decks.$inferSelect;

// Card schema
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").references(() => decks.id).notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  reading: text("reading"),
  example: text("example"),
  exampleTranslation: text("example_translation"),
  partOfSpeech: text("part_of_speech"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCardSchema = createInsertSchema(cards).pick({
  deckId: true,
  front: true,
  back: true,
  reading: true,
  example: true,
  exampleTranslation: true,
  partOfSpeech: true,
});

export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;

// Study progress schema
export const studyProgress = pgTable("study_progress", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  ease: integer("ease").default(250),
  interval: numeric("interval", { precision: 5, scale: 2 }).default("0").notNull(), // PostgreSQL numeric stored as string but handled as number in code
  reviews: integer("reviews").default(0),
  lapses: integer("lapses").default(0),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
});

// Create a schema and extend the interval to accept number type too
export const insertStudyProgressSchema = createInsertSchema(studyProgress)
  .pick({
    cardId: true,
    userId: true,
    ease: true,
    interval: true,
    reviews: true,
    lapses: true,
    nextReview: true,
  })
  .extend({
    // Prefer number for interval (with string fallback for backward compatibility)
    interval: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
  });

export type InsertStudyProgress = z.infer<typeof insertStudyProgressSchema>;
export type StudyProgress = typeof studyProgress.$inferSelect;

// Dictionary API result type
export const dictionaryResultSchema = z.object({
  slug: z.string(),
  japanese: z.array(z.object({
    word: z.string().optional(),
    reading: z.string().optional(),
  })).min(1),
  senses: z.array(z.object({
    english_definitions: z.array(z.string()),
    parts_of_speech: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    examples: z.array(z.object({
      text: z.string(),
      translation: z.string().optional(),
    })).optional(),
  })).min(1),
});

export type DictionaryResult = z.infer<typeof dictionaryResultSchema>;
