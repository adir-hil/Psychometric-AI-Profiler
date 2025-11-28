export enum Gender {
  Male = 'Male',
  Female = 'Female',
  NonBinary = 'Non-Binary',
  PreferNotToSay = 'Prefer Not to Say'
}

export enum QuestionCategory {
  Behavioral = 'Behavioral Characteristics',
  Preferences = 'Preferences (Food, Movies, etc.)',
  DailyRoutine = 'Daily Routine',
  Profession = 'Profession & Work Behavior',
  Interactions = 'Social Interactions'
}

export interface Question {
  id: string;
  category: QuestionCategory;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
  };
}

export interface UserProfile {
  name: string;
  birthDate: string;
  gender: Gender;
  nationality: string;
  photoBase64: string | null;
}

export interface Answer {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | 'E';
  timestamp: number;
}

export interface AnalysisReport {
  summary: string;
  traits: {
    trait: string;
    score: number; // 0-100
    description: string;
  }[];
  psychologicalArchetype: string;
  strengths: string[];
  weaknesses: string[];
  relationshipStyle: string;
  careerFit: string;
  visualCorrelation: string; // How photo correlates with personality (pseudo-scientific/physiognomy analysis via AI)
}

export enum AppView {
  Onboarding = 'ONBOARDING',
  Questionnaire = 'QUESTIONNAIRE',
  Report = 'REPORT',
  Admin = 'ADMIN'
}

export type TTSVoice = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
