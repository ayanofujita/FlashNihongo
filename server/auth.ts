import { Express } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import { db } from './db';

export function setupAuth(app: Express) {
  // Configure passport to use Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
  }, 
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in our database
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (!user) {
        // If user doesn't exist, create a new one
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const displayName = profile.displayName || '';
        const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
        
        // Check if the email is already registered
        const existingUserWithEmail = email ? await storage.getUserByEmail(email) : null;
        
        if (existingUserWithEmail) {
          // Update existing user with Google info
          await db.update(users)
            .set({
              googleId: profile.id,
              profilePicture: profilePicture || existingUserWithEmail.profilePicture
            })
            .where(eq(users.id, existingUserWithEmail.id));
          
          user = await storage.getUser(existingUserWithEmail.id);
        } else {
          // Create completely new user
          user = await storage.createUser({
            username: `user_${profile.id}`,
            email,
            displayName,
            googleId: profile.id,
            profilePicture
          });
          
          // Create user stats for the new user
          await storage.createUserStats({
            userId: user.id,
            totalReviews: 0,
            totalCorrect: 0,
            currentStreak: 0,
            longestStreak: 0,
            cardsLearned: 0,
            studyTime: 0
          });
        }
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));
  
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
}