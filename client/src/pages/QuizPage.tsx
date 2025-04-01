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
  
  // Query all decks and their cards
  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });
  
  // For each deck, get the cards to check if they have any
  const { data: deckCardCounts, isLoading: isCardCountLoading } = useQuery({
    queryKey: ["/api/decks/cards/count"],
    queryFn: async () => {
      if (!decks) return {};
      
      const counts: Record<number, number> = {};
      
      await Promise.all(decks.map(async (deck) => {
        const response = await fetch(`/api/decks/${deck.id}/cards`);
        const cards = await response.json();
        counts[deck.id] = cards.length;
      }));
      
      return counts;
    },
    enabled: !!decks && decks.length > 0,
  });
  
  // If no deck ID is provided, show a deck selection screen
  if (!deckId) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Select a Deck for Quiz</h2>
        
        {isLoading || isCardCountLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Filter decks to only show those with cards */}
            {decks && decks.length > 0 && deckCardCounts ? (
              <>
                {/* Get decks with cards */}
                {decks.filter(deck => (deckCardCounts[deck.id] || 0) > 0).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {decks
                      .filter(deck => (deckCardCounts[deck.id] || 0) > 0)
                      .map((deck) => (
                        <div key={deck.id} className="block bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition">
                          <h3 className="text-lg font-bold mb-2">{deck.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {deckCardCounts[deck.id]} {deckCardCounts[deck.id] === 1 ? 'card' : 'cards'} available
                          </p>
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
                  <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-200 p-8">
                    <h3 className="text-xl font-semibold mb-3">No Decks Available for Quiz</h3>
                    <p className="text-gray-600 mb-6">You don't have any decks with cards yet. Add cards to your decks first.</p>
                    <div className="flex justify-center gap-4">
                      <Button asChild variant="outline">
                        <Link href="/decks">Manage Decks</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/search">Add Cards</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold mb-3">No Decks Available</h3>
                <p className="text-gray-600 mb-6">You don't have any decks yet. Create a deck first to start a quiz.</p>
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
