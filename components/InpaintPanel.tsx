/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface InpaintPanelProps {
  onApplyInpaint: (instruction: string) => void;
  onClearMask: () => void;
  isLoading: boolean;
  brushSize: number;
  setBrushSize: (size: number) => void;
  hasImage: boolean;
}

export const InpaintPanel: React.FC<InpaintPanelProps> = ({ 
    onApplyInpaint, 
    onClearMask, 
    isLoading, 
    brushSize, 
    setBrushSize,
    hasImage
}) => {
  const [instruction, setInstruction] = useState('');
  
  const handleApply = () => {
    if (instruction.trim()) {
        onApplyInpaint(instruction.trim());
    }
  };

  const isActionDisabled = isLoading || !instruction.trim() || !hasImage;

  return (
    <div className="flex flex-col relative bg-[#050505] min-h-[400px]">
        {/* Decorative Header Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#DB24E3] to-[#54A970] z-20 opacity-50"></div>

        {/* Sticky Top Section - FIXED OFFSET */}
        <div className="sticky top-0 z-30 p-4 sm:p-6 border-b border-[#1A1A1A] bg-[#050505]/95 backdrop-blur-md shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b-2 border-[#DB24E3]/30">
                <h3 className="text-xl font-black italic tracking-tighter text-white uppercase" style={{fontFamily: 'Koulen'}}>
                   Magic Eraser / Fill
                </h3>
            </div>
            
            <div className="flex justify-between items-center my-2">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                    Paint over an area to modify or erase it.
                </p>
            </div>

            {/* Brush Controls */}
            <div className="bg-[#000000] border border-[#222] p-3 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Brush Size</span>
                    <span className="text-[#DB24E3]">{brushSize}px</span>
                </div>
                <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-[#DB24E3] h-2 bg-[#222] rounded-lg appearance-none cursor-pointer"
                />
            </div>
            
            {/* Instruction Input */}
            <div className="relative pt-2">
                <input
                    type="text"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    maxLength={500}
                    placeholder="E.g., 'Remove sunglasses', 'Change shirt to red'..."
                    className="w-full bg-[#000000] border border-[#222] focus:border-[#DB24E3] text-white p-4 focus:ring-0 focus:outline-none transition disabled:opacity-60 text-sm placeholder-gray-700 font-mono"
                    disabled={isLoading || !hasImage}
                />
            </div>
            
            {/* Unified Control Row: Clear (Left) | Execute (Center) */}
            <div className="flex items-end justify-between gap-2 pt-2 animate-fade-in">
                {/* LEFT: Clear Mask */}
                <button 
                    onClick={onClearMask}
                    className="h-[42px] px-3 text-[10px] font-bold uppercase tracking-widest border border-[#222] text-gray-400 hover:text-white hover:border-[#54A970] bg-[#0A0A0A] transition-colors"
                    title="Clear current selection"
                    disabled={isLoading || !hasImage}
                >
                    Clear Mask
                </button>

                {/* CENTER: Execute Button */}
                <button
                    onClick={handleApply}
                    className="flex-1 h-[42px] bg-gradient-to-r from-[#DB24E3] to-[#54A970] text-white font-black px-4 uppercase italic tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(219,36,227,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_0_10px_rgba(84,169,112,0.3)] btn-sakuga text-xs truncate"
                    disabled={isActionDisabled}
                >
                    <span className="skew-x-[10deg] block">EXECUTE</span>
                </button>
            </div>
        </div>
        
        <div className="p-6">
        </div>
    </div>
  );
};
