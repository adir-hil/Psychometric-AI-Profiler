import React, { useState } from 'react';
import { UserProfile, Gender } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.PreferNotToSay);
  const [nationality, setNationality] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthDate || !nationality || !photoBase64) {
      alert("Please fill in all fields and upload a photo.");
      return;
    }
    onComplete({ name, birthDate, gender, nationality, photoBase64 });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Identity Setup</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Photo Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 bg-gray-100 mb-2 relative">
            {photoBase64 ? (
              <img src={photoBase64} alt="Passport" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No Photo</div>
            )}
          </div>
          <label className="cursor-pointer bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-100 transition">
            Upload Passport Photo
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2 focus:ring-indigo-500 focus:border-indigo-500" 
            placeholder="John Doe"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">Birth Date</label>
            <input 
                type="date" 
                value={birthDate} 
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2" 
            />
            </div>
            <div>
             <label className="block text-sm font-medium text-gray-700">Gender</label>
             <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value as Gender)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2"
             >
                 {Object.values(Gender).map(g => (
                     <option key={g} value={g}>{g}</option>
                 ))}
             </select>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nationality</label>
          <input 
            type="text" 
            value={nationality} 
            onChange={(e) => setNationality(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2" 
            placeholder="e.g. American, Japanese"
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition mt-4"
        >
          Begin Profiling
        </button>
      </form>
    </div>
  );
};

export default Onboarding;
