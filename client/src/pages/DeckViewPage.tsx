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
            
            // Generate back content that matches the study mode format
            const backContent = (
              <div className="flex flex-col space-y-3">
                <div className="text-4xl font-jp font-medium text-gray-800 mb-3">
                  {card.front}
                </div>
                <div className="font-medium text-gray-800 text-xl mb-2">
                  {card.back}
                </div>
                <div className="text-gray-600 text-sm mb-3">
                  {card.partOfSpeech && card.reading ? 
                    `${card.partOfSpeech}, ${card.reading}` : 
                    card.partOfSpeech || card.reading}
                </div>
                
                {(card.example || card.exampleTranslation) && (
                  <div className="mt-4 border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500">Example</span>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3">
                      {card.example && (
                        <div className="text-gray-800 font-jp text-sm mb-1">
                          {card.example}
                        </div>
                      )}
                      {card.exampleTranslation && (
                        <div className="text-gray-600 italic text-sm">
                          {card.exampleTranslation}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <div 
                key={card.id}
                className="relative group"
              >
                <Flashcard
                  front={card.front}
                  back={backContent}
                  className="hover:ring-2 hover:ring-blue-200 rounded-xl transition-all duration-200"
                />
                
                <div className="absolute top-3 right-3 flex space-x-1">
                  {hasAdditionalDetails && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(card);
                      }}
                    >
                      <span className="sr-only">View Example</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-600">
                        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(card);
                    }}
                  >
                    <span className="sr-only">Edit</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-600">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(card.id);
                    }}
                  >
                    <span className="sr-only">Delete</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-red-500">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </Button>
                </div>
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