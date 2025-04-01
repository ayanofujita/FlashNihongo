import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck, Clock, Flame, Trophy, Star, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UserStatsProps {
  userId?: number;
}

interface UserStats {
  id: number;
  userId: number;
  totalReviews: number;
  totalCorrect: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  cardsLearned: number;
  studyTime: number;
}

export const UserStats = ({ userId = 1 }: UserStatsProps) => {
  const { data: stats, isLoading, error } = useQuery<UserStats>({
    queryKey: ['/api/user-stats', userId],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="flex flex-wrap gap-4">
          <div className="h-24 w-32 bg-gray-200 rounded"></div>
          <div className="h-24 w-32 bg-gray-200 rounded"></div>
          <div className="h-24 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    // Return empty stats widget with a note about starting to study
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Your Learning Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className="mb-4 text-gray-600">Start studying to track your progress and build a streak!</p>
            <div className="flex justify-center">
              <Flame className="h-16 w-16 text-gray-300" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate accuracy
  const accuracy = stats.totalReviews > 0 
    ? Math.round((stats.totalCorrect / stats.totalReviews) * 100) 
    : 0;

  // Format last study date
  const lastStudyDate = stats.lastStudyDate 
    ? new Date(stats.lastStudyDate).toLocaleDateString() 
    : "Never";

  // Check if studied today
  const studiedToday = stats.lastStudyDate 
    ? new Date(stats.lastStudyDate).toDateString() === new Date().toDateString()
    : false;

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Your Learning Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Streak Card */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Flame className={`h-5 w-5 ${stats.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              <span>Current Streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.currentStreak}</span>
              <span className="text-gray-500">days</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Longest: {stats.longestStreak} days
            </div>
            <div className={`mt-2 text-sm ${studiedToday ? 'text-green-600' : 'text-gray-500'}`}>
              {studiedToday ? '✓ Studied today' : 'Haven\'t studied today yet!'}
            </div>
          </div>

          {/* Reviews Card */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Total Reviews</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.totalReviews}</span>
              <span className="text-gray-500">cards</span>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy</span>
                <span>{accuracy}%</span>
              </div>
              <Progress value={accuracy} className="h-2" />
            </div>
          </div>

          {/* Cards Learned Card */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Star className="h-5 w-5 text-purple-500" />
              <span>Cards Learned</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.cardsLearned}</span>
              <span className="text-gray-500">cards</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Last studied: {lastStudyDate}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Study time: {stats.studyTime} minutes
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStats;