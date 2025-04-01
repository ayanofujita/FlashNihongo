import { useLocation, Link } from "wouter";
import { Home, Book, GraduationCap, HelpCircle, Search, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MobileNavBar = () => {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    if (path === "/decks") return location.startsWith("/decks");
    return location.startsWith(path);
  };
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around items-center">
        <Link href="/">
          <a className={`p-3 flex flex-col items-center justify-center ${
            isActive("/") ? "text-blue-600" : "text-gray-500"
          }`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        
        <Link href="/decks">
          <a className={`p-3 flex flex-col items-center justify-center ${
            isActive("/decks") ? "text-blue-600" : "text-gray-500"
          }`}>
            <Book className="h-5 w-5" />
            <span className="text-xs mt-1">Decks</span>
          </a>
        </Link>
        
        <Link href="/study">
          <a className={`p-3 flex flex-col items-center justify-center ${
            isActive("/study") ? "text-blue-600" : "text-gray-500"
          }`}>
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs mt-1">Study</span>
          </a>
        </Link>
        
        <Link href="/quiz">
          <a className={`p-3 flex flex-col items-center justify-center ${
            isActive("/quiz") ? "text-blue-600" : "text-gray-500"
          }`}>
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs mt-1">Quiz</span>
          </a>
        </Link>
        
        <Link href="/search">
          <a className={`p-3 flex flex-col items-center justify-center ${
            isActive("/search") ? "text-blue-600" : "text-gray-500"
          }`}>
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Search</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={`p-3 flex flex-col items-center justify-center ${
            isActive("/profile") ? "text-blue-600" : "text-gray-500"
          }`}>
            <Avatar className="h-6 w-6">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </div>
  );
};

export default MobileNavBar;