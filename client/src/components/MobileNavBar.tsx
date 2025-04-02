import { useLocation, Link } from "wouter";
import { Home, Book, GraduationCap, HelpCircle, Search, User, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/components/auth/UserContext";

const MobileNavBar = () => {
  const [location] = useLocation();
  const { user } = useUser();
  
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    if (path === "/decks") return location.startsWith("/decks");
    return location.startsWith(path);
  };
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around items-center">
        <Link href="/">
          <div className={`p-3 flex flex-col items-center justify-center cursor-pointer ${
            isActive("/") ? "text-blue-600" : "text-gray-500"
          }`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        
        <Link href="/decks">
          <div className={`p-3 flex flex-col items-center justify-center cursor-pointer ${
            isActive("/decks") ? "text-blue-600" : "text-gray-500"
          }`}>
            <Book className="h-5 w-5" />
            <span className="text-xs mt-1">Decks</span>
          </div>
        </Link>
        
        <Link href="/study">
          <div className={`p-3 flex flex-col items-center justify-center cursor-pointer ${
            isActive("/study") ? "text-blue-600" : "text-gray-500"
          }`}>
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs mt-1">Study</span>
          </div>
        </Link>
        
        <Link href="/quiz">
          <div className={`p-3 flex flex-col items-center justify-center cursor-pointer ${
            isActive("/quiz") ? "text-blue-600" : "text-gray-500"
          }`}>
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs mt-1">Quiz</span>
          </div>
        </Link>
        
        <Link href="/search">
          <div className={`p-3 flex flex-col items-center justify-center cursor-pointer ${
            isActive("/search") ? "text-blue-600" : "text-gray-500"
          }`}>
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Search</span>
          </div>
        </Link>
        
        {user ? (
          <Link href="/profile">
            <div className={`p-3 flex flex-col items-center justify-center cursor-pointer ${
              isActive("/profile") ? "text-blue-600" : "text-gray-500"
            }`}>
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.profilePicture || undefined} />
                <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs mt-1">Profile</span>
            </div>
          </Link>
        ) : (
          <div 
            onClick={() => window.location.href = "/auth/google"}
            className={`p-3 flex flex-col items-center justify-center cursor-pointer text-gray-500`}
          >
            <LogIn className="h-5 w-5" />
            <span className="text-xs mt-1">Sign In</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileNavBar;