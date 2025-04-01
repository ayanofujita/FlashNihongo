import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchWord } from "./jisho-api";
import { insertDeckSchema, insertCardSchema } from "@shared/schema";
import { z } from "zod";

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
          errors: validation.error.errors 
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
          errors: validation.error.errors 
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
          errors: validation.error.errors 
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
          errors: validation.error.errors 
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
      const deckIds = (req.query.deckIds as string)?.split(',').map(id => parseInt(id)) || [];
      
      if (deckIds.length === 0) {
        return res.status(400).json({ message: "No deck IDs provided" });
      }
      
      const dueCards = await storage.getCardsDueForReview(userId, deckIds);
      res.json(dueCards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due cards" });
    }
  });

  app.post("/api/study/progress", async (req, res) => {
    try {
      const { cardId, userId, ease, interval, reviews, lapses, nextReview } = req.body;
      
      if (!cardId || !userId) {
        return res.status(400).json({ message: "Card ID and User ID are required" });
      }
      
      const progress = await storage.updateStudyProgress(cardId, userId, {
        ease, interval, reviews, lapses, nextReview: nextReview ? new Date(nextReview) : undefined
      });
      
      // Also update the deck's last studied timestamp
      const card = await storage.getCard(cardId);
      if (card) {
        await storage.updateDeckLastStudied(card.deckId);
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update study progress" });
    }
  });

  // Get decks with due cards
  app.get("/api/decks/due", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      
      if (req.query.deckId) {
        // If a specific deck ID is requested
        const deckId = parseInt(req.query.deckId as string);
        const deck = await storage.getDeck(deckId);
        
        if (!deck) {
          return res.status(404).json({ message: "Deck not found" });
        }
        
        const dueCards = await storage.getCardsDueForReview(userId, [deckId]);
        const deckWithDueInfo = {
          ...deck,
          hasDueCards: dueCards.length > 0,
          dueCardCount: dueCards.length
        };
        
        return res.json(deckWithDueInfo);
      }
      
      // Get all decks if no deck ID specified
      const decks = await storage.getDecks();
      
      // For each deck, check if there are any due cards
      const decksWithDueInfo = await Promise.all(
        decks.map(async (deck) => {
          const dueCards = await storage.getCardsDueForReview(userId, [deck.id]);
          return {
            ...deck,
            hasDueCards: dueCards.length > 0,
            dueCardCount: dueCards.length
          };
        })
      );
      
      // Only return decks with due cards if filter=true is specified
      if (req.query.filter === 'true') {
        const filtered = decksWithDueInfo.filter(deck => deck.hasDueCards);
        return res.json(filtered);
      }
      
      res.json(decksWithDueInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch decks with due info" });
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

  const httpServer = createServer(app);
  return httpServer;
}
