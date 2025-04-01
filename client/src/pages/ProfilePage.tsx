import { useUser } from "@/components/auth/UserContext";
import { UserStats } from "@/components/UserStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function ProfilePage() {
  const { user, isLoading } = useUser();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-full">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Sign In Required</h1>
          <p className="text-gray-500">Please sign in to view your profile</p>
          <Button asChild>
            <a href="/auth/google">Sign in with Google</a>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>
      
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profilePicture || undefined} />
            <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.displayName || user.username}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <UserStats userId={user.id} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/decks">
            <Button variant="outline">My Decks</Button>
          </Link>
          <Button variant="secondary" onClick={() => window.location.href = "/auth/logout"}>
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}