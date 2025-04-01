import Flashcard from "../ui/flashcard";

interface StudyCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  resetToFront?: boolean;
}

const StudyCard = ({ 
  front, 
  back,
  resetToFront = true,
}: StudyCardProps) => {
  return (
    <Flashcard
      front={front}
      back={back}
      resetToFront={resetToFront}
    />
  );
};

export default StudyCard;
