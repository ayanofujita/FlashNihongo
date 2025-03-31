import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import QuizMode from "@/components/quiz/QuizMode";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface Deck {
  id: number;
  name: string;
}

const QuizPage = () => {
  const { deckId } = useParams();
  
  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });
  
  // If no deck ID is provided, show a deck selection screen
  if (!deckId) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Select a Deck for Quiz</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <>
            {decks && decks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {decks.map((deck) => (
                  <div key={deck.id} className="block bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition">
                    <h3 className="text-lg font-bold mb-2">{deck.name}</h3>
                    <Button 
                      className="mt-2 w-full bg-violet-600 hover:bg-violet-700"
                      asChild
                    >
                      <Link href={`/quiz/${deck.id}`}>
                        Quiz This Deck
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 mb-4">You don't have any decks yet. Create a deck first to start a quiz.</p>
                <Button asChild>
                  <Link href="/decks">Go to Decks</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  
  return <QuizMode deckId={parseInt(deckId)} />;
};

export default QuizPage;
