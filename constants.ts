import { Question, QuestionCategory } from './types';

// In a real scenario, this would be fetched from a DB interaction
// We seed this with a small set for the demo, representing the "10,000" database.
export const INITIAL_QUESTIONS: Question[] = [
  // Behavioral
  {
    id: 'b-1',
    category: QuestionCategory.Behavioral,
    text: 'When faced with a sudden, unexpected problem, what is your immediate reaction?',
    options: {
      A: 'Panic slightly, then seek help immediately.',
      B: 'Pause, analyze the situation logically, and form a plan.',
      C: 'Act on instinct and try to fix it quickly.',
      D: 'Ignore it hoping it goes away.',
      E: 'Blame external factors before solving it.'
    }
  },
  {
    id: 'b-2',
    category: QuestionCategory.Behavioral,
    text: 'You are waiting in a long line that isn’t moving. You:',
    options: {
      A: 'Complain loudly to others in line.',
      B: 'Check your phone and zone out.',
      C: 'Find a staff member to ask for an update.',
      D: 'Leave the line immediately.',
      E: 'Strike up a conversation with the person next to you.'
    }
  },
  // Preferences
  {
    id: 'p-1',
    category: QuestionCategory.Preferences,
    text: 'Which genre of movie appeals to you most for a relaxed evening?',
    options: {
      A: 'Complex Psychological Thriller',
      B: 'Light-hearted Romantic Comedy',
      C: 'High-octane Action/Adventure',
      D: 'Historical Documentary',
      E: 'Fantasy or Sci-Fi Escapism'
    }
  },
  {
    id: 'p-2',
    category: QuestionCategory.Preferences,
    text: 'Your ideal vacation spot is:',
    options: {
      A: 'A bustling city with museums and nightlife.',
      B: 'A secluded cabin in the mountains.',
      C: 'A luxury beach resort with full service.',
      D: 'Backpacking through remote villages.',
      E: 'A staycation at home with no obligations.'
    }
  },
  // Routine
  {
    id: 'r-1',
    category: QuestionCategory.DailyRoutine,
    text: 'How do you handle your morning wake-up routine?',
    options: {
      A: 'Snooze 5 times, rush out the door.',
      B: 'Wake up early, exercise, meditate.',
      C: 'Wake up just in time, grab coffee, go.',
      D: 'Slow start, reading news in bed for an hour.',
      E: 'It varies wildly every day.'
    }
  },
  // Profession
  {
    id: 'w-1',
    category: QuestionCategory.Profession,
    text: 'During a heated team meeting, you differ with the boss. You:',
    options: {
      A: 'Stay silent to avoid conflict.',
      B: 'Respectfully voice your disagreement with data.',
      C: 'Argue passionately for your point of view.',
      D: 'Discuss it privately afterwards.',
      E: 'Agree outwardly but do it your way anyway.'
    }
  },
  // Interactions
  {
    id: 'i-1',
    category: QuestionCategory.Interactions,
    text: 'A close friend cancels plans last minute. You feel:',
    options: {
      A: 'Relieved, now I have me-time.',
      B: 'Annoyed and disrespected.',
      C: 'Worried something is wrong with them.',
      D: 'Indifferent, I’ll find something else to do.',
      E: 'Hurt, wondering if they don’t like me.'
    }
  }
];

export const TOTAL_QUESTIONS_TO_ASK = 5; // Reduced from 100 to 5 for Demo Speed, change to 100 for production.
