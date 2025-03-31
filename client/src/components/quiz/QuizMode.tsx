import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, X, ArrowLeft, ArrowRight } from "lucide-react";
import QuizCard from "./QuizCard";
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

interface QuizModeProps {
  deckId: number;
}

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

  const { data: deck, isLoading: isDeckLoading } = useQuery<Deck>({
    queryKey: [`/api/decks/${deckId}`],
  });

  const { data: cards, isLoading: isCardsLoading } = useQuery<Card[]>({
    queryKey: [`/api/decks/${deckId}/cards`],
    onSuccess: (fetchedCards) => {
      if (fetchedCards.length > 0) {
        // Shuffle and limit to 20 cards max for the quiz
        const shuffled = [...fetchedCards].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(20, shuffled.length));
        setQuizCards(selected);
        
        // Generate options for each question (3 incorrect + 1 correct)
        const allOptions = selected.map((card) => {
          // Get 3 random cards different from the current one to use as distractors
          const distractors = fetchedCards
            .filter(c => c.id !== card.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(c => c.back);
          
          // Add the correct answer and shuffle
          const allAnswers = [...distractors, card.back].sort(() => 0.5 - Math.random());
          return allAnswers;
        });
        
        setOptions(allOptions);
      }
    }
  });

  const handleOptionSelect = (option: string) => {
    if (isQuizFinished) return;
    
    setSelectedOption(option);
    const currentCard = quizCards[currentQuestionIndex];
    
    // Save the selected answer
    setAnswers({
      ...answers,
      [currentQuestionIndex]: option
    });
    
    // Check if answer is correct
    if (option === currentCard.back) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizCards.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      setIsQuizFinished(true);
      toast({
        title: "Quiz Complete",
        description: `Your score: ${score}/${quizCards.length}`,
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(answers[currentQuestionIndex - 1] || null);
    }
  };

  if (isDeckLoading || isCardsLoading || quizCards.length === 0) {
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
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-4">Quiz: {deck?.name}</h2>
        <p className="text-gray-600 mb-6">No cards in this deck. Add some cards before starting a quiz!</p>
        <Button onClick={() => navigate('/decks')}>Back to Decks</Button>
      </div>
    );
  }

  const currentCard = quizCards[currentQuestionIndex];
  const currentOptions = options[currentQuestionIndex] || [];
  const progress = ((currentQuestionIndex + 1) / quizCards.length) * 100;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Quiz: {deck?.name}</h2>
          <p className="text-gray-600 text-sm mt-1">Test your knowledge with a randomized quiz</p>
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

      <Progress value={progress} className="w-full h-2.5 mb-6" />
      <div className="flex justify-between text-sm text-gray-600 mb-6">
        <span>Question {currentQuestionIndex + 1} of {quizCards.length}</span>
        <span>Score: {score}/{currentQuestionIndex}</span>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
        <h3 className="text-lg text-gray-600 mb-4">What is the meaning of:</h3>
        <div className="text-5xl font-jp font-medium text-center mb-6">{currentCard.front}</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {currentOptions.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={`flex justify-start h-auto py-3 px-4 text-left ${
                selectedOption === option 
                  ? selectedOption === currentCard.back
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : ""
              }`}
              onClick={() => handleOptionSelect(option)}
              disabled={selectedOption !== null}
            >
              <span className="font-medium mr-2">{['A', 'B', 'C', 'D'][index]}.</span> {option}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button 
          className="bg-violet-600 hover:bg-violet-700 flex items-center"
          onClick={handleNext}
          disabled={!selectedOption && !isQuizFinished}
        >
          {currentQuestionIndex < quizCards.length - 1 ? "Next" : "Finish"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      {isQuizFinished && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Quiz Results</h3>
          <p className="text-2xl font-bold text-center mb-6">
            {score}/{quizCards.length} ({Math.round((score / quizCards.length) * 100)}%)
          </p>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/decks')}>Back to Decks</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizMode;
