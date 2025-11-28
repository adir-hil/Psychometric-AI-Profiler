import React, { useState, useEffect, useRef } from 'react';
import { Question, Answer, TTSVoice, QuestionCategory } from '../types';
import { INITIAL_QUESTIONS, TOTAL_QUESTIONS_TO_ASK } from '../constants';
import { synthesizeSpeech, interpretVoiceAnswer, generateQuestions } from '../services/geminiService';

// Inline Icons
const IconMic = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const IconSkip = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>;
const IconRefresh = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconVolume = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const IconPlus = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;

interface Props {
  onFinish: (answers: Answer[], allQuestions: Question[]) => void;
}

const Questionnaire: React.FC<Props> = ({ onFinish }) => {
  // State
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [activeQueue, setActiveQueue] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>('Puck');
  const [isRecording, setIsRecording] = useState(false);
  const [addMode, setAddMode] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialization: Randomize Questions
  useEffect(() => {
    const shuffled = [...INITIAL_QUESTIONS].sort(() => 0.5 - Math.random());
    setQuestionPool(shuffled);
    // Select first N or all if fewer
    setActiveQueue(shuffled.slice(0, Math.min(TOTAL_QUESTIONS_TO_ASK, shuffled.length)));
  }, []);

  const currentQuestion = activeQueue[currentIdx];

  // TTS Effect
  useEffect(() => {
    if (currentQuestion && audioUrl) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Auto-play prevented", e));
      }
    }
  }, [audioUrl, currentQuestion]);

  const handleReadQuestion = async () => {
    if (!currentQuestion) return;
    setLoading(true);
    try {
      // Create text to read: Question + Options
      const textToRead = `${currentQuestion.text}. Option A: ${currentQuestion.options.A}. Option B: ${currentQuestion.options.B}. Option C: ${currentQuestion.options.C}. Option D: ${currentQuestion.options.D}.`;
      const url = await synthesizeSpeech(textToRead, selectedVoice);
      setAudioUrl(url);
    } catch (err) {
      alert("Failed to synthesize speech.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      selectedOption: option,
      timestamp: Date.now()
    };
    
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (newAnswers.length >= activeQueue.length) {
      onFinish(newAnswers, activeQueue);
    } else {
      setAudioUrl(null); // Reset audio for next q
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    // Move current question to end of queue
    const updatedQueue = [...activeQueue];
    const item = updatedQueue.splice(currentIdx, 1)[0];
    updatedQueue.push(item);
    setActiveQueue(updatedQueue);
    setAudioUrl(null);
    // Index stays same essentially, as next item slides in, unless at end
    if (currentIdx >= updatedQueue.length) {
        setCurrentIdx(0); 
    }
  };

  const handleReplace = async () => {
    setLoading(true);
    // Try to find one in pool not in active queue
    const usedIds = new Set(activeQueue.map(q => q.id));
    const available = questionPool.find(q => !usedIds.has(q.id));

    if (available) {
        const newQueue = [...activeQueue];
        newQueue[currentIdx] = available;
        setActiveQueue(newQueue);
    } else {
        // Generate a new one via AI if pool empty
        try {
            const newQuestions = await generateQuestions(currentQuestion.category, 1);
            if (newQuestions.length > 0) {
                const newQ = newQuestions[0];
                setQuestionPool(prev => [...prev, newQ]);
                const newQueue = [...activeQueue];
                newQueue[currentIdx] = newQ;
                setActiveQueue(newQueue);
            }
        } catch (e) {
            alert("Could not generate replacement.");
        }
    }
    setAudioUrl(null);
    setLoading(false);
  };

  const handleVoiceAnswer = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setLoading(true);
          try {
            const selection = await interpretVoiceAnswer(audioBlob);
            if (selection) {
              handleAnswer(selection);
            } else {
              alert("Could not understand your selection. Please try again or click an option.");
            }
          } catch (e) {
            console.error(e);
            alert("Error processing voice answer.");
          } finally {
            setLoading(false);
            // Stop tracks
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        alert("Microphone access denied.");
      }
    }
  };

  const handleAddQuestionAI = async (cat: string) => {
      setLoading(true);
      try {
          const newQs = await generateQuestions(cat as QuestionCategory, 1);
          setQuestionPool(prev => [...prev, ...newQs]);
          // Insert into queue at next position
          const newQueue = [...activeQueue];
          newQueue.splice(currentIdx + 1, 0, newQs[0]);
          setActiveQueue(newQueue);
          setAddMode(false);
      } catch(e) {
          alert("Failed to add question");
      } finally {
          setLoading(false);
      }
  };

  if (!currentQuestion) return <div className="text-center p-10">Loading Questions...</div>;

  const total = activeQueue.length;
  const progress = total > 0 ? (answers.length / total) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header / Progress */}
        <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Progress</span>
                <span>{answers.length} / {total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 relative min-h-[500px] flex flex-col">
            {loading && (
                <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {/* Category Tag */}
            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-semibold mb-4 w-fit">
                {currentQuestion.category}
            </span>

            {/* Question Text */}
            <h2 className="text-2xl md:text-3xl font-serif text-gray-900 mb-8 leading-tight">
                {currentQuestion.text}
            </h2>

            {/* Audio Controls */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <button 
                    onClick={handleReadQuestion} 
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    <IconVolume />
                    {audioUrl ? 'Replay' : 'Read Out'}
                </button>
                <select 
                    value={selectedVoice} 
                    onChange={(e) => setSelectedVoice(e.target.value as TTSVoice)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2 focus:ring-indigo-500"
                >
                    <option value="Puck">Puck (Male)</option>
                    <option value="Charon">Charon (Deep)</option>
                    <option value="Kore">Kore (Female)</option>
                    <option value="Fenrir">Fenrir (Deep)</option>
                    <option value="Zephyr">Zephyr (Soft)</option>
                </select>
                {audioUrl && <audio ref={audioRef} src={audioUrl} controls className="h-8 w-40" />}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3 mb-8">
                {(Object.keys(currentQuestion.options) as Array<keyof Question['options']>).map((key) => {
                     if (!currentQuestion.options[key]) return null;
                     return (
                        <button
                            key={key}
                            onClick={() => handleAnswer(key)}
                            className="text-left p-4 border-2 border-gray-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
                        >
                            <span className="font-bold text-gray-400 group-hover:text-indigo-500 mr-3">{key}.</span>
                            <span className="text-gray-700 group-hover:text-gray-900">{currentQuestion.options[key]}</span>
                        </button>
                     );
                })}
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-6 border-t border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                
                {/* Voice Answer */}
                <button 
                    onClick={handleVoiceAnswer}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                        isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <IconMic />
                    {isRecording ? 'Listening... (Click to Stop)' : 'Answer with Voice'}
                </button>

                <div className="flex gap-2">
                    <button onClick={handleReplace} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded hover:bg-gray-100">
                        <IconRefresh /> Replace
                    </button>
                    <button onClick={handleSkip} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded hover:bg-gray-100">
                        Skip <IconSkip />
                    </button>
                </div>
            </div>
            
            {/* Add Question Button */}
             <button onClick={() => setAddMode(!addMode)} className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600">
                 <IconPlus />
             </button>
             
             {addMode && (
                 <div className="absolute top-12 right-4 bg-white shadow-xl border rounded-lg p-4 w-64 z-10 animate-fade-in">
                     <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">AI Add Question</h4>
                     <div className="flex flex-col gap-2">
                         {Object.values(QuestionCategory).map(cat => (
                             <button 
                                key={cat}
                                onClick={() => handleAddQuestionAI(cat)}
                                className="text-left text-xs p-2 hover:bg-indigo-50 rounded text-gray-700 truncate"
                             >
                                 + {cat}
                             </button>
                         ))}
                     </div>
                 </div>
             )}
        </div>
    </div>
  );
};

export default Questionnaire;