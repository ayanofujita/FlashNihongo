import Flashcard from "../ui/flashcard";

interface StudyCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  resetToFront?: boolean;
  actionButton?: React.ReactNode;
}

const StudyCard = ({ 
  front, 
  back,
  resetToFront = true,
  actionButton
}: StudyCardProps) => {
  return (
    <Flashcard
      front={front}
      back={back}
      resetToFront={resetToFront}
      actionButton={actionButton}
    />
  );
};

export default StudyCard;
