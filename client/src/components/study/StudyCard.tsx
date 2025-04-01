import Flashcard from "../ui/flashcard";

interface StudyCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  cardNumber?: number;
  totalCards?: number;
}

const StudyCard = ({ 
  front, 
  back, 
  cardNumber, 
  totalCards
}: StudyCardProps) => {
  return (
    <Flashcard
      front={front}
      back={back}
      // Do not pass cardNumber and totalCards to avoid showing counter
    />
  );
};

export default StudyCard;
