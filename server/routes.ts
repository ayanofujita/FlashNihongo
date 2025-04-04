import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchWord } from "./jisho-api";
import { insertDeckSchema, insertCardSchema, insertUserStatsSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Extend Express to work with Passport.js
declare global {
  namespace Express {
    // Define User interface for Passport without circular reference
    interface User {
      id: number;
      username: string;
      email?: string;
      displayName?: string;
      profilePicture?: string;
      googleId?: string;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Deck routes
  app.get("/api/decks", async (req, res) => {
    try {
      // Get the authenticated user from the request
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get only the decks owned by the user
      const decks = await storage.getDecksByUserId(userId);
      res.json(decks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      res.status(500).json({ message: "Failed to fetch decks" });
    }
  });

  app.get("/api/decks/due", async (req, res) => {
    try {
      // Get the authenticated user from the request
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get only the decks owned by the user
      const decks = await storage.getDecksByUserId(userId);

      if (!decks || decks.length === 0) {
        console.log("No decks found for user.");
        return res.json([]);
      }

      console.log(`Fetching due info for ${decks.length} decks owned by user ${userId}...`);
      
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
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const deck = await storage.getDeck(id);

      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      // Check if the user owns this deck
      if (deck.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this deck" });
      }

      res.json(deck);
    } catch (error) {
      console.error("Error fetching deck:", error);
      res.status(500).json({ message: "Failed to fetch deck" });
    }
  });

  app.post("/api/decks", async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validation = insertDeckSchema.safeParse({
        ...req.body,
        userId: userId // Always set the user ID to the authenticated user
      });

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid deck data",
          errors: validation.error.errors,
        });
      }

      const newDeck = await storage.createDeck(validation.data);
      res.status(201).json(newDeck);
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).json({ message: "Failed to create deck" });
    }
  });

  app.put("/api/decks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify the user owns this deck
      const deck = await storage.getDeck(id);
      
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      if (deck.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this deck" });
      }
      
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
      console.error("Error updating deck:", error);
      res.status(500).json({ message: "Failed to update deck" });
    }
  });

  app.delete("/api/decks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Verify the user owns this deck
      const deck = await storage.getDeck(id);
      
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      if (deck.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this deck" });
      }
      
      const result = await storage.deleteDeck(id);

      if (!result) {
        return res.status(404).json({ message: "Deck not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).json({ message: "Failed to delete deck" });
    }
  });

  // Card routes
  app.get("/api/decks/:deckId/cards", async (req, res) => {
    try {
      const deckId = parseInt(req.params.deckId);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Verify the user owns this deck
      const deck = await storage.getDeck(deckId);
      
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      if (deck.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access cards from this deck" });
      }
      
      const cards = await storage.getCards(deckId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
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
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validation = insertCardSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid card data",
          errors: validation.error.errors,
        });
      }
      
      // Verify the user owns the deck in which they want to add the card
      const deckId = validation.data.deckId;
      const deck = await storage.getDeck(deckId);
      
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      if (deck.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to add cards to this deck" });
      }

      try {
        const newCard = await storage.createCard(validation.data);
        res.status(201).json(newCard);
      } catch (cardError: any) {
        // Check if this is a duplicate card error
        if (cardError.message && cardError.message.includes("already exists")) {
          return res.status(409).json({ 
            message: "Duplicate card", 
            error: cardError.message 
          });
        }
        throw cardError; // Re-throw if it's not a duplicate error
      }
    } catch (error) {
      console.error("Error creating card:", error);
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
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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
  
  // Example sentences API (using Tatoeba)
  app.get("/api/examples", async (req, res) => {
    try {
      const word = req.query.word as string;
      if (!word) {
        return res.status(400).json({ error: 'Word parameter is required' });
      }
      
      // Fetch example sentences from Tatoeba API
      const response = await fetch(`https://tatoeba.org/eng/api_v0/search?from=jpn&to=eng&query=${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        throw new Error(`Tatoeba API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format and limit the examples
      const examples = data.results
        .filter((result: any) => 
          result.text && 
          result.translations && 
          result.translations.length > 0 && 
          result.translations[0].text
        )
        .slice(0, 5)
        .map((result: any) => ({
          text: result.text,
          translation: result.translations[0].text
        }));
      
      res.json(examples);
    } catch (error) {
      console.error('Error fetching example sentences:', error);
      res.status(500).json({ error: 'Failed to fetch example sentences' });
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
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Passport puts the user object on req.user
      // We still want to fetch the latest from the database
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a safe version of the user without sensitive data
      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        googleId: user.googleId
      };
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // This endpoint is now handled by Passport.js directly

  // Logout route
  app.get("/auth/logout", (req, res) => {
    // Use Passport's logout function
    req.logout((err) => {
      if (err) {
        console.error("Error logging out:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      // Redirect to home page after successful logout
      res.redirect('/');
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
