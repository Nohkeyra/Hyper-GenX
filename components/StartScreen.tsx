/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab } from '../App';
import { SparklesIcon, ArrowRightIcon, BoltIcon, PlayIcon, PaletteIcon, ZapIcon } from './icons';

interface StartScreenProps {
  onStart: (tab?: ActiveTab) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickStart = (tab: ActiveTab) => {
    setTimeout(() => onStart(tab), 300);
  };

  const handleMainLaunch = () => {
    setTimeout(() => onStart(), 300);
  };

  return (
    <div className="w-full min-h-screen bg-transparent relative flex items-center justify-center">
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start md:justify-center p-4 md:p-8 py-16 sm:py-20">
        <div className={`relative mb-8 md:mb-12 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h1 
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white relative"
            style={{ 
              fontFamily: 'var(--font-mono)',
              textShadow: `0 0 30px rgba(248, 19, 13, 0.4), 0 0 60px rgba(251, 70, 6, 0.5)`,
              letterSpacing: '0.1em',
            }}
          >
            <span className="relative inline-block">
              PIXSH<span className="text-red-500">O</span>P
              <span className="absolute -top-2 -right-4 text-sm md:text-base font-mono text-red-400 tracking-widest opacity-80 animate-pulse">
                v3.0
              </span>
            </span>
          </h1>
          
          <div className="flex items-center justify-center gap-3 mt-4">
            <ZapIcon className="w-4 h-4 text-red-400 animate-bounce" />
            <p className="text-gray-300 font-mono text-sm md:text-base tracking-widest uppercase">
              The Sakuga Visual Engine
            </p>
            <ZapIcon className="w-4 h-4 text-orange-400 animate-bounce delay-300" />
          </div>
        </div>

        <div className={`relative mb-12 transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <button
            onClick={handleMainLaunch}
            className="group btn-sakuga w-full max-w-md h-16 bg-gradient-to-r from-black to-black border-red-500/50 text-white px-8 uppercase font-bold tracking-widest hover:border-red-400 hover:shadow-[0_0_60px_rgba(248,19,13,0.6)]"
            aria-label="Launch Visual Engine"
          >
            <div className="relative flex items-center justify-center gap-4">
              <SparklesIcon className="w-5 h-5 text-red-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-lg">LAUNCH ENGINE</span>
              <ArrowRightIcon className="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
            </div>
          </button>
        </div>

        <div className={`w-full max-w-4xl transition-all duration-700 delay-500 ${ isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0' }`}>
          <div className="text-center mb-6">
            <h2 className="text-gray-300 text-sm font-mono uppercase tracking-widest mb-2">
              Quick Start Modules
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => handleQuickStart('flux')}
              className={`group relative p-6 bg-gradient-to-br from-[#0a0a0a] to-black border rounded-xl transition-all duration-300 overflow-hidden border-gray-800 hover:border-red-400/50 hover:scale-105 hover:-translate-y-1`}
              aria-label="Launch Flux Engine"
            >
              <div className="relative flex flex-col items-center text-center">
                <div className={`mb-4 p-4 rounded-full bg-gradient-to-br from-red-900/30 to-red-500/20 transition-all duration-500 group-hover:rotate-12`}>
                  <BoltIcon className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-red-300 transition-colors">Flux Engine</h3>
                <p className="text-gray-400 text-sm mb-4">High-energy image generation</p>
              </div>
            </button>
            <button
              onClick={() => handleQuickStart('video_animation')}
              className={`group relative p-6 bg-gradient-to-br from-[#0a0a0a] to-black border rounded-xl transition-all duration-300 overflow-hidden border-gray-800 hover:border-orange-400/50 hover:scale-105 hover:-translate-y-1`}
              aria-label="Launch Animation Pro"
            >
              <div className="relative flex flex-col items-center text-center">
                <div className={`mb-4 p-4 rounded-full bg-gradient-to-br from-orange-900/30 to-orange-500/20 transition-all duration-500 group-hover:-rotate-12`}>
                  <PlayIcon className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-orange-300 transition-colors">Animation Pro</h3>
                <p className="text-gray-400 text-sm mb-4">Cinematic motion generation</p>
              </div>
            </button>
            <button
              onClick={() => handleQuickStart('vector')}
              className={`group relative p-6 bg-gradient-to-br from-[#0a0a0a] to-black border rounded-xl transition-all duration-300 overflow-hidden border-gray-800 hover:border-yellow-400/50 hover:scale-105 hover:-translate-y-1 sm:col-span-2 lg:col-span-1`}
              aria-label="Launch Vector Art Studio"
            >
              <div className="relative flex flex-col items-center text-center">
                <div className={`mb-4 p-4 rounded-full bg-gradient-to-br from-yellow-900/30 to-yellow-500/20 transition-all duration-500 group-hover:rotate-180`}>
                  <PaletteIcon className="w-10 h-10 text-yellow-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-yellow-300 transition-colors">Vector Art</h3>
                <p className="text-gray-400 text-sm mb-4">Precision vector illustrations</p>
              </div>
            </button>
          </div>
        </div>
        
        <div className={`w-full text-center transition-all duration-700 delay-700 mt-auto pt-16 pb-6 ${ isVisible ? 'opacity-100' : 'opacity-0' }`}>
          <div className="text-gray-600 text-xs font-mono uppercase tracking-widest">
            <span className="text-red-500/70">Sakuga Edition</span>
          </div>
        </div>
      </div>
    </div>
  );
};