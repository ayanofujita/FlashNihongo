import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings, X, Shuffle, ArrowDownUp } from "lucide-react";
import StudyCard from "./StudyCard";
import { useLocation } from "wouter";
import { useUser } from "@/components/auth/UserContext";
import CardDetailsModal from "@/components/deck/CardDetailsModal";

interface Card {
  id: number;
  front: string;
  back: string;
  reading: string;
  example: string;
  exampleTranslation: string;
  partOfSpeech: string;
  // Study progress properties that might be included when fetching cards due for study
  interval?: string | number;
  ease?: number;
  reviews?: number;
  lapses?: number;
  nextReview?: string;
  lastReviewed?: string;
}

interface Deck {
  id: number;
  name: string;
}

interface StudyModeProps {
  deckId: number;
}

// SRS algorithm constants
const SRS = {
  // Intervals and factors
  INTERVAL: {
    AGAIN: 0.1, // ~2.4 hours
    HARD: 0.5, // ~12 hours
    GOOD: 1, // 1 day
    EASY: 2, // 2 days
  },

  // Ease adjustment values
  EASE: {
    DEFAULT: 250, // Default ease factor (250%)
    MIN: 130, // Minimum ease factor (130%)
    MAX: 370, // Maximum ease factor (370%)
    AGAIN_STEP: 20, // Ease reduction for Again
    HARD_STEP: 15, // Ease reduction for Hard
    EASY_STEP: 15, // Ease increase for Easy
  },
};

