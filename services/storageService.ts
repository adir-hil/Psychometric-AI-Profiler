import { UserProfile, Answer, AnalysisReport } from '../types';

const KEYS = {
  USER_PROFILE: 'psy_user_profile',
  ANSWERS: 'psy_answers',
  REPORT: 'psy_report',
  CUSTOM_QUESTIONS: 'psy_custom_questions'
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
};

export const getUserProfile = (): UserProfile | null => {
  const data = localStorage.getItem(KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
};

export const saveAnswers = (answers: Answer[]) => {
  localStorage.setItem(KEYS.ANSWERS, JSON.stringify(answers));
};

export const getAnswers = (): Answer[] => {
  const data = localStorage.getItem(KEYS.ANSWERS);
  return data ? JSON.parse(data) : [];
};

export const saveReport = (report: AnalysisReport) => {
  localStorage.setItem(KEYS.REPORT, JSON.stringify(report));
};

export const getReport = (): AnalysisReport | null => {
  const data = localStorage.getItem(KEYS.REPORT);
  return data ? JSON.parse(data) : null;
};

export const clearSession = () => {
  localStorage.removeItem(KEYS.USER_PROFILE);
  localStorage.removeItem(KEYS.ANSWERS);
  localStorage.removeItem(KEYS.REPORT);
};
