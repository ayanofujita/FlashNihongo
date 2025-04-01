import { Card, CardContent } from "@/components/ui/card";

interface QuizCardProps {
  question: string;
  options: string[];
  onSelect: (option: string) => void;
  selectedOption: string | null;
  correctAnswer: string;
}

const QuizCard = ({ 
  question, 
  options, 
  onSelect, 
  selectedOption, 
  correctAnswer 
}: QuizCardProps) => {
  const getOptionStyle = (option: string) => {
    if (!selectedOption) return "";
    
    // Always highlight the correct answer in green when a selection is made
    if (option === correctAnswer) {
      return "border-2 border-green-500 bg-green-50 font-semibold text-green-700";
    }
    
    // Highlight the selected wrong answer in red
    if (option === selectedOption && option !== correctAnswer) {
      return "border-2 border-red-500 bg-red-50 text-red-700";
    }
    
    // Non-selected options get a subtle fade after selection
    return "opacity-60";
  };
  
  return (
    <Card className="rounded-xl shadow-lg border border-gray-200">
      <CardContent className="p-8">
        <h3 className="text-lg text-gray-600 mb-4">What is the meaning of:</h3>
        <div className="text-5xl font-jp font-medium text-center mb-6">{question}</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {options.map((option, index) => (
            <button
              key={index}
              className={`border border-gray-300 rounded-lg py-3 px-4 text-left hover:bg-gray-50 transition ${getOptionStyle(option)}`}
              onClick={() => onSelect(option)}
              disabled={selectedOption !== null}
            >
              <div className="flex">
                <span className="font-medium mr-2 flex-shrink-0">{['A', 'B', 'C', 'D'][index]}.</span> 
                <span className="break-words w-full overflow-hidden">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizCard;
