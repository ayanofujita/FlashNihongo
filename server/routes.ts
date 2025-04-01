import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchWord } from "./jisho-api";
import { insertDeckSchema, insertCardSchema, insertUserStatsSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Extend the Express Request type to include our custom session properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Deck routes
  app.get("/api/decks", async (req, res) => {
    try {
      const decks = await storage.getDecks();
      res.json(decks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch decks" });
    }
  });

  app.get("/api/decks/due", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const decks = await storage.getDecks();

      if (!decks || decks.length === 0) {
        console.log("No decks found.");
        return res.json([]);
      }

      console.log("Fetching due info for all decks...");
      
      const decksWithDueInfo = await Promise.all(
        decks.map(async (deck) => {
          const dueCards = await storage.getCardsDueForReview(userId, [deck.id]);
          return {
            ...deck,
            hasDueCards: dueCards.length > 0,
            dueCardCount: dueCards.length,
          };
        }),
      );

      // Only return decks with due cards if filter=true is specified
      if (req.query.filter === "true") {
        const filteredDecks = decksWithDueInfo.filter(deck => deck.hasDueCards);
        console.log(`Returning ${filteredDecks.length} decks with due cards (filtered)`);
        return res.json(filteredDecks);
      }

      console.log(`Returning ${decksWithDueInfo.length} decks with due info`);
      return res.json(decksWithDueInfo);
    } catch (error) {
      console.error("Error fetching due decks:", error);
      res.status(500).json({ message: "Failed to fetch decks with due info" });
    }
  });

  app.get("/api/decks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deck = await storage.getDeck(id);

      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }

      res.json(deck);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deck" });
    }
  });

  app.post("/api/decks", async (req, res) => {
    try {
      const validation = insertDeckSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid deck data",
          errors: validation.error.errors,
        });
      }

      const newDeck = await storage.createDeck(validation.data);
      res.status(201).json(newDeck);
    } catch (error) {
      res.status(500).json({ message: "Failed to create deck" });
    }
  });

  app.put("/api/decks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertDeckSchema.partial().safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid deck data",
          errors: validation.error.errors,
        });
      }

      const updatedDeck = await storage.updateDeck(id, validation.data);

      if (!updatedDeck) {
        return res.status(404).json({ message: "Deck not found" });
      }

      res.json(updatedDeck);
    } catch (error) {
      res.status(500).json({ message: "Failed to update deck" });
    }
  });

  app.delete("/api/decks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteDeck(id);

      if (!result) {
        return res.status(404).json({ message: "Deck not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete deck" });
    }
  });

  // Card routes
  app.get("/api/decks/:deckId/cards", async (req, res) => {
    try {
      const deckId = parseInt(req.params.deckId);
      const cards = await storage.getCards(deckId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.get("/api/cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const card = await storage.getCard(id);

      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card" });
    }
  });

  app.post("/api/cards", async (req, res) => {
    try {
      const validation = insertCardSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid card data",
          errors: validation.error.errors,
        });
      }

      const newCard = await storage.createCard(validation.data);
      res.status(201).json(newCard);
    } catch (error) {
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.put("/api/cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertCardSchema.partial().safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid card data",
          errors: validation.error.errors,
        });
      }

      const updatedCard = await storage.updateCard(id, validation.data);

      if (!updatedCard) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.json(updatedCard);
    } catch (error) {
      res.status(500).json({ message: "Failed to update card" });
    }
  });

  app.delete("/api/cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteCard(id);

      if (!result) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete card" });
    }
  });

  // Study routes
  app.get("/api/study/due", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1; // Default to user 1 for this example
      const deckIds =
        (req.query.deckIds as string)?.split(",").map((id) => parseInt(id)) ||
        [];

      if (deckIds.length === 0) {
        return res.status(400).json({ message: "No deck IDs provided" });
      }

      const dueCards = await storage.getCardsDueForReview(userId, deckIds);
      res.json(dueCards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due cards" });
    }
  });

  app.get("/api/study/progress", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const cardId = parseInt(req.query.cardId as string);

      if (!userId || !cardId) {
        return res
          .status(400)
          .json({ message: "User ID and Card ID are required" });
      }

      const progress = await storage.getStudyProgress(userId, cardId);
      if (!progress) {
        return res.status(404).json({ message: "Study progress not found" });
      }

      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study progress" });
    }
  });

  app.post("/api/study/progress", async (req, res) => {
    try {
      const { cardId, userId, ease, interval, reviews, lapses, nextReview } =
        req.body;

      if (!cardId || !userId) {
        return res
          .status(400)
          .json({ message: "Card ID and User ID are required" });
      }

      console.log(
        `Updating study progress for card ${cardId}, user ${userId}, nextReview: ${nextReview}`,
      );

      const progress = await storage.updateStudyProgress(cardId, userId, {
        ease,
        interval,
        reviews,
        lapses,
        nextReview: nextReview ? new Date(nextReview) : undefined,
      });

      // Also update the deck's last studied timestamp
      const card = await storage.getCard(cardId);
      if (card) {
        await storage.updateDeckLastStudied(card.deckId);
      }

      res.json(progress);
    } catch (error) {
      console.error("Error updating study progress:", error);
      res.status(500).json({ message: "Failed to update study progress", error: String(error) });
    }
  });

  // Dictionary search routes
  app.get("/api/dictionary/search", async (req, res) => {
    try {
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      const results = await searchWord(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search dictionary" });
    }
  });

  // User Stats routes
  app.get("/api/user-stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const stats = await storage.getUserStats(userId);
      
      if (!stats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.post("/api/user-stats/update-streak/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const updatedStats = await storage.updateStreak(userId);
      res.json(updatedStats);
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  app.post("/api/user-stats/increment-review/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { correct } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      if (typeof correct !== 'boolean') {
        return res.status(400).json({ message: "'correct' boolean is required" });
      }

      const updatedStats = await storage.incrementReviewStats(userId, correct);
      res.json(updatedStats);
    } catch (error) {
      console.error("Error incrementing review stats:", error);
      res.status(500).json({ message: "Failed to increment review stats" });
    }
  });

  app.put("/api/user-stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const validation = insertUserStatsSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid stats data",
          errors: validation.error.errors,
        });
      }

      const updatedStats = await storage.updateUserStats(userId, validation.data);
      
      if (!updatedStats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      
      res.json(updatedStats);
    } catch (error) {
      console.error("Error updating user stats:", error);
      res.status(500).json({ message: "Failed to update user stats" });
    }
  });

  // User routes
  app.get("/api/user", async (req, res) => {
    try {
      // Get user from session (this would be set by Passport or other auth middleware)
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send sensitive data to the client
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Google auth integration route - handle data from Firebase
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { googleId, email, displayName, profilePicture } = req.body;
      
      if (!googleId || !email) {
        return res.status(400).json({ message: "Google ID and email are required" });
      }
      
      // Check if user with this Google ID already exists
      let user = await storage.getUserByGoogleId(googleId);
      
      if (!user) {
        // Check if user with this email exists
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // Update existing user with Google info
          user = await storage.updateUser(user.id, { 
            googleId, 
            displayName: displayName || user.displayName,
            profilePicture: profilePicture || user.profilePicture
          });
        } else {
          // Create new user
          const username = email.split('@')[0]; // Use first part of email as username
          user = await storage.createUser({
            username,
            email,
            googleId,
            displayName: displayName || username,
            profilePicture: profilePicture || null
          });

          // Also create user stats for the new user
          await storage.createUserStats({
            userId: user.id,
            totalReviews: 0,
            totalCorrect: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: null,
            cardsLearned: 0,
            studyTime: 0
          });
        }
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Don't send sensitive data to the client
      const { password, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error authenticating with Google:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
