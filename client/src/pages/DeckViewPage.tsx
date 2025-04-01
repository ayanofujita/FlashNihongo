import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CardForm from "@/components/deck/CardForm";
import Flashcard from "@/components/ui/flashcard";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import CardDetailsModal from "@/components/deck/CardDetailsModal";

interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  reading: string | null;
  partOfSpeech: string | null;
  example: string | null;
  exampleTranslation: string | null;
  createdAt: string;
}

interface Deck {
  id: number;
  name: string;
  description: string | null;
}

const DeckViewPage = () => {
  const params = useParams<{ deckId: string }>();
  const deckId = parseInt(params.deckId);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: deck, isLoading: isLoadingDeck } = useQuery<Deck>({
    queryKey: [`/api/decks/${deckId}`],
    enabled: !isNaN(deckId),
  });

  const { data: cards, isLoading: isLoadingCards } = useQuery<Card[]>({
    queryKey: [`/api/decks/${deckId}/cards`],
    enabled: !isNaN(deckId),
  });

  const handleDeleteClick = (id: number) => {
    setCardToDelete(id);
    setDeleteDialogOpen(true);
    setDetailsModalOpen(false);
  };

  const handleEditClick = (card: Card) => {
    setCardToEdit(card);
    setEditDialogOpen(true);
    setDetailsModalOpen(false);
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setDetailsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;

    try {
      await apiRequest("DELETE", `/api/cards/${cardToDelete}`);
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
      queryClient.invalidateQueries({ queryKey: ["/api/cardCounts"] });
      
      toast({
        title: "Card deleted",
        description: "The card has been removed from this deck.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCardToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (isNaN(deckId)) {
    navigate("/decks");
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/decks")} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Decks
          </Button>
          <h2 className="text-xl font-bold">
            {isLoadingDeck ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              deck?.name || "Deck not found"
            )}
          </h2>
        </div>
        
        {/* Add card button */}
        <Button 
          onClick={() => {
            setCardToEdit(null);
            setEditDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Card
        </Button>
      </div>

      {isLoadingCards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : cards && cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            // Check if card has additional details to show
            const hasAdditionalDetails = card.example || card.exampleTranslation;
            
            // Generate simplified back content
            const backContent = (
              <div className="flex flex-col space-y-3">
                <div className="text-xl font-medium">{card.back}</div>
                
                {card.reading && (
                  <div className="text-base text-gray-600">
                    {card.reading}
                  </div>
                )}
                
                {card.partOfSpeech && (
                  <div className="text-sm text-gray-500">
                    {card.partOfSpeech}
                  </div>
                )}
                
                <div className="flex justify-end mt-2 gap-2">
                  {hasAdditionalDetails && (
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(card);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Example
                    </button>
                  )}
                  
                  <button 
                    className="text-gray-600 hover:text-blue-600 text-sm flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(card);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  
                  <button 
                    className="text-gray-600 hover:text-red-600 text-sm flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(card.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            );

            return (
              <div 
                key={card.id}
                className="relative"
                onClick={() => hasAdditionalDetails ? handleCardClick(card) : null}
              >
                <Flashcard
                  front={card.front}
                  back={backContent}
                  className="hover:ring-2 hover:ring-blue-200 transition-all duration-200"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">This deck doesn't have any cards yet.</p>
          <Button 
            onClick={() => {
              setCardToEdit(null);
              setEditDialogOpen(true);
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Add Card
          </Button>
        </div>
      )}

      {/* Card details modal */}
      <CardDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        card={selectedCard}
        onEdit={() => selectedCard && handleEditClick(selectedCard)}
        onDelete={() => selectedCard && handleDeleteClick(selectedCard.id)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit card dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogTitle>
            {cardToEdit ? "Edit Card" : "Add New Card"}
          </DialogTitle>
          <CardForm 
            deckId={deckId}
            cardId={cardToEdit?.id}
            defaultValues={cardToEdit ? {
              front: cardToEdit.front,
              back: cardToEdit.back,
              reading: cardToEdit.reading || undefined,
              partOfSpeech: cardToEdit.partOfSpeech || undefined,
              example: cardToEdit.example || undefined,
              exampleTranslation: cardToEdit.exampleTranslation || undefined,
            } : undefined}
            onSuccess={() => {
              setEditDialogOpen(false);
              setCardToEdit(null);
              queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
              toast({
                title: cardToEdit ? "Card updated" : "Card added",
                description: cardToEdit 
                  ? "The card has been updated successfully." 
                  : "The card has been added to the deck.",
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeckViewPage;