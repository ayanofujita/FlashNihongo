import { Express } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import { db } from './db';

export function setupAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Validate required environment variables are present
  if (!clientID || !clientSecret) {
    console.error('Missing required Google OAuth environment variables:');
    if (!clientID) console.error('- GOOGLE_CLIENT_ID is missing');
    if (!clientSecret) console.error('- GOOGLE_CLIENT_SECRET is missing');
    console.error('Google authentication will not work until these are provided.');
    // Log environment variables for debugging (without revealing secrets)
    console.log('Available environment variables:', Object.keys(process.env).join(', '));
  } else {
    console.log('Google OAuth credentials found successfully');
  }
  
  // Get all possible domain names from environment
  const replit_domains = process.env.REPLIT_DOMAINS || '';
  const allDomains = replit_domains.split(',').filter(Boolean);
  
  // Get the primary domain for callback
  let callbackURL = 'http://localhost:5000/auth/google/callback'; // Default for local development
  
  if (allDomains.length > 0) {
    // Prioritize domain with '.repl.co' for development
    const devDomain = allDomains.find(d => d.includes('.riker.replit.dev'));
    // Prioritize custom domain or .replit.app domain for production
    const prodDomain = allDomains.find(d => !d.includes('.riker.replit.dev') && !d.includes('localhost'));
    
    // Use production domain if available, otherwise development domain
    const primaryDomain = prodDomain || devDomain || allDomains[0];
    callbackURL = `https://${primaryDomain}/auth/google/callback`;
  }
  
  console.log('All possible domains:', allDomains);
  console.log('Google OAuth callback URL configured as:', callbackURL);
  
  try {
    // Configure passport to use Google Strategy
    passport.use(new GoogleStrategy({
      clientID: clientID || '',
      clientSecret: clientSecret || '',
      callbackURL: callbackURL,
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
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
            
            // Create user stats for the new user (only if they don't exist)
            const existingUserStats = await storage.getUserStats(user.id);
            if (!existingUserStats) {
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
        }
        
        // Handle nullable fields on the user by converting to Express.User interface
        return done(null, user ? {
          id: user.id,
          username: user.username,
          email: user.email || undefined,
          displayName: user.displayName || undefined,
          profilePicture: user.profilePicture || undefined,
          googleId: user.googleId || undefined
        } : undefined);
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
        if (user) {
          // Map the DB user to the Express.User interface to fix the type issue
          done(null, {
            id: user.id,
            username: user.username,
            email: user.email || undefined,
            displayName: user.displayName || undefined,
            profilePicture: user.profilePicture || undefined,
            googleId: user.googleId || undefined
          });
        } else {
          done(null, null);
        }
      } catch (error) {
        done(error);
      }
    });
    
    // Initialize passport
    app.use(passport.initialize());
    app.use(passport.session());
  } catch (error) {
    console.error('Error setting up Google OAuth strategy:', error);
  }
}