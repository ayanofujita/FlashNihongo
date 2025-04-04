import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  onClick?: () => void;
  autoFlip?: boolean;
  cardNumber?: number;
  totalCards?: number;
  resetToFront?: boolean;
}

const Flashcard = ({ 
  front, 
  back, 
  className, 
  onClick, 
  autoFlip = false,
  cardNumber,
  totalCards,
  resetToFront = false
}: FlashcardProps) => {
  const [flipped, setFlipped] = useState(autoFlip);
  const [cardHeight, setCardHeight] = useState<number>(400); // Fixed height for all cards
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Using a fixed height for all cards to ensure consistency
  // This is intentionally commented out as we're using a fixed height
  /*
  useEffect(() => {
    const updateCardHeight = () => {
      if (frontCardRef.current && backCardRef.current) {
        const frontHeight = frontCardRef.current.scrollHeight;
        const backHeight = backCardRef.current.scrollHeight;
        const maxHeight = Math.max(frontHeight, backHeight, 320);
        setCardHeight(maxHeight);
      }
    };

    updateCardHeight();
    const timer = setTimeout(updateCardHeight, 100);
    
    return () => clearTimeout(timer);
  }, [front, back]);
  */

  // Reset to front side when a card changes
  useEffect(() => {
    if (resetToFront) {
      setFlipped(false);
    }
  }, [front, resetToFront]);

  const handleClick = () => {
    setFlipped(!flipped);
    if (onClick) onClick();
  };

  return (
    <div 
      className={cn(
        "w-full cursor-pointer select-none",
        className
      )}
      onClick={handleClick}
      style={{ height: `${cardHeight}px` }}
    >
      <div 
        className={`relative transition-all duration-500 ${flipped ? "rotate-y-180" : ""}`} 
        style={{ 
          transformStyle: "preserve-3d",
          height: `${cardHeight}px`
        }}
      >
        {/* Card Front */}
        <div 
          ref={frontCardRef}
          className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-lg flex flex-col justify-center items-center p-8 border border-gray-200 overflow-auto"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-center w-full">
            <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-4">Front</h3>
            <div className="text-3xl sm:text-4xl font-jp font-medium text-gray-800 mb-6 break-words overflow-hidden">{front}</div>
            <div className="text-gray-600 italic mt-4">Click to flip</div>
          </div>
        </div>
        
        {/* Card Back */}
        <div 
          ref={backCardRef}
          className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-lg flex flex-col justify-center items-center p-8 border border-gray-200 rotate-y-180 overflow-auto" 
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-center w-full">
            <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-4">Back</h3>
            <div className="text-2xl sm:text-3xl font-medium text-gray-800 mb-6 break-words overflow-hidden">{back}</div>
            <div className="text-gray-600 italic mt-4">Click to flip</div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        `
      }} />
    </div>
  );
};

export default Flashcard;