const StudyMode = ({ deckId }: StudyModeProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useUser(); // Get the current authenticated user

  // Track the cards that have been completed
  const [completed, setCompleted] = useState<number[]>([]);

  // Store cards to study separately from the query result
  const [cardsToStudy, setCardsToStudy] = useState<Card[]>([]);

  // Store a list of unique card IDs to calculate accurate metrics
  const [uniqueCardIds, setUniqueCardIds] = useState<Set<number>>(new Set());

  // Track the current card being studied (store the full card not just the index)
  const [currentCard, setCurrentCard] = useState<Card | null>(null);

  // Settings state
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [intervalModifier, setIntervalModifier] = useState<number>(1);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [cardDetailsOpen, setCardDetailsOpen] = useState<boolean>(false);

  // Reset state when deck ID changes
  useEffect(() => {
    setCompleted([]);
    setCardsToStudy([]);
    setCurrentCard(null);
    setUniqueCardIds(new Set());
    setCardDetailsOpen(false);
  }, [deckId]);

  const { data: deck, isLoading: isDeckLoading } = useQuery<Deck>({
    queryKey: [`/api/decks/${deckId}`],
  });

  const { data: dueCards, isLoading: isCardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/study/due`, deckId],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(
        `/api/study/due?userId=${user.id}&deckIds=${deckId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch due cards");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Set up cards to study whenever dueCards changes
  useEffect(() => {
    if (dueCards && dueCards.length > 0) {
      console.log("Setting cards to study:", dueCards.length);
      console.log("Due cards:", dueCards); // Debug log to see all cards

      // Update unique card IDs (for accurate due cards count)
      // Use functional update to avoid dependency on uniqueCardIds
      setUniqueCardIds((prevIds) => {
        const newUniqueIds = new Set(prevIds);
        let hasChanges = false;

        dueCards.forEach((card) => {
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
        (card) => !completed.includes(card.id),
      );

      // Check if we have new cards that weren't in our study session before
      const newCards = filteredDueCards.filter(
        (dueCard) =>
          !cardsToStudy.some((existingCard) => existingCard.id === dueCard.id),
      );

      if (newCards.length > 0) {
        console.log("New cards added to study session:", newCards.length);
        // Add the new cards to our study deck
        setCardsToStudy((currentCards) => [...currentCards, ...newCards]);
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

  // Mutation to update user streak
  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      await apiRequest("POST", `/api/user-stats/update-streak/${user.id}`);
    },
    onSuccess: () => {
      if (user) {
        // Invalidate user stats queries
        queryClient.invalidateQueries({
          queryKey: [`/api/user-stats/${user.id}`],
        });
      }
    },
    onError: (error) => {
      console.error("Failed to update streak:", error);
    },
  });

  // Mutation to increment review stats
  const incrementReviewStatsMutation = useMutation({
    mutationFn: async (correct: boolean) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      await apiRequest("POST", `/api/user-stats/increment-review/${user.id}`, {
        correct,
      });
    },
    onSuccess: () => {
      if (user) {
        // Invalidate user stats queries
        queryClient.invalidateQueries({
          queryKey: [`/api/user-stats/${user.id}`],
        });
      }
    },
    onError: (error) => {
      console.error("Failed to increment review stats:", error);
    },
  });

  // Helper function to parse an interval (could be string or number)
  const parseInterval = (interval: string | number | undefined): number => {
    if (interval === undefined) return SRS.INTERVAL.GOOD; // Default to 1 day

    if (typeof interval === "string") {
      // Convert to number and handle potential NaN situations
      const parsed = parseFloat(interval);
      return isNaN(parsed) ? SRS.INTERVAL.GOOD : parsed;
    }

    return interval;
  };

  // Helper function to calculate new interval based on progress and rating
  const calculateInterval = (
    rating: "again" | "hard" | "good" | "easy",
    existingProgress: any,
    modifier: number = 1,
  ): number => {
    const isFirstReview =
      !existingProgress ||
      !existingProgress.reviews ||
      existingProgress.reviews <= 0;
    const ease = existingProgress?.ease || SRS.EASE.DEFAULT;
    const easeMultiplier = ease / 100;

    let interval: number;
    const baseInterval = parseInterval(existingProgress?.interval);

    // For first reviews of new cards
    if (isFirstReview) {
      switch (rating) {
        case "again":
          interval = SRS.INTERVAL.AGAIN;
          break;
        case "hard":
          interval = SRS.INTERVAL.HARD;
          break;
        case "good":
          interval = SRS.INTERVAL.GOOD;
          break;
        case "easy":
          interval = SRS.INTERVAL.EASY;
          break;
      }
    }
    // Subsequent reviews - apply SRS formula with ease factor
    else {
      switch (rating) {
        case "again":
          interval = baseInterval * SRS.INTERVAL.AGAIN * easeMultiplier;
          break;
        case "hard":
          // For "hard" responses, multiply current interval by hard factor
          interval = baseInterval * SRS.INTERVAL.HARD * easeMultiplier;
          break;
        case "good":
          // For "good" responses, apply ease factor to current interval
          interval = baseInterval * easeMultiplier;
          break;
        case "easy":
          // For "easy" responses, apply ease factor and easy bonus
          interval = baseInterval * SRS.INTERVAL.EASY * easeMultiplier;
          break;
      }
    }

    // Apply user's interval modifier
    return interval * modifier;
  };

  // Helper function to adjust ease based on rating
  const calculateEase = (
    rating: "again" | "hard" | "good" | "easy",
    currentEase: number = SRS.EASE.DEFAULT,
  ): number => {
    switch (rating) {
      case "again":
        // Decrease ease more for again responses
        return Math.max(SRS.EASE.MIN, currentEase - SRS.EASE.AGAIN_STEP);
      case "hard":
        // Decrease ease for hard responses
        return Math.max(SRS.EASE.MIN, currentEase - SRS.EASE.HARD_STEP);
      case "good":
        // No change for good responses
        return currentEase;
      case "easy":
        // Increase ease for easy responses
        return Math.min(SRS.EASE.MAX, currentEase + SRS.EASE.EASY_STEP);
    }
  };

  // Mutation to update study progress
  const updateProgress = useMutation({
    mutationFn: async ({
      cardId,
      rating,
    }: {
      cardId: number;
      rating: "again" | "hard" | "good" | "easy";
    }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const userId = user.id;

      console.log(
        "UPDATING PROGRESS - Card ID:",
        cardId,
        "User ID:",
        userId,
        "Rating:",
        rating,
      );

      // First get existing progress if any to properly increment reviews/lapses
      let existingProgress = null;
      try {
        const response = await fetch(
          `/api/study/progress?userId=${userId}&cardId=${cardId}`,
        );
        if (response.ok) {
          existingProgress = await response.json();
          console.log(
            "EXISTING PROGRESS:",
            JSON.stringify(existingProgress, null, 2),
          );
        }
      } catch (error) {
        console.error("Failed to fetch existing progress:", error);
      }

      // Calculate new values using our helper functions
      const reviews = (existingProgress?.reviews || 0) + 1;
      let lapses = existingProgress?.lapses || 0;

      // Increment lapses counter for "again" responses
      if (rating === "again") {
        lapses += 1;
      }

      // Calculate the new ease factor
      const ease = calculateEase(rating, existingProgress?.ease);

      // Calculate the new interval
      const interval = calculateInterval(
        rating,
        existingProgress,
        intervalModifier,
      );

      // Calculate next review date based on the interval in days
      const now = new Date();
      const nextReview = new Date(
        now.getTime() + interval * 24 * 60 * 60 * 1000,
      );

      console.log(
        `Card ${cardId} next review: ${nextReview.toISOString()}, interval: ${interval} days, ease: ${ease}`,
      );

      await apiRequest("POST", "/api/study/progress", {
        cardId,
        userId,
        ease,
        interval,
        nextReview: nextReview.toISOString(),
        reviews,
        lapses,
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
        variant: "destructive",
      });
    },
  });

  // Function to shuffle cards
  const handleShuffleCards = () => {
    if (!cardsToStudy.length) return;

    // Create a copy and only shuffle cards that haven't been completed yet
    const remainingCards = cardsToStudy.filter(
      (card) => !completed.includes(card.id),
    );

    // Shuffle the array using Fisher-Yates algorithm
    for (let i = remainingCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingCards[i], remainingCards[j]] = [
        remainingCards[j],
        remainingCards[i],
      ];
    }

    // Update state with shuffled cards
    const newCardsToStudy = [
      ...cardsToStudy.filter((card) => completed.includes(card.id)),
      ...remainingCards,
    ];

    setCardsToStudy(newCardsToStudy);

    // Update current card if we have remaining cards
    if (remainingCards.length > 0 && !currentCard) {
      setCurrentCard(remainingCards[0]);
    } else if (remainingCards.length > 0) {
      // Update to the first card in the shuffled deck
      setCurrentCard(remainingCards[0]);
    }

    setIsShuffled(true);

    toast({
      title: "Cards Shuffled",
      description: "Your cards have been randomly shuffled.",
    });
  };

  // Function to unshuffle cards (restore original order)
  const handleUnshuffleCards = () => {
    if (!dueCards || !cardsToStudy.length) return;

    // Restore original order from dueCards
    const filteredDueCards = dueCards.filter(
      (card) => !completed.includes(card.id),
    );

    // We need to keep completed cards in our study deck
    const newCardsToStudy = [
      ...cardsToStudy.filter((card) => completed.includes(card.id)),
      ...filteredDueCards,
    ];

    setCardsToStudy(newCardsToStudy);

    // Update current card if we have remaining cards
    if (filteredDueCards.length > 0 && !currentCard) {
      setCurrentCard(filteredDueCards[0]);
    } else if (filteredDueCards.length > 0) {
      // Update to the first card in the ordered deck
      setCurrentCard(filteredDueCards[0]);
    }

    setIsShuffled(false);

    toast({
      title: "Cards Unshuffled",
      description: "Your cards have been restored to their original order.",
    });
  };

  // Function to handle rating and move to the next card
  const handleRating = async (rating: "again" | "hard" | "good" | "easy") => {
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

      // Update user stats based on rating
      if (rating === "again") {
        // Incorrect answer
        incrementReviewStatsMutation.mutate(false);
      } else {
        // Correct answer
        incrementReviewStatsMutation.mutate(true);
      }

      // Update streak since user has studied today
      if (completed.length === 0) {
        // Only update streak once per study session (when completing first card)
        updateStreakMutation.mutate();
      }

      // Mark the card as completed regardless of rating
      // We'll respect the calculated interval for all ratings
      setCompleted((prev) => [...prev, currentCard.id]);

      // Find the next card to study (one that's not in completed)
      const remainingCards = cardsToStudy.filter(
        (card) => !completed.includes(card.id) && card.id !== currentCard.id,
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
        variant: "destructive",
      });
    }
  };

  // Helper function to format an interval for display
  const formatInterval = (interval: number): string => {
    // Apply the interval modifier to show accurate predictions
    const adjustedInterval = interval * intervalModifier;

    // Convert to hours
    const hours = Math.round(adjustedInterval * 24);

    // If less than 24 hours, show in hours
    if (hours < 24) {
      return `${hours}h`;
    }

    // Otherwise show in days, only round if not a whole number
    const days = Number.isInteger(adjustedInterval)
      ? adjustedInterval
      : Number(adjustedInterval.toFixed(1));
    return `${days}d`;
  };

  // Function to display the interval for a rating button
  const getIntervalText = (
    rating: "again" | "hard" | "good" | "easy",
  ): string => {
    // Get the current card's existing progress if any
    const existingProgress = currentCard
      ? dueCards?.find((c) => c.id === currentCard.id)
      : null;

    // Calculate the interval using our helper function and format it
    const interval = calculateInterval(
      rating,
      existingProgress,
      intervalModifier,
    );
    return formatInterval(interval);
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
        <p className="text-gray-600 mb-6">
          No cards due for review! Check back later or add more cards to your
          deck.
        </p>
        <Button onClick={() => navigate("/decks")}>Back to Decks</Button>
      </div>
    );
  }

  // Check if we've completed all cards or there's no current card (means we've gone through all cards)
  const allCardsCompleted =
    (completed.length > 0 && completed.length >= uniqueCardIds.size) ||
    (!currentCard && uniqueCardIds.size > 0 && completed.length > 0);

  // Calculate progress
  const progress =
    uniqueCardIds.size > 0 ? (completed.length / uniqueCardIds.size) * 100 : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Study: {deck?.name}</h2>
          <p className="text-gray-600 text-sm mt-1">
            Spaced repetition system - focus on cards you need to review
          </p>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Settings className="mr-1 h-4 w-4" /> Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Study Settings</DialogTitle>
                <DialogDescription>
                  Customize your study session preferences.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="intervalModifier"
                    className="text-sm font-medium flex justify-between"
                  >
                    <span>
                      Interval Modifier: {intervalModifier.toFixed(1)}x
                    </span>
                    <span className="text-xs text-gray-500">
                      (Affects spacing between reviews)
                    </span>
                  </Label>
                  <Slider
                    id="intervalModifier"
                    value={[intervalModifier]}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    onValueChange={(value) => setIntervalModifier(value[0])}
                    className="my-4"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Shorter</span>
                    <span>Default</span>
                    <span>Longer</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                    <p className="mb-1">
                      <strong>How this works:</strong>
                    </p>
                    <p>• Lower values (0.5x): Cards appear more frequently</p>
                    <p>• Default (1.0x): Standard spacing</p>
                    <p>
                      • Higher values (2.0x): Longer intervals between reviews
                    </p>
                    <p className="mt-1">
                      This setting affects all cards, including those you've
                      previously studied.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center space-x-3 pt-2">
                  <Button
                    variant={isShuffled ? "outline" : "secondary"}
                    className="flex items-center"
                    onClick={handleUnshuffleCards}
                    disabled={!isShuffled}
                  >
                    <ArrowDownUp className="mr-1 h-4 w-4" /> Sequential
                  </Button>
                  <Button
                    variant={isShuffled ? "secondary" : "outline"}
                    className="flex items-center"
                    onClick={handleShuffleCards}
                    disabled={isShuffled}
                  >
                    <Shuffle className="mr-1 h-4 w-4" /> Shuffle
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setSettingsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => navigate("/decks")}
          >
            <X className="mr-1 h-4 w-4" /> Exit
          </Button>
        </div>
      </div>

      {allCardsCompleted ? (
        // Show completion screen
        <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
          <h3 className="text-xl font-bold mb-4">Study Session Complete!</h3>
          <p className="text-gray-600 mb-6">
            You've reviewed all {uniqueCardIds.size} cards due for today.
          </p>
          <Button
            onClick={() => navigate("/decks")}
            className="bg-blue-600 hover:bg-blue-700"
          >
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
                    <div className="text-4xl font-jp font-medium text-gray-800 mb-3">
                      {currentCard.front}
                    </div>
                    <div className="font-medium text-gray-800 text-xl mb-2">
                      {currentCard.back}
                    </div>
                    <div className="text-gray-600 text-sm mb-3">
                      {currentCard.partOfSpeech}, {currentCard.reading}
                    </div>
                    {(currentCard.example || currentCard.exampleTranslation) && (
                      <div className="mt-4 border-t pt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white"
                          onClick={() => setCardDetailsOpen(true)}
                        >
                          <span className="sr-only">View Example</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-600">
                            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Button>
                      </div>
                    )}
                  </>
                }
              />
            )}

            <div className="mt-6 grid grid-cols-4 gap-4">
              <Button
                className="flex flex-col items-center justify-center bg-red-100 text-red-800 rounded-lg py-3 px-2 hover:bg-red-200 transition"
                variant="ghost"
                onClick={() => handleRating("again")}
                disabled={!currentCard}
              >
                <span className="text-sm font-medium">Again</span>
                <span className="text-xs text-red-600 mt-1">
                  {getIntervalText("again")}
                </span>
              </Button>
              <Button
                className="flex flex-col items-center justify-center bg-amber-100 text-amber-800 rounded-lg py-3 px-2 hover:bg-amber-200 transition"
                variant="ghost"
                onClick={() => handleRating("hard")}
                disabled={!currentCard}
              >
                <span className="text-sm font-medium">Hard</span>
                <span className="text-xs text-amber-600 mt-1">
                  {getIntervalText("hard")}
                </span>
              </Button>
              <Button
                className="flex flex-col items-center justify-center bg-blue-100 text-blue-800 rounded-lg py-3 px-2 hover:bg-blue-200 transition"
                variant="ghost"
                onClick={() => handleRating("good")}
                disabled={!currentCard}
              >
                <span className="text-sm font-medium">Good</span>
                <span className="text-xs text-blue-600 mt-1">
                  {getIntervalText("good")}
                </span>
              </Button>
              <Button
                className="flex flex-col items-center justify-center bg-green-100 text-green-800 rounded-lg py-3 px-2 hover:bg-green-200 transition"
                variant="ghost"
                onClick={() => handleRating("easy")}
                disabled={!currentCard}
              >
                <span className="text-sm font-medium">Easy</span>
                <span className="text-xs text-green-600 mt-1">
                  {getIntervalText("easy")}
                </span>
              </Button>
            </div>
          </div>

          <div className="md:w-1/4 bg-white rounded-lg shadow p-5 border border-gray-200 h-fit">
            <h3 className="font-medium text-gray-800 mb-4">Study Progress</h3>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Today's Progress</span>
                <span>
                  {completed.length}/{uniqueCardIds.size}
                </span>
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
                <div className="text-lg font-medium">
                  {uniqueCardIds.size - completed.length}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Retention</div>
                <div className="text-lg font-medium">--</div>
              </div>
            </div>

            <h4 className="font-medium text-gray-700 text-sm mb-3">
              Upcoming Reviews
            </h4>
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

      {/* Card Details Modal */}
      <CardDetailsModal
        isOpen={cardDetailsOpen}
        onClose={() => setCardDetailsOpen(false)}
        card={currentCard ? {
          id: currentCard.id,
          front: currentCard.front,
          back: currentCard.back,
          reading: currentCard.reading,
          partOfSpeech: currentCard.partOfSpeech,
          example: currentCard.example,
          exampleTranslation: currentCard.exampleTranslation
        } : null}
        onEdit={() => {}} // Not editing from study mode
        onDelete={() => {}} // Not deleting from study mode
      />
    </div>
  );
};

export default StudyMode;
