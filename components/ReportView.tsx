import React from 'react';
import { AnalysisReport, UserProfile } from '../types';

// Inline Icons
const IconDownload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconShare = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;

interface Props {
  report: AnalysisReport;
  user: UserProfile;
}

// Simple Radar Chart Component using native SVG
// This bypasses the Recharts dependency issues
const SimpleRadarChart: React.FC<{ data: { trait: string; score: number }[] }> = ({ data }) => {
  if (data.length < 3) return <div className="text-center text-gray-400">Not enough data for chart</div>;
  
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const angleSlice = (Math.PI * 2) / data.length;

  // Calculate polygon points
  const points = data.map((d, i) => {
    const angle = i * angleSlice - Math.PI / 2; // Start at top
    const r = (d.score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  // Calculate axis lines and labels
  const axes = data.map((d, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const x2 = center + radius * Math.cos(angle);
    const y2 = center + radius * Math.sin(angle);
    
    // Label position (slightly outside radius)
    const labelX = center + (radius + 20) * Math.cos(angle);
    const labelY = center + (radius + 20) * Math.sin(angle);

    return { x1: center, y1: center, x2, y2, labelX, labelY, label: d.trait };
  });

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <circle 
            key={scale} 
            cx={center} 
            cy={center} 
            r={radius * scale} 
            fill="none" 
            stroke="#e5e7eb" 
        />
      ))}
      
      {/* Axes */}
      {axes.map((axis, i) => (
        <g key={i}>
            <line x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2} stroke="#e5e7eb" />
            <text 
                x={axis.labelX} 
                y={axis.labelY} 
                fontSize="10" 
                textAnchor="middle" 
                alignmentBaseline="middle" 
                fill="#6b7280"
            >
                {axis.label}
            </text>
        </g>
      ))}

      {/* Data Polygon */}
      <polygon points={points} fill="rgba(79, 70, 229, 0.5)" stroke="#4f46e5" strokeWidth="2" />
    </svg>
  );
};

const ReportView: React.FC<Props> = ({ report, user }) => {
  const safeTraits = Array.isArray(report.traits) ? report.traits : [];

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-center border-b pb-8 mb-8">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0 bg-gray-200">
                 {user.photoBase64 ? (
                    <img src={user.photoBase64} alt={user.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
                 )}
            </div>
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">{user.name}</h1>
                <p className="text-gray-500 mb-4">{user.nationality} • {user.gender} • {new Date().getFullYear() - new Date(user.birthDate).getFullYear()} years old</p>
                <div className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-full text-lg font-semibold shadow-md">
                    {report.psychologicalArchetype}
                </div>
            </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-12">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Executive Summary</h3>
            <p className="text-xl text-gray-800 leading-relaxed font-serif italic border-l-4 border-indigo-500 pl-4 bg-gray-50 py-4 pr-4 rounded-r-lg">
                "{report.summary}"
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Left Col: Traits Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Personality Trait Matrix</h3>
                <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded">
                    {safeTraits.length > 0 ? (
                         <SimpleRadarChart data={safeTraits} />
                    ) : (
                        <p className="text-gray-400">No trait data available</p>
                    )}
                </div>
                <div className="mt-4 space-y-3">
                    {safeTraits.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-700">{t.trait}</span>
                            <span className="text-gray-500 truncate ml-2 w-1/2 text-right" title={t.description}>{t.description}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Col: Details */}
            <div className="space-y-8">
                
                {/* Visual Correlation */}
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 shadow-sm border border-indigo-100">
                     <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
                         <span>👁️</span> Visual Analysis (Physiognomy)
                     </h3>
                     <p className="text-gray-700 text-sm leading-relaxed">
                         {typeof report.visualCorrelation === 'string' ? report.visualCorrelation : JSON.stringify(report.visualCorrelation)}
                     </p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h4 className="font-bold text-green-800 mb-2">Strengths</h4>
                        <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                            {report.strengths?.map((s,i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h4 className="font-bold text-red-800 mb-2">Weaknesses</h4>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {report.weaknesses?.map((w,i) => <li key={i}>{w}</li>)}
                        </ul>
                    </div>
                </div>

                {/* Relationship & Career */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-bold uppercase text-gray-500">Relationship Style</h4>
                        <p className="text-gray-800">{report.relationshipStyle}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold uppercase text-gray-500">Career Fit</h4>
                        <p className="text-gray-800">{report.careerFit}</p>
                    </div>
                </div>

            </div>
        </div>
        
        {/* Footer actions */}
        <div className="mt-12 flex justify-center gap-4">
            <button className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition shadow-lg">
                <IconDownload /> Export PDF
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg">
                <IconShare /> Share Profile
            </button>
        </div>

    </div>
  );
};

export default ReportView;