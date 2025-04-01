import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, X } from "lucide-react";
import StudyCard from "./StudyCard";
import { useLocation } from "wouter";

interface Card {
  id: number;
  front: string;
  back: string;
  reading: string;
  example: string;
  exampleTranslation: string;
  partOfSpeech: string;
}

interface Deck {
  id: number;
  name: string;
}

interface StudyModeProps {
  deckId: number;
}

// SRS algorithm constants
const INITIAL_INTERVAL = 1; // 1 day for initial interval
const EASY_BONUS = 2;
const INTERVAL_MODIFIER = 1;
const HARD_INTERVAL_FACTOR = 0.5;
const AGAIN_INTERVAL = 0.1; // ~0.1 days = ~2.4 hours
const EASE_MODIFIER = 0.15; // How much to adjust ease on each review

const StudyMode = ({ deckId }: StudyModeProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Track the cards that have been completed
  const [completed, setCompleted] = useState<number[]>([]);
  
  // Store cards to study separately from the query result
  const [cardsToStudy, setCardsToStudy] = useState<Card[]>([]);
  
  // Store a list of unique card IDs to calculate accurate metrics
  const [uniqueCardIds, setUniqueCardIds] = useState<Set<number>>(new Set());
  
  // Track the current card being studied (store the full card not just the index)
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  
  // Reset state when deck ID changes
  useEffect(() => {
    setCompleted([]);
    setCardsToStudy([]);
    setCurrentCard(null);
    setUniqueCardIds(new Set());
  }, [deckId]);

  const { data: deck, isLoading: isDeckLoading } = useQuery<Deck>({
    queryKey: [`/api/decks/${deckId}`],
  });

  const { data: dueCards, isLoading: isCardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/study/due`, deckId],
    queryFn: async () => {
      const response = await fetch(`/api/study/due?userId=1&deckIds=${deckId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch due cards');
      }
      return response.json();
    }
  });
  
  // Set up cards to study whenever dueCards changes
  useEffect(() => {
    if (dueCards && dueCards.length > 0) {
      console.log("Setting cards to study:", dueCards.length);
      console.log("Due cards:", dueCards); // Debug log to see all cards
      
      // Update unique card IDs (for accurate due cards count)
      // Use functional update to avoid dependency on uniqueCardIds
      setUniqueCardIds(prevIds => {
        const newUniqueIds = new Set(prevIds);
        let hasChanges = false;
        
        dueCards.forEach(card => {
          if (!prevIds.has(card.id)) {
            newUniqueIds.add(card.id);
            hasChanges = true;
          }
        });
        
        // Only trigger a state update if we added new IDs
        return hasChanges ? newUniqueIds : prevIds;
      });
      
      // Filter out cards that have been already completed in this session
      // to prevent them from showing up again immediately after being reviewed
      const filteredDueCards = dueCards.filter(
        card => !completed.includes(card.id)
      );
      
      // Check if we have new cards that weren't in our study session before
      const newCards = filteredDueCards.filter(
        dueCard => !cardsToStudy.some(existingCard => existingCard.id === dueCard.id)
      );
      
      if (newCards.length > 0) {
        console.log("New cards added to study session:", newCards.length);
        // Add the new cards to our study deck
        setCardsToStudy(currentCards => [...currentCards, ...newCards]);
      } else if (cardsToStudy.length === 0) {
        // First load or reset
        setCardsToStudy(filteredDueCards);
      }
      
      // Only set the current card if we don't already have one
      // This prevents the current card from changing during API refresh
      if (!currentCard && filteredDueCards.length > 0) {
        setCurrentCard(filteredDueCards[0]);
      }
    } else {
      console.log("No cards to study or dueCards is empty");
    }
  }, [dueCards, currentCard, cardsToStudy, completed]);

  const updateProgress = useMutation({
    mutationFn: async ({ 
      cardId, 
      rating 
    }: { 
      cardId: number; 
      rating: 'again' | 'hard' | 'good' | 'easy';
    }) => {
      const userId = 1; // Default user for this example
      
      // Calculate new SRS parameters based on rating
      let interval: number;
      let ease = 250; // Default ease factor
      let reviews = 1;
      let lapses = 0;
      
      // First get existing progress if any to properly increment reviews/lapses
      let existingProgress = null;
      try {
        const response = await fetch(`/api/study/progress?userId=${userId}&cardId=${cardId}`);
        if (response.ok) {
          existingProgress = await response.json();
          reviews = (existingProgress?.reviews || 0) + 1;
          lapses = existingProgress?.lapses || 0;
          
          // Use the existing ease if available
          ease = existingProgress?.ease || ease;
        }
      } catch (error) {
        console.error("Failed to fetch existing progress:", error);
      }
      
      // Base interval calculation on existing progress if available
      let baseInterval = existingProgress?.interval || INITIAL_INTERVAL;
      
      // Adjust ease based on response
      switch (rating) {
        case 'again':
          // For "again" responses, shorten the interval significantly
          interval = AGAIN_INTERVAL;
          ease = Math.max(130, ease - 20); // Minimum ease 130, decrease by 20
          lapses += 1; // Increment lapses for "again" responses
          break;
        case 'hard':
          // For "hard" responses, use a shorter interval and decrease ease
          interval = HARD_INTERVAL_FACTOR * baseInterval;
          ease = Math.max(130, ease - 15); // Decrease ease by 15
          break;
        case 'good':
          // For "good" responses, use the current interval and keep ease stable
          interval = baseInterval;
          // No change to ease
          break;
        case 'easy':
          // For "easy" responses, use a longer interval and increase ease
          interval = baseInterval * EASY_BONUS;
          ease = Math.min(370, ease + 15); // Increase ease by 15, maximum 370
          break;
      }
      
      // For reviews after the first one, calculate interval based on ease
      if (reviews > 1 && rating !== 'again') {
        // Convert ease (percentage) to a multiplier
        const easeMultiplier = ease / 100;
        
        // For subsequent reviews, use the formula: interval = interval * ease
        interval = interval * easeMultiplier * INTERVAL_MODIFIER;
      }
      
      // Calculate next review date based on the interval in days
      // This ensures cards won't show up until their due date
      const now = new Date();
      const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
      
      console.log(`Card ${cardId} next review: ${nextReview.toISOString()}, interval: ${interval} days, ease: ${ease}`);
      
      await apiRequest("POST", "/api/study/progress", {
        cardId,
        userId,
        ease,
        interval,
        nextReview: nextReview.toISOString(),
        reviews,
        lapses
      });
    },
    onSuccess: () => {
      // Invalidate queries that might be affected by this update
      queryClient.invalidateQueries({ queryKey: [`/api/study/due`, deckId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update study progress.",
        variant: "destructive"
      });
    }
  });

  // Function to handle rating and move to the next card
  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    
    // Bail early if we've already completed all cards
    if (completed.length >= uniqueCardIds.size) {
      toast({
        title: "Study Complete",
        description: "All cards have been reviewed. Return to deck list.",
      });
      return;
    }
    
    try {
      // Update the progress in the backend
      await updateProgress.mutateAsync({ cardId: currentCard.id, rating });
      
      // Mark the card as completed regardless of rating
      // We'll respect the calculated interval for all ratings
      setCompleted(prev => [...prev, currentCard.id]);
      
      // Find the next card to study (one that's not in completed)
      const remainingCards = cardsToStudy.filter(card => 
        !completed.includes(card.id) && card.id !== currentCard.id
      );
      
      if (remainingCards.length > 0) {
        // Move to the next card
        setCurrentCard(remainingCards[0]);
      } else {
        // All cards completed
        setCurrentCard(null);
        
        // Display a completion toast
        toast({
          title: "Study Complete",
          description: "All cards have been reviewed. Great job!",
        });
      }
    } catch (error) {
      console.error("Failed to update study progress:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getIntervalText = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const formatInterval = (interval: number) => {
      // Convert to hours
      const hours = Math.round(interval * 24);
      
      // If less than 24 hours, show in hours
      if (hours < 24) {
        return `${hours}h`;
      }
      
      // Otherwise show in days, only round if not a whole number
      const days = Number.isInteger(interval) ? interval : Number(interval.toFixed(1));
      return `${days}d`;
    };
    
    // For the first review, we can show static values
    switch (rating) {
      case 'again':
        return formatInterval(AGAIN_INTERVAL);
      case 'hard':
        return formatInterval(HARD_INTERVAL_FACTOR);
      case 'good':
        return formatInterval(INITIAL_INTERVAL);
      case 'easy':
        return formatInterval(INITIAL_INTERVAL * EASY_BONUS);
    }
  };

  if (isDeckLoading || isCardsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-80 w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (!cardsToStudy || cardsToStudy.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-4">Study: {deck?.name}</h2>
        <p className="text-gray-600 mb-6">No cards due for review! Check back later or add more cards to your deck.</p>
        <Button onClick={() => navigate('/decks')}>Back to Decks</Button>
      </div>
    );
  }

  // Check if we've completed all cards or there's no current card (means we've gone through all cards)
  const allCardsCompleted = (completed.length > 0 && completed.length >= uniqueCardIds.size) || (!currentCard && uniqueCardIds.size > 0 && completed.length > 0);
  
  // Calculate progress
  const progress = uniqueCardIds.size > 0 ? (completed.length / uniqueCardIds.size) * 100 : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Study: {deck?.name}</h2>
          <p className="text-gray-600 text-sm mt-1">Spaced repetition system - focus on cards you need to review</p>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          <Button variant="outline" className="flex items-center">
            <Settings className="mr-1 h-4 w-4" /> Options
          </Button>
          <Button variant="outline" className="flex items-center" onClick={() => navigate('/decks')}>
            <X className="mr-1 h-4 w-4" /> Exit
          </Button>
        </div>
      </div>

      {allCardsCompleted ? (
        // Show completion screen
        <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
          <h3 className="text-xl font-bold mb-4">Study Session Complete!</h3>
          <p className="text-gray-600 mb-6">You've reviewed all {uniqueCardIds.size} cards due for today.</p>
          <Button onClick={() => navigate('/decks')} className="bg-blue-600 hover:bg-blue-700">
            Return to Decks
          </Button>
        </div>
      ) : (
        // Show study interface
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-3/4">
            {currentCard && (
              <StudyCard 
                front={currentCard.front}
                back={
                  <>
                    <div className="text-4xl font-jp font-medium text-gray-800 mb-3">{currentCard.front}</div>
                    <div className="font-medium text-gray-800 text-xl mb-2">{currentCard.back}</div>
                    <div className="text-gray-600 text-sm mb-3">{currentCard.partOfSpeech}, {currentCard.reading}</div>
                    {currentCard.example && (
                      <>
                        <div className="text-gray-600 italic text-sm">{currentCard.example}</div>
                        <div className="text-gray-600 italic text-sm">{currentCard.exampleTranslation}</div>
                      </>
                    )}
                  </>
                }
              />
            )}

            <div className="mt-6 grid grid-cols-4 gap-4">
              <Button 
                className="flex flex-col items-center justify-center bg-red-100 text-red-800 rounded-lg py-3 px-2 hover:bg-red-200 transition" 
                variant="ghost"
                onClick={() => handleRating('again')}
                disabled={!currentCard}
              >
                <span className="text-sm font-medium">Again</span>
                <span className="text-xs text-red-600 mt-1">{getIntervalText('again')}</span>
              </Button>
              <Button 
                className="flex flex-col items-center justify-center bg-amber-100 text-amber-800 rounded-lg py-3 px-2 hover:bg-amber-200 transition" 
                variant="ghost"
                onClick={() => handleRating('hard')}
                disabled={!currentCard}
              >
                <span className="text-sm font-medium">Hard</span>
                <span className="text-xs text-amber-600 mt-1">{getIntervalText('hard')}</span>
              </Button>
              <Button 
                className="flex flex-col items-center justify-center bg-blue-100 text-blue-800 rounded-lg py-3 px-2 hover:bg-blue-200 transition" 
                variant="ghost"
                onClick={() => handleRating('good')}
                disabled={!currentCard}
              >
                <span className="text-sm font-medium">Good</span>
                <span className="text-xs text-blue-600 mt-1">{getIntervalText('good')}</span>
              </Button>
              <Button 
                className="flex flex-col items-center justify-center bg-green-100 text-green-800 rounded-lg py-3 px-2 hover:bg-green-200 transition" 
                variant="ghost"
                onClick={() => handleRating('easy')}
                disabled={!currentCard}
              >
                <span className="text-sm font-medium">Easy</span>
                <span className="text-xs text-green-600 mt-1">{getIntervalText('easy')}</span>
              </Button>
            </div>
          </div>

          <div className="md:w-1/4 bg-white rounded-lg shadow p-5 border border-gray-200 h-fit">
            <h3 className="font-medium text-gray-800 mb-4">Study Progress</h3>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Today's Progress</span>
                <span>{completed.length}/{uniqueCardIds.size}</span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Due Today</div>
                <div className="text-lg font-medium">{uniqueCardIds.size}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Completed</div>
                <div className="text-lg font-medium">{completed.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Remaining</div>
                <div className="text-lg font-medium">{uniqueCardIds.size - completed.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Retention</div>
                <div className="text-lg font-medium">--</div>
              </div>
            </div>
            
            <h4 className="font-medium text-gray-700 text-sm mb-3">Upcoming Reviews</h4>
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tomorrow</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">In 3 days</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">In 7 days</span>
                <span className="font-medium">--</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMode;
