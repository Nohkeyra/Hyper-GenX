/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { BoltIcon } from './icons';

interface HeaderProps {
    isPlatinumTier: boolean;
    onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isPlatinumTier, onGoHome }) => {
  return (
    <header className="w-full py-3 px-4 md:px-6 border-b border-gray-800/50 bg-black/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
       <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
      <div 
        onDoubleClick={onGoHome} 
        className="flex items-center gap-2 md:gap-3 group cursor-pointer"
        title="Double-click to start a new session"
      >
        <BoltIcon className="w-6 h-6 text-red-400 group-hover:animate-pulse" />
        <div className="relative">
          <h1 
            className="text-xl sm:text-2xl font-black italic tracking-tighter text-white select-none transition-all group-hover:text-red-300 group-hover:drop-shadow-[0_0_8px_rgba(248,19,13,0.7)]" 
            style={{ fontFamily: 'var(--font-display)' }}
            data-text="PIXSHOP"
          >
            PIXSHOP
          </h1>
          <h1 
            className="absolute top-0 left-0 text-xl sm:text-2xl font-black italic tracking-tighter select-none transition-all text-orange-500 opacity-0 group-hover:opacity-100 group-hover:animate-[h-glitch-before_0.5s_infinite]"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-hidden="true"
          >
            PIXSHOP
          </h1>
          <h1 
            className="absolute top-0 left-0 text-xl sm:text-2xl font-black italic tracking-tighter select-none transition-all text-yellow-300 opacity-0 group-hover:opacity-100 group-hover:animate-[h-glitch-after_0.5s_infinite]"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-hidden="true"
          >
            PIXSHOP
          </h1>
        </div>
      </div>
    </header>
  );
};