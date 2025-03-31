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
        "w-full h-80 cursor-pointer select-none perspective-1000 preserve-3d",
        className,
        flipped ? "flipped" : ""
      )}
      onClick={handleClick}
    >
      <div className="relative w-full h-full transform-style-preserve-3d transition-transform duration-600">
        {/* Card Front */}
        <div className={`absolute w-full h-full bg-white rounded-xl shadow-lg flex flex-col justify-center items-center p-6 border border-gray-200 ${flipped ? "backface-hidden rotate-y-180" : "backface-hidden"}`}>
          <div className="text-center">
            <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-3">Front</h3>
            <div className="text-4xl font-jp font-medium text-gray-800 mb-3">{front}</div>
            <div className="text-gray-600 italic">What does this mean?</div>
          </div>
          {cardNumber && totalCards && (
            <div className="absolute top-3 right-3 text-gray-400 text-sm">
              Card {cardNumber}/{totalCards}
            </div>
          )}
        </div>
        
        {/* Card Back */}
        <div className={`absolute w-full h-full bg-white rounded-xl shadow-lg flex flex-col justify-center items-center p-6 border border-gray-200 ${flipped ? "backface-hidden" : "backface-hidden rotate-y-180"}`}>
          <div className="text-center">
            <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-3">Back</h3>
            {back}
          </div>
          {cardNumber && totalCards && (
            <div className="absolute top-3 right-3 text-gray-400 text-sm">
              Card {cardNumber}/{totalCards}
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .transition-transform {
          transition: transform 0.6s;
        }
        .duration-600 {
          transition-duration: 600ms;
        }
        .flipped .transform-style-preserve-3d {
          transform: rotateY(180deg);
        }
        .font-jp {
          font-family: 'Noto Sans JP', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default Flashcard;
