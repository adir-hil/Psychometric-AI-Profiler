import { GoogleGenAI, Modality, Type, Schema } from "@google/genai";
import { Question, QuestionCategory, AnalysisReport, UserProfile, Answer, TTSVoice } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// 1. Generate New Questions
export const generateQuestions = async (category: QuestionCategory, count: number = 1): Promise<Question[]> => {
  const ai = getClient();
  const prompt = `Generate ${count} multiple-choice personality assessment questions for the category: "${category}". 
  Format: JSON array. 
  Each object must have: 
  - text (the question)
  - options (object with keys A, B, C, D, E). 
  Make them psychologically probing.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: {
              type: Type.OBJECT,
              properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
                E: { type: Type.STRING }
              },
              required: ['A', 'B', 'C', 'D']
            }
          },
          required: ['text', 'options']
        }
      }
    }
  });

  const rawData = JSON.parse(response.text || '[]');
  
  return rawData.map((q: any, index: number) => ({
    id: `gen-${Date.now()}-${index}`,
    category,
    text: q.text,
    options: q.options
  }));
};

// 2. TTS - Read Question
export const synthesizeSpeech = async (text: string, voice: TTSVoice): Promise<string> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

// 3. Audio Answer Interpretation (STT)
export const interpretVoiceAnswer = async (audioBlob: Blob): Promise<'A' | 'B' | 'C' | 'D' | 'E' | null> => {
  const ai = getClient();
  
  // Convert Blob to Base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(audioBlob);
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/wav',
            data: base64Data
          }
        },
        {
          text: "The user is answering a multiple choice question. They might say 'Option A' or 'The first one' or just read the answer text. Determine which option (A, B, C, D, or E) they selected. Return JSON with key 'selection'."
        }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            selection: { type: Type.STRING, enum: ['A', 'B', 'C', 'D', 'E', 'UNKNOWN'] }
        }
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  return result.selection === 'UNKNOWN' ? null : result.selection;
};

// 4. Final Profile Analysis
export const analyzeProfile = async (user: UserProfile, answers: Answer[], questions: Question[]): Promise<AnalysisReport> => {
  const ai = getClient();
  
  // Prepare data context
  const answerContext = answers.map(a => {
    const q = questions.find(question => question.id === a.questionId);
    return `Category: ${q?.category} | Question: ${q?.text} | Answer: ${q?.options[a.selectedOption]}`;
  }).join('\n');

  const parts: any[] = [
    {
      text: `Analyze this user profile based on academic psychological frameworks (Big Five, MBTI, Jungian Archetypes). 
      
      User Demographics:
      Name: ${user.name}
      Age: ${new Date().getFullYear() - new Date(user.birthDate).getFullYear()}
      Gender: ${user.gender}
      Nationality: ${user.nationality}
      
      Questionnaire Responses:
      ${answerContext}
      
      Task: Provide a deep psychological profile. Also, analyze the provided photo (physiognomy/visual vibe) and correlate it with the data (use scientific skepticism but provide the 'visual impression').
      `
    }
  ];

  if (user.photoBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg/png
        data: user.photoBase64.split(',')[1]
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Stronger reasoning model
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          traits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                trait: { type: Type.STRING },
                score: { type: Type.NUMBER },
                description: { type: Type.STRING }
              }
            }
          },
          psychologicalArchetype: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          relationshipStyle: { type: Type.STRING },
          careerFit: { type: Type.STRING },
          visualCorrelation: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}') as AnalysisReport;
};
