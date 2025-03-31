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
const EASY_BONUS = 1.3;
const INTERVAL_MODIFIER = 1;
const HARD_INTERVAL_FACTOR = 0.5;
const AGAIN_INTERVAL = 0.1; // ~0.1 days = ~2.4 hours

const StudyMode = ({ deckId }: StudyModeProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const { data: deck, isLoading: isDeckLoading } = useQuery<Deck>({
    queryKey: [`/api/decks/${deckId}`],
  });

  const { data: dueCards, isLoading: isCardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/study/due`],
    queryFn: async () => {
      const response = await fetch(`/api/study/due?userId=1&deckIds=${deckId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch due cards');
      }
      return response.json();
    }
  });

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
      
      switch (rating) {
        case 'again':
          interval = AGAIN_INTERVAL;
          ease = 200; // Lower ease for "again" responses
          break;
        case 'hard':
          interval = HARD_INTERVAL_FACTOR * INITIAL_INTERVAL;
          ease = 220;
          break;
        case 'good':
          interval = INITIAL_INTERVAL * INTERVAL_MODIFIER;
          ease = 250;
          break;
        case 'easy':
          interval = INITIAL_INTERVAL * EASY_BONUS * INTERVAL_MODIFIER;
          ease = 280; // Higher ease for "easy" responses
          break;
      }
      
      // Calculate next review date
      const now = new Date();
      const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
      
      await apiRequest("POST", "/api/study/progress", {
        cardId,
        userId,
        ease,
        interval,
        nextReview: nextReview.toISOString(),
        reviews: 1,
        lapses: rating === 'again' ? 1 : 0
      });
    },
    onSuccess: () => {
      // Invalidate queries that might be affected by this update
      queryClient.invalidateQueries({ queryKey: [`/api/study/due`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update study progress.",
        variant: "destructive"
      });
    }
  });

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!dueCards || dueCards.length === 0) return;
    
    // Bail early if we've already completed all cards
    if (completed.length >= dueCards.length) {
      toast({
        title: "Study Complete",
        description: "All cards have been reviewed. Return to deck list.",
      });
      return;
    }
    
    const card = dueCards[currentCardIndex];
    
    try {
      await updateProgress.mutateAsync({ cardId: card.id, rating });
      
      // Add to completed list
      const newCompleted = [...completed, card.id];
      setCompleted(newCompleted);
      
      // Check if this was the last card
      const isLastCard = currentCardIndex >= dueCards.length - 1 || newCompleted.length >= dueCards.length;
      
      if (isLastCard) {
        // We're done with all cards - don't increase the index
        toast({
          title: "Study Session Complete",
          description: "You've reviewed all the cards for today!",
        });
      } else {
        setCurrentCardIndex(prev => prev + 1);
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
    switch (rating) {
      case 'again':
        return '< 10 min';
      case 'hard':
        return '1 day';
      case 'good':
        return '3 days';
      case 'easy':
        return '7 days';
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

  if (!dueCards || dueCards.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-4">Study: {deck?.name}</h2>
        <p className="text-gray-600 mb-6">No cards due for review! Check back later or add more cards to your deck.</p>
        <Button onClick={() => navigate('/decks')}>Back to Decks</Button>
      </div>
    );
  }

  // Check if we've completed all cards
  const allCardsCompleted = completed.length === dueCards.length && dueCards.length > 0;
  
  // Only access currentCard if we haven't completed all cards
  // Use ! (non-null assertion) since we've already checked dueCards.length > 0 above
  const currentCard = dueCards[currentCardIndex];
  const progress = (completed.length / dueCards.length) * 100;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Study: {deck?.name}</h2>
          <p className="text-gray-600 text-sm mt-1">Spaced repetition system - focus on cards you need to review</p>
        </div>
        <div className="flex space-x-4">
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
          <p className="text-gray-600 mb-6">You've reviewed all {dueCards.length} cards due for today.</p>
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
                    <div className="font-medium text-gray-800 text-2xl mb-2">{currentCard.back}</div>
                    <div className="text-gray-600 mb-3">{currentCard.partOfSpeech}, {currentCard.reading}</div>
                    {currentCard.example && (
                      <>
                        <div className="text-gray-600 italic">{currentCard.example}</div>
                        <div className="text-gray-600 italic">{currentCard.exampleTranslation}</div>
                      </>
                    )}
                  </>
                }
                cardNumber={currentCardIndex + 1}
                totalCards={dueCards.length}
              />
            )}

            <div className="mt-6 grid grid-cols-4 gap-4">
              <Button 
                className="flex flex-col items-center justify-center bg-red-100 text-red-800 rounded-lg py-3 px-2 hover:bg-red-200 transition" 
                variant="ghost"
                onClick={() => handleRating('again')}
              >
                <span className="text-sm font-medium">Again</span>
                <span className="text-xs text-red-600 mt-1">{getIntervalText('again')}</span>
              </Button>
              <Button 
                className="flex flex-col items-center justify-center bg-amber-100 text-amber-800 rounded-lg py-3 px-2 hover:bg-amber-200 transition" 
                variant="ghost"
                onClick={() => handleRating('hard')}
              >
                <span className="text-sm font-medium">Hard</span>
                <span className="text-xs text-amber-600 mt-1">{getIntervalText('hard')}</span>
              </Button>
              <Button 
                className="flex flex-col items-center justify-center bg-blue-100 text-blue-800 rounded-lg py-3 px-2 hover:bg-blue-200 transition" 
                variant="ghost"
                onClick={() => handleRating('good')}
              >
                <span className="text-sm font-medium">Good</span>
                <span className="text-xs text-blue-600 mt-1">{getIntervalText('good')}</span>
              </Button>
              <Button 
                className="flex flex-col items-center justify-center bg-green-100 text-green-800 rounded-lg py-3 px-2 hover:bg-green-200 transition" 
                variant="ghost"
                onClick={() => handleRating('easy')}
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
                <span>{completed.length}/{dueCards.length}</span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Due Today</div>
                <div className="text-lg font-medium">{dueCards.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Completed</div>
                <div className="text-lg font-medium">{completed.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Learned</div>
                <div className="text-lg font-medium">--</div>
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
