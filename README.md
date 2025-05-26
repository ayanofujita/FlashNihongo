
# NihongoFlash 🇯🇵

A modern Japanese learning flashcard application with spaced repetition, quizzes, and dictionary integration. Built with React, Express, and PostgreSQL.

## Features

- **Spaced Repetition System (SRS)**: Optimize your learning with intelligent card scheduling
- **Interactive Study Mode**: Study cards with customizable difficulty levels
- **Quiz Mode**: Test your knowledge with multiple-choice quizzes
- **Dictionary Integration**: Search Japanese words using the Jisho API
- **Progress Tracking**: Monitor your learning stats, streaks, and performance
- **Google OAuth**: Secure authentication with Google accounts
- **Progressive Web App (PWA)**: Install and use offline on any device
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

**Frontend:**
- React with TypeScript
- TailwindCSS for styling
- React Query for data fetching
- PWA support

**Backend:**
- Node.js with Express
- PostgreSQL database (Neon)
- Drizzle ORM
- Passport.js for authentication

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Google OAuth credentials

### Environment Variables

Create a `.env` file in the root directory with:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Usage

### Creating Decks

1. Navigate to the "Decks" page
2. Click "Create New Deck"
3. Add a name and description for your deck
4. Start adding cards with Japanese text, readings, and translations

### Studying

1. Go to the "Study" page
2. Select which decks you want to study
3. Use the SRS system to review cards based on your performance
4. Cards will be scheduled for future review automatically

### Dictionary Search

1. Visit the "Search" page
2. Enter Japanese words or English translations
3. View detailed definitions, readings, and example sentences
4. Add words directly to your decks

### Quiz Mode

1. Navigate to the "Quiz" page
2. Select a deck to quiz from
3. Answer multiple-choice questions
4. View your results and accuracy

## Database Schema

The application uses the following main tables:

- `users` - User authentication and profile data
- `decks` - Flashcard deck information
- `cards` - Individual flashcards with front/back content
- `study_progress` - SRS data including intervals, ease factors, and review dates
- `user_stats` - Learning statistics and streaks

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/logout` - Logout user

### Decks
- `GET /api/decks` - Get user's decks
- `POST /api/decks` - Create new deck
- `PUT /api/decks/:id` - Update deck
- `DELETE /api/decks/:id` - Delete deck

### Cards
- `GET /api/decks/:deckId/cards` - Get cards in deck
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

### Study
- `GET /api/study/due` - Get cards due for review
- `POST /api/study/progress` - Update study progress

### Dictionary
- `GET /api/dictionary/search` - Search Japanese dictionary
- `GET /api/examples` - Get example sentences

## Deployment

The application is designed to run on Replit:

1. Push your code to the repository
2. Configure environment variables in Replit Secrets
3. The app will automatically deploy on port 5000

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Dictionary data from [Jisho.org](https://jisho.org/)
- Example sentences from [Tatoeba](https://tatoeba.org/)
- Built with modern web technologies and best practices
