import Flashcard from "../ui/flashcard";

interface StudyCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  cardNumber?: number;
  totalCards?: number;
}

const StudyCard = ({ front, back, cardNumber, totalCards }: StudyCardProps) => {
  return (
    <Flashcard
      front={front}
      back={back}
      cardNumber={cardNumber}
      totalCards={totalCards}
    />
  );
};

export default StudyCard;
