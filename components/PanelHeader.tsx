/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SparklesIcon } from './icons';
import { refineImagePrompt } from '../services/geminiService';

interface PanelHeaderProps {
  title: string;
  prompt: string;
  setPrompt: (value: string) => void;
  onApply: (prompt: string, useOriginal: boolean, aspectRatio: string) => void;
  onGenerate?: (prompt: string, aspectRatio: string) => void;
  onClear: () => void;
  isLoading: boolean;
  hasImage: boolean;
  placeholder?: string;
  applyButtonLabel?: string;
  generateButtonLabel?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  prompt,
  setPrompt,
  onApply,
  onGenerate,
  onClear,
  isLoading,
  hasImage,
  placeholder = "Describe an effect or style...",
  applyButtonLabel = "TRANSFORM",
  generateButtonLabel = "NEW",
}) => {
  const [stackEffect, setStackEffect] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isRefining, setIsRefining] = useState(false);

  const handleRefine = async () => {
    if (!prompt.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refined = await refineImagePrompt(prompt);
      setPrompt(refined);
    } catch (e) {
      console.error("Refinement failed", e);
    } finally {
      setIsRefining(false);
    }
  };

  const handleApplyClick = () => {
    onApply(prompt, !stackEffect, aspectRatio);
  };

  const handleGenerateClick = () => {
    if (onGenerate) {
      if (hasImage) {
        if (!window.confirm("This will start a new session and clear your current image and history. Are you sure you want to generate a new image?")) {
            return; // User cancelled
        }
      }
      onGenerate(prompt, aspectRatio);
    }
  };

  const isActionDisabled = isLoading || !prompt.trim();

  return (
    <div className="sticky top-0 z-30 p-4 sm:p-6 border-b border-[#1A1A1A] bg-[#050505]/95 backdrop-blur-md shadow-xl">
        <div className="flex justify-between items-center pb-2">
            <h3 className="text-xl font-black italic tracking-tighter text-white uppercase" style={{fontFamily: 'Koulen'}}>{title}</h3>
        </div>

        <div className="relative">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
                placeholder={placeholder}
                className="w-full bg-[#000000] border-2 text-white p-4 pr-10 focus:ring-0 focus:outline-none transition disabled:opacity-60 text-sm placeholder-gray-700 font-mono border-[#222] focus:border-[#54A970]"
                disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {prompt && (
                    <button onClick={onClear} className="text-gray-600 hover:text-red-500 p-2 font-black transition-colors" title="Clear">✕</button>
                )}
                <button onClick={handleRefine} disabled={isLoading || isRefining || !prompt.trim()} className="text-[#DB24E3] hover:text-white p-2 hover:bg-[#DB24E3]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed group border border-transparent hover:border-[#DB24E3] rounded" title="Enhance prompt with AI">
                    <SparklesIcon className={`w-5 h-5 ${isRefining ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>

        <div className={`flex items-end justify-between gap-2 pt-2 animate-fade-in ${!hasImage && !onGenerate ? 'hidden' : ''}`}>
            {hasImage && (
              <button 
                 onClick={() => setStackEffect(!stackEffect)}
                 className={`h-[42px] px-3 text-[10px] font-bold uppercase tracking-widest border transition-colors btn-interactive flex items-center justify-center ${stackEffect ? 'bg-[#54A970] text-black border-[#54A970]' : 'text-gray-500 border-[#222] hover:text-white bg-[#0A0A0A]'}`}
                 title={stackEffect ? "Effects will stack on previous edit" : "Effects will apply to original image"}
              >
                 {stackEffect ? 'Stack: ON' : 'Stack: OFF'}
              </button>
            )}

            <div className="flex-1 flex gap-2 overflow-hidden">
              {hasImage && (
                <button onClick={handleApplyClick} className="flex-1 h-[42px] bg-[#0A0A0A] border-2 border-[#54A970] text-[#54A970] font-black px-2 uppercase italic tracking-widest transition-all duration-300 hover:bg-[#54A970] hover:text-black hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed btn-sakuga text-[10px] sm:text-xs truncate" disabled={isActionDisabled}>
                    <span className="skew-x-[10deg] block">{applyButtonLabel}</span>
                </button>
              )}
              
              {onGenerate && (
                <button onClick={handleGenerateClick} className={`flex-1 h-[42px] bg-gradient-to-r from-[#DB24E3] to-[#54A970] text-white font-black px-2 uppercase italic tracking-widest transition-all duration-300 hover:shadow-[0_0_30px_rgba(219,36,227,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed btn-sakuga text-[10px] sm:text-xs truncate`} disabled={isActionDisabled}>
                    <span className="skew-x-[10deg] block">{generateButtonLabel}</span>
                </button>
              )}
            </div>

            <select 
                value={aspectRatio} 
                onChange={(e) => setAspectRatio(e.target.value)}
                className="h-[42px] bg-[#0A0A0A] border border-[#222] text-white text-[10px] font-bold uppercase p-2 outline-none focus:border-[#54A970] transition-colors cursor-pointer hover:border-gray-500 w-[70px]"
            >
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
            </select>
        </div>
    </div>
  );
};