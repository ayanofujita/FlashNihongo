import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const USER_ID = 2;
const BATCH_SIZE = 10; // Process 10 cards at a time

// Types
interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  reading: string | null;
  example: string | null;
  exampleTranslation: string | null;
  partOfSpeech: string | null;
}

interface Example {
  text: string;
  translation: string;
}

// Utility Functions
async function getUserCards(): Promise<Card[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/user-cards/${USER_ID}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user cards: ${response.statusText}`);
    }
    const cards = await response.json() as Card[];
    return cards;
  } catch (error) {
    console.error('Error fetching user cards:', error);
    return [];
  }
}

async function getExamples(word: string): Promise<Example[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/examples?word=${encodeURIComponent(word)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch examples: ${response.statusText}`);
    }
    const examples = await response.json() as Example[];
    return examples;
  } catch (error) {
    console.error(`Error fetching examples for word ${word}:`, error);
    return [];
  }
}

async function updateCard(card: Card, example: Example | null): Promise<boolean> {
  try {
    // Skip if the card already has an example
    if (card.example && card.exampleTranslation) {
      console.log(`Card ${card.id} (${card.front}) already has examples, skipping`);
      return false;
    }
    
    // Skip if we don't have an example
    if (!example) {
      console.log(`No example found for card ${card.id} (${card.front})`);
      return false;
    }

    const updateData = {
      example: example.text,
      exampleTranslation: example.translation
    };

    const response = await fetch(`${API_BASE_URL}/api/admin/update-card/${card.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update card: ${response.statusText}`);
    }

    const updatedCard = await response.json() as Card;
    console.log(`Updated card ${updatedCard.id} (${updatedCard.front})`);
    return true;
  } catch (error) {
    console.error(`Error updating card ${card.id} (${card.front}):`, error);
    return false;
  }
}

// Process a batch of cards
async function processBatch(cards: Card[], startIndex: number): Promise<number> {
  let successCount = 0;
  
  for (let i = 0; i < Math.min(BATCH_SIZE, cards.length - startIndex); i++) {
    const card = cards[startIndex + i];
    console.log(`Processing card ${startIndex + i + 1}/${cards.length}: "${card.front}"`);
    
    // Skip cards that already have examples
    if (card.example && card.exampleTranslation) {
      console.log(`Card ${card.id} already has examples, skipping`);
      continue;
    }
    
    // Get examples for this card
    const examples = await getExamples(card.front);
    const bestExample = examples.length > 0 ? examples[0] : null;
    
    // Update the card with the example
    const success = await updateCard(card, bestExample);
    if (success) successCount++;
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return successCount;
}

// Main Function
async function enrichCards() {
  try {
    console.log('Starting card enrichment process for User ID ' + USER_ID);
    
    // Fetch all cards for User
    const cards = await getUserCards();
    const cardsNeedingExamples = cards.filter(card => !card.example || !card.exampleTranslation);
    
    console.log(`Found ${cards.length} total cards, ${cardsNeedingExamples.length} need examples`);
    
    // Process cards in batches
    let processedCount = 0;
    let successCount = 0;
    
    while (processedCount < cards.length) {
      const batchSuccesses = await processBatch(cards, processedCount);
      successCount += batchSuccesses;
      processedCount += Math.min(BATCH_SIZE, cards.length - processedCount);
      console.log(`Progress: ${processedCount}/${cards.length} cards processed, ${successCount} updated`);
    }
    
    console.log(`Card enrichment completed! Updated ${successCount} cards with examples.`);
  } catch (error) {
    console.error('Error in card enrichment process:', error);
  }
}

// Run the enrichment process
enrichCards();