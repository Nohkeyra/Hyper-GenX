/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useMemo } from 'react';

// Kanji characters: Chaos, Creation, Destruction, Processing, Sync, Awakening, Power, Limit, Break
const kanjiList = ['混沌', '創造', '破壊', '処理', '同調', '覚醒', '出力', '限界', '突破'];

export const Spinner: React.FC = () => {
  const [kanji, setKanji] = useState(kanjiList[0]);
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
        index = (index + 1) % kanjiList.length;
        setKanji(kanjiList[index]);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Generate random orbiting particles
  const particles = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      angle: (i / 8) * 360,
      delay: i * 0.2,
      duration: 2 + Math.random()
  })), []);

  return (
    <div className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 to-orange-500/20 rounded-full blur-[60px] animate-pulse"></div>

        {/* 1. Outer Rotating Ring (Clockwise) */}
        <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
             <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-red-500 stroke-[0.5] opacity-60">
                <circle cx="50" cy="50" r="48" strokeDasharray="1, 4" strokeLinecap="square" />
                <path d="M50 2 A 48 48 0 0 1 98 50" stroke="#FB4606" strokeWidth="1" strokeDasharray="10, 30" className="animate-pulse" />
             </svg>
        </div>

        {/* 2. Middle Ring (Counter-Clockwise, Erratic) */}
        <div className="absolute inset-8 animate-[spin_3s_linear_infinite_reverse]">
             <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-orange-500 stroke-[1]">
                <circle cx="50" cy="50" r="38" strokeDasharray="40, 60" strokeOpacity="0.3" />
                <path d="M50 12 A 38 38 0 0 0 12 50" stroke="#F8130D" strokeWidth="2" strokeDasharray="20, 80" />
             </svg>
        </div>

        {/* 3. Inner Fast Ring (Clockwise) */}
        <div className="absolute inset-16 animate-[spin_1.5s_linear_infinite]">
             <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-yellow-300 stroke-[2] opacity-80">
                <path d="M50 25 A 25 25 0 0 1 75 50" strokeDasharray="20, 100" />
                <path d="M50 75 A 25 25 0 0 1 25 50" strokeDasharray="20, 100" />
             </svg>
        </div>

        {/* 4. Orbiting Particles */}
        {particles.map((p) => (
             <div 
                key={p.id}
                className="absolute w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_#F8130D]"
                style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${p.angle}deg) translateX(100px)`,
                    animation: `pulse ${p.duration}s ease-in-out infinite ${p.delay}s`
                }}
             />
        ))}

        {/* 5. Center Kanji Glitch */}
        <div className="relative z-10 flex flex-col items-center justify-center">
             <div className="relative text-6xl font-black text-white" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                <span className="absolute inset-0 text-red-500 translate-x-[-2px] animate-[glitch-anim-1_2s_infinite_linear_alternate-reverse] opacity-70 mix-blend-screen">{kanji}</span>
                <span className="absolute inset-0 text-orange-500 translate-x-[2px] animate-[glitch-anim-2_3s_infinite_linear_alternate-reverse] opacity-70 mix-blend-screen">{kanji}</span>
                <span className="relative z-10">{kanji}</span>
             </div>
             <div className="mt-4 flex flex-col items-center gap-1">
                 <div className="text-red-400 font-mono text-xs tracking-[0.3em] animate-pulse">SYSTEM PROCESSING</div>
                 <div className="flex gap-1">
                     <span className="w-1 h-1 bg-orange-500"></span>
                     <span className="w-16 h-1 bg-red-500/50 overflow-hidden relative">
                         <div className="absolute inset-0 bg-red-500 animate-[shimmer_1s_infinite]"></div>
                     </span>
                     <span className="w-1 h-1 bg-orange-500"></span>
                 </div>
             </div>
        </div>
    </div>
  );
};

export const PanelScanner: React.FC = () => {
    return (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none overflow-hidden border border-red-500/30">
            {/* Background Grid */}
            <div className="absolute inset-0 cyber-grid opacity-30"></div>
            
            {/* Central Spinner */}
            <div className="relative w-16 h-16 mb-4">
                 <svg className="animate-spin w-full h-full text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                 </div>
            </div>

            <div className="text-red-400 font-black italic uppercase tracking-widest text-lg animate-pulse" style={{ fontFamily: 'Koulen' }}>
                PROCESSING
            </div>
            
            <div className="flex gap-1 mt-2">
                <div className="w-1 h-4 bg-orange-500 animate-[height-jitter_0.5s_infinite]"></div>
                <div className="w-1 h-6 bg-red-500 animate-[height-jitter_0.5s_infinite_0.1s]"></div>
                <div className="w-1 h-3 bg-orange-500 animate-[height-jitter_0.5s_infinite_0.2s]"></div>
                <div className="w-1 h-8 bg-red-500 animate-[height-jitter_0.5s_infinite_0.3s]"></div>
                <div className="w-1 h-5 bg-orange-500 animate-[height-jitter_0.5s_infinite_0.4s]"></div>
            </div>

            {/* Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_10px_#F8130D] animate-[scan-sweep-vertical_2s_linear_infinite]"></div>
        </div>
    );
};