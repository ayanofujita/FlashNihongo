import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, X, BookOpen, FileText } from "lucide-react";
import QuizCard from "./QuizCard";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface QuizModeProps {
  deckId: number;
}

// Quiz mode types
type QuizType = "meaning" | "reading";

const QuizMode = ({ deckId }: QuizModeProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [quizCards, setQuizCards] = useState<Card[]>([]);
  const [options, setOptions] = useState<string[][]>([]);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizType, setQuizType] = useState<QuizType>("meaning");
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);

  const { data: deck, isLoading: isDeckLoading } = useQuery<Deck>({
    queryKey: [`/api/decks/${deckId}`],
  });

  const { data: cards, isLoading: isCardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/decks/${deckId}/cards`],
  });

  // Process cards when they load
  useEffect(() => {
    if (cards && cards.length > 0) {
      prepareQuiz(cards, quizType);
    }
  }, [cards, quizType]);

  // Function to prepare the quiz based on the selected mode
  const prepareQuiz = (allCards: Card[], mode: QuizType) => {
    // Filter cards for reading mode - only include cards with readings
    let filteredCards = allCards;
    if (mode === "reading") {
      filteredCards = allCards.filter(card => card.reading && card.reading.trim() !== "");
    }

    // If no cards with readings, show a toast and switch back to meaning mode
    if (mode === "reading" && filteredCards.length === 0) {
      toast({
        title: "No cards with readings",
        description: "This deck doesn't have any cards with readings. Switching to meaning mode.",
        variant: "destructive"
      });
      setQuizType("meaning");
      // Use all cards instead
      filteredCards = allCards;
    }

    // Shuffle and limit to 20 cards max for the quiz
    const shuffled = [...filteredCards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(20, shuffled.length));
    setQuizCards(selected);

    // Generate options for each question (3 incorrect + 1 correct)
    const allOptions = selected.map((card) => {
      // Get the correct answer based on quiz type
      const correctAnswer = mode === "meaning" 
        ? card.back 
        : card.reading;

      // Get 3 random cards different from the current one to use as distractors
      const distractors = filteredCards
        .filter((c: Card) => c.id !== card.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((c: Card) => mode === "meaning" ? c.back : c.reading);

      // Add the correct answer and shuffle
      const allAnswers = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
      return allAnswers;
    });

    setOptions(allOptions);
    
    // Reset quiz state when changing mode
    setCurrentQuestionIndex(0);
    setAnswers({});
    setScore(0);
    setIsQuizFinished(false);
    setSelectedOption(null);
  };

  const handleOptionSelect = (option: string) => {
    if (isQuizFinished) return;

    setSelectedOption(option);
    const currentCard = quizCards[currentQuestionIndex];
    
    // Determine the correct answer based on quiz type
    const correctAnswer = quizType === "meaning" ? currentCard.back : currentCard.reading;

    // Save the selected answer
    setAnswers({
      ...answers,
      [currentQuestionIndex]: option
    });

    // Check if answer is correct
    if (option === correctAnswer) {
      setScore(score + 1);
    }

    // Add a slight delay before moving to next question or finishing
    setTimeout(() => {
      if (currentQuestionIndex < quizCards.length - 1) {
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
      } else {
        // Last question answered, finish quiz
        setIsQuizFinished(true);
        toast({
          title: "Quiz Complete",
          description: `Your score: ${score + (option === correctAnswer ? 1 : 0)}/${quizCards.length}`,
        });
      }
    }, 1000); // 1 second delay to see the result
  };

  if (isDeckLoading || isCardsLoading || !quizCards || quizCards.length === 0) {
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
        <Skeleton className="h-2.5 w-full mb-4" />
        <Skeleton className="h-[300px] w-full rounded-xl mb-6" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    );
  }

  if (cards && cards.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-200 p-8">
        <h2 className="text-xl font-bold mb-4">Quiz: {deck?.name}</h2>
        <p className="text-gray-600 mb-6">This deck doesn't have any cards yet. Add some cards before starting a quiz!</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/decks')}>
            Back to Decks
          </Button>
          <Button onClick={() => navigate('/search')}>
            Add Cards
          </Button>
        </div>
      </div>
    );
  }

  // Check if we have any cards at current index
  if (!quizCards || !quizCards[currentQuestionIndex]) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-4">Quiz Error</h2>
        <p className="text-gray-600 mb-6">There was an error loading quiz content. Please try again.</p>
        <Button onClick={() => navigate('/decks')}>Back to Decks</Button>
      </div>
    );
  }

  const currentCard = quizCards[currentQuestionIndex];
  const currentOptions = options[currentQuestionIndex] || [];
  const progress = ((currentQuestionIndex + 1) / quizCards.length) * 100;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Quiz: {deck?.name}</h2>
          <p className="text-gray-600 text-sm mt-1">
            {isQuizFinished 
              ? "Quiz completed. View your results below." 
              : `Quiz by ${quizType === "meaning" ? "meaning" : "reading"} - test your knowledge!`
            }
          </p>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          {!isQuizFinished && (
            <Button 
              variant="outline" 
              className="flex items-center whitespace-nowrap"
              onClick={() => setShowOptionsDialog(true)}
            >
              <Settings className="mr-1 h-4 w-4" /> Options
            </Button>
          )}
          <Button 
            variant="outline" 
            className="flex items-center whitespace-nowrap" 
            onClick={() => navigate('/decks')}
          >
            <X className="mr-1 h-4 w-4" /> Exit
          </Button>
        </div>
      </div>

      {/* Options Dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quiz Options</DialogTitle>
            <DialogDescription>
              Customize your quiz experience
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quiz Type
            </label>
            <Select 
              value={quizType} 
              onValueChange={(value: QuizType) => {
                // Only show warning if the user has made progress
                if (currentQuestionIndex > 0) {
                  if (window.confirm("Changing quiz mode will reset your current progress. Continue?")) {
                    setQuizType(value);
                  }
                } else {
                  setQuizType(value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select quiz type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="meaning">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>By Meaning (English)</span>
                    </div>
                  </SelectItem>
                  {/* Only show reading mode if at least one card has a reading */}
                  {cards && cards.some(card => card.reading && card.reading.trim() !== "") && (
                    <SelectItem value="reading">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>By Reading (Japanese)</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            {currentQuestionIndex > 0 && (
              <p className="text-amber-600 text-xs mt-2">
                ⚠️ Changing quiz mode will reset your current progress
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowOptionsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Progress value={progress} className="w-full h-2.5 mb-6" />
      <div className="flex justify-between text-sm text-gray-600 mb-6">
        <span>Question {currentQuestionIndex + 1} of {quizCards.length}</span>
        <span>Score: {score}/{isQuizFinished ? quizCards.length : currentQuestionIndex}</span>
      </div>

      <QuizCard
        question={currentCard.front}
        options={currentOptions}
        onSelect={handleOptionSelect}
        selectedOption={selectedOption}
        correctAnswer={quizType === "meaning" ? currentCard.back : currentCard.reading}
        quizType={quizType}
      />

      {/* Navigation buttons removed - quiz now automatically advances */}

      {isQuizFinished && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Quiz Results</h3>
          <p className="text-2xl font-bold text-center mb-6">
            {score}/{quizCards.length} ({Math.round((score / quizCards.length) * 100)}%)
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => {
              // Reset the quiz to start over
              setCurrentQuestionIndex(0);
              setSelectedOption(null);
              setAnswers({});
              setScore(0);
              setIsQuizFinished(false);
            }}>
              Try Again
            </Button>
            <Button onClick={() => navigate('/decks')}>Back to Decks</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizMode;