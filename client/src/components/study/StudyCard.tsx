import { useState, useEffect } from "react";
import Flashcard from "../ui/flashcard";

interface StudyCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  cardNumber?: number;
  totalCards?: number;
  isFlipped?: boolean;
  isTransitioning?: boolean;
  onFlip?: () => void;
}

const StudyCard = ({ 
  front, 
  back, 
  cardNumber, 
  totalCards,
  isFlipped,
  isTransitioning,
  onFlip
}: StudyCardProps) => {
  // Local state for flipped if not controlled externally
  const [localFlipped, setLocalFlipped] = useState(false);
  
  // Determine if the card is flipped (controlled or uncontrolled)
  const flipped = isFlipped !== undefined ? isFlipped : localFlipped;
  
  // Handle click to flip the card
  const handleFlip = () => {
    if (isTransitioning) return; // Don't allow flipping during transitions
    
    if (onFlip) {
      // Controlled component
      onFlip();
    } else {
      // Uncontrolled component
      setLocalFlipped(!localFlipped);
    }
  };
  
  // Add transition animation class
  const transitionClass = isTransitioning 
    ? "opacity-70 pointer-events-none" 
    : "opacity-100";
  
  return (
    <Flashcard
      front={front}
      back={back}
      cardNumber={cardNumber}
      totalCards={totalCards}
      autoFlip={flipped}
      onClick={handleFlip}
      className={transitionClass}
    />
  );
};

export default StudyCard;
