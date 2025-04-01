import { useState } from "react";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  onClick?: () => void;
  autoFlip?: boolean;
  cardNumber?: number;
  totalCards?: number;
}

const Flashcard = ({ 
  front, 
  back, 
  className, 
  onClick, 
  autoFlip = false,
  cardNumber,
  totalCards
}: FlashcardProps) => {
  const [flipped, setFlipped] = useState(autoFlip);

  const handleClick = () => {
    setFlipped(!flipped);
    if (onClick) onClick();
  };

  return (
    <div 
      className={cn(
        "w-full h-auto min-h-80 cursor-pointer select-none",
        className
      )}
      onClick={handleClick}
    >
      <div className={`relative transition-all duration-500 min-h-80 ${flipped ? "rotate-y-180" : ""}`} style={{ transformStyle: "preserve-3d" }}>
        {/* Card Front */}
        <div className={`w-full bg-white rounded-xl shadow-lg flex flex-col justify-center items-center p-8 border border-gray-200 overflow-auto`} style={{ backfaceVisibility: "hidden" }}>
          <div className="text-center w-full">
            <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-4">Front</h3>
            <div className="text-3xl sm:text-4xl font-medium text-gray-800 mb-6 break-words overflow-hidden">{front}</div>
            <div className="text-gray-600 italic mt-4">Click to flip</div>
          </div>
          {cardNumber && totalCards && (
            <div className="absolute bottom-3 right-4 text-xs text-gray-400">
              {cardNumber} / {totalCards}
            </div>
          )}
        </div>
        
        {/* Card Back */}
        <div className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-lg flex flex-col justify-center items-center p-8 border border-gray-200 rotate-y-180 overflow-auto" style={{ backfaceVisibility: "hidden" }}>
          <div className="text-center w-full">
            <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-4">Back</h3>
            <div className="break-words overflow-hidden">{back}</div>
          </div>
          {cardNumber && totalCards && (
            <div className="absolute bottom-3 right-4 text-xs text-gray-400">
              {cardNumber} / {totalCards}
            </div>
          )}
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
