import React, { useState, useEffect } from 'react';
import { UserProfile, AppView, Answer, Question, AnalysisReport } from './types';
import Onboarding from './components/Onboarding';
import Questionnaire from './components/Questionnaire';
import ReportView from './components/ReportView';
import { analyzeProfile } from './services/geminiService';
import { saveAnswers, saveReport, saveUserProfile, getUserProfile, getReport } from './services/storageService';

// Simple Error Boundary Component
class SafeErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
          <p className="text-sm bg-red-50 p-4 rounded text-left font-mono overflow-auto">
            {this.state.error?.message || "Unknown error"}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.Onboarding);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
      // Check for existing session
      try {
        const savedUser = getUserProfile();
        const savedReport = getReport();
        if (savedUser && savedReport) {
            setUser(savedUser);
            setReport(savedReport);
            setView(AppView.Report);
        } else if (savedUser) {
            setUser(savedUser);
            // Resume or start fresh? For now, we allow fresh start or continue if we tracked index
            // But simplified flow:
        }
      } catch (e) {
        console.warn("Failed to load session", e);
      }
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUser(profile);
    saveUserProfile(profile);
    setView(AppView.Questionnaire);
  };

  const handleQuestionnaireFinish = async (answers: Answer[], questions: Question[]) => {
    if (!user) return;
    saveAnswers(answers);
    setAnalyzing(true);
    try {
        const result = await analyzeProfile(user, answers, questions);
        setReport(result);
        saveReport(result);
        setView(AppView.Report);
    } catch (e) {
        console.error(e);
        alert("Error analyzing profile. Please check your API Key and internet connection.");
    } finally {
        setAnalyzing(false);
    }
  };

  if (analyzing) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 mb-4"></div>
              <h2 className="text-2xl font-serif text-gray-800">Synthesizing Profile...</h2>
              <p className="text-gray-500 mt-2">Consulting psychological frameworks and analyzing biometric data.</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-indigo-600 font-bold text-xl font-serif tracking-tight">PsychoMetric AI</span>
            </div>
            <div className="flex items-center">
                {user && <span className="text-sm text-gray-500 mr-4">User: {user.name}</span>}
                <button 
                  onClick={() => { localStorage.clear(); window.location.reload(); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                    Reset App
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="py-10">
        {view === AppView.Onboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        {view === AppView.Questionnaire && <Questionnaire onFinish={handleQuestionnaireFinish} />}
        {view === AppView.Report && user && report && <ReportView report={report} user={user} />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SafeErrorBoundary>
      <AppContent />
    </SafeErrorBoundary>
  );
};

export default App;