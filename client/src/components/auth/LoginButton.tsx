import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, useUser } from "./UserContext";
import { LogIn } from "lucide-react";
import { signInWithGoogle, signOutUser } from "@/lib/auth";

export function LoginButton() {
  const { toast } = useToast();
  const { user, isLoading } = useUser();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Error signing in",
        description: "An error occurred while signing in with Google",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.profilePicture && (
          <img 
            src={user.profilePicture} 
            alt={user.displayName || user.username}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="mr-2 hidden md:block">
          {user.displayName || user.username}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      variant="outline"
      className="flex items-center gap-2"
    >
      <LogIn className="h-4 w-4" />
      <span>Sign in with Google</span>
    </Button>
  );
}