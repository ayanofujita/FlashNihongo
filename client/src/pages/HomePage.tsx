import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UserStats } from "@/components/UserStats";
import { useUser } from "@/components/auth/UserContext";

const HomePage = () => {
  const { user } = useUser();
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to NihongoFlash</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The ultimate Japanese learning flashcard application with spaced repetition, quizzes, and dictionary integration.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <Button className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/decks">View My Decks</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/search">Search Dictionary</Link>
          </Button>
        </div>
      </div>
      
      {/* User Stats Section */}
      <div className="max-w-5xl mx-auto mb-12">
        <UserStats userId={user?.id} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4">Study with SRS</h2>
          <p className="text-gray-600 mb-4 flex-grow">
            Optimize your learning with our spaced repetition system. Focus on what you need to review most.
          </p>
          <div className="mt-auto pt-4">
            <Button variant="ghost" className="text-blue-600" asChild>
              <Link href="/study">Start Studying</Link>
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4">Test Your Knowledge</h2>
          <p className="text-gray-600 mb-4 flex-grow">
            Challenge yourself with multiple-choice quizzes from any of your decks.
          </p>
          <div className="mt-auto pt-4">
            <Button variant="ghost" className="text-violet-600" asChild>
              <Link href="/quiz">Take a Quiz</Link>
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4">Look Up Words</h2>
          <p className="text-gray-600 mb-4 flex-grow">
            Search for Japanese words and add them directly to your flashcard decks.
          </p>
          <div className="mt-auto pt-4">
            <Button variant="ghost" className="text-green-600" asChild>
              <Link href="/search">Search Dictionary</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
