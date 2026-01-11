/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, MagicWandIcon, BoltIcon } from './icons';
import { refineImagePrompt, describeImageForPrompt, generateRealtimePreview } from '../services/geminiService';
import { GenerationRequest } from '../App';
import { PanelScanner } from './Spinner';

interface FluxPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage?: boolean;
  currentImageFile?: File | null;
  setViewerInstruction: (text: string | null) => void;
  fluxPrompt: string;
  setFluxPrompt: (prompt: string) => void;
  setPreviewImageUrl: (url: string | null) => void;
}

export const FluxPanel: React.FC<FluxPanelProps> = ({ 
    onRequest, 
    isLoading, 
    hasImage, 
    currentImageFile, 
    setViewerInstruction,
    fluxPrompt,
    setFluxPrompt,
    setPreviewImageUrl
}) => {
  const [isRefining, setIsRefining] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stackEffect, setStackEffect] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [chaosMode, setChaosMode] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(1);
  
  // Neural Canvas State
  const [livePreview, setLivePreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const debounceTimeout = useRef<number | null>(null);

  // Mobile detection for touch-friendly interactions
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    // Detect touch device for mobile optimizations
    const checkTouchDevice = () => {
      setIsTouchDevice(('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    };
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  useEffect(() => {
    if (batchSize > 1) {
      setViewerInstruction(`NEURAL GRID: GENERATING ${batchSize} VARIATIONS...`);
    } else {
      setViewerInstruction(null);
    }
    return () => setViewerInstruction(null);
  }, [batchSize, setViewerInstruction]);

  useEffect(() => {
    // Debounced effect for live preview
    if (livePreview && fluxPrompt.trim() && !isLoading) {
      setIsPreviewLoading(true);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = window.setTimeout(async () => {
        try {
          const url = await generateRealtimePreview(fluxPrompt);
          if (url) {
            setPreviewImageUrl(url);
          }
        } catch (error) {
          console.error('Preview generation failed:', error);
          setPreviewImageUrl(null);
        } finally {
          setIsPreviewLoading(false);
        }
      }, isTouchDevice ? 1000 : 750); // Longer debounce for mobile
    } else {
      setPreviewImageUrl(null);
    }

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [fluxPrompt, livePreview, isLoading, setPreviewImageUrl, isTouchDevice]);

  const handleAction = (forceNew: boolean) => {
    if (forceNew && hasImage) {
      if (!window.confirm("This will start a new session and clear your current image and history. Are you sure you want to generate a new image?")) {
        return;
      }
    }

    if (!fluxPrompt.trim()) return;
    
    onRequest({ 
      type: 'flux', 
      prompt: fluxPrompt.trim(), 
      useOriginal: !stackEffect, 
      forceNew, 
      aspectRatio, 
      isChaos: chaosMode, 
      batchSize 
    });
  }

  const handleRefine = async () => {
    if (!fluxPrompt.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refinedPrompt = await refineImagePrompt(fluxPrompt);
      setFluxPrompt(refinedPrompt);
    } catch (error) { 
      console.error("Refinement failed", error);
      alert('Failed to refine prompt. Please try again.');
    } finally { 
      setIsRefining(false); 
    }
  };

  const handleAnalyze = async () => {
    if (!currentImageFile || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const analysis = await describeImageForPrompt(currentImageFile);
      setFluxPrompt(prev => prev ? `${prev}, ${analysis}` : analysis);
    } catch (error) { 
      console.error("Analysis failed", error);
      alert('Failed to analyze image. Please try again.');
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const isActionDisabled = isLoading || !fluxPrompt.trim();

  return (
    <div className="flex flex-col h-full relative bg-[#050505]">
      {isLoading && <PanelScanner />}
      
      {/* Header - Fixed for mobile */}
      <div className="p-3 sm:p-4 md:p-6 border-b-2 border-[#1A1A1A] sticky top-0 bg-[#050505] z-10">
        <h2 className="text-lg sm:text-xl font-black italic tracking-tighter text-white uppercase" style={{fontFamily: 'Koulen'}}>
          FLUX ENGINE
        </h2>
        <p className="text-gray-500 text-xs font-mono mt-1">Describe an image to create or transform.</p>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {/* Prompt Area - Mobile optimized */}
        <div className="relative group">
          <textarea 
            value={fluxPrompt} 
            onChange={(e) => setFluxPrompt(e.target.value)} 
            maxLength={1000} 
            placeholder="A cinematic photo of a robot in a rainy city..." 
            className="w-full bg-[#0A0A0A] border-2 text-white p-3 sm:p-4 pr-10 sm:pr-12 focus:ring-0 focus:outline-none transition-all disabled:opacity-60 text-sm placeholder-gray-600 font-sans rounded-sm resize-none h-28 sm:h-32 min-h-[112px] border-[#222] focus:border-[#54A970]" 
            disabled={isLoading}
            aria-label="Image description prompt"
            // Mobile optimizations
            rows={isTouchDevice ? 4 : 3}
            style={{ fontSize: isTouchDevice ? '16px' : '14px' }} // Prevent iOS zoom
          />
          <div className="absolute right-2 sm:right-3 top-2 sm:top-3 flex flex-col gap-1 sm:gap-2">
            {hasImage && currentImageFile && (
              <button 
                onClick={handleAnalyze} 
                disabled={isLoading || isAnalyzing} 
                className="text-gray-400 hover:text-white p-1.5 sm:p-2 transition-all disabled:opacity-30 border border-transparent hover:border-[#54A970] rounded bg-[#111]/80 active:scale-95 touch-manipulation" 
                title="Analyze and describe current image"
                aria-label="Analyze current image"
              >
                <MagicWandIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isAnalyzing ? 'animate-pulse text-[#54A970]' : ''}`} />
              </button>
            )}
            <button 
              onClick={handleRefine} 
              disabled={isLoading || isRefining || !fluxPrompt.trim()} 
              className="text-gray-400 hover:text-white p-1.5 sm:p-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded border border-transparent hover:border-[#54A970] bg-[#111]/80 active:scale-95 touch-manipulation" 
              title="Enhance description"
              aria-label="Enhance prompt"
            >
              <SparklesIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefining ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Settings - Responsive grid */}
        <div>
          <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Settings</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Live Preview Toggle */}
            <button 
              onClick={() => setLivePreview(!livePreview)} 
              disabled={isLoading || hasImage} 
              className={`h-9 sm:h-10 px-2 sm:px-3 text-[10px] xs:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 rounded-sm border touch-manipulation active:scale-95 ${livePreview ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-[#0A0A0A] border-[#222] text-gray-400 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`} 
              title="Neural Canvas: Live preview as you type"
              aria-pressed={livePreview}
            >
              {isPreviewLoading ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-green-400/50 border-t-green-400 rounded-full animate-spin"></div>
              ) : (
                <MagicWandIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
              <span className="truncate">{livePreview ? 'Preview ON' : 'Preview OFF'}</span>
            </button>
            
            {/* Aspect Ratio - Mobile friendly */}
            <div className="relative">
              <select 
                value={aspectRatio} 
                onChange={(e) => setAspectRatio(e.target.value)} 
                className="w-full h-9 sm:h-10 bg-[#0A0A0A] border border-[#222] text-white text-[10px] xs:text-xs font-bold uppercase pl-2 pr-6 outline-none focus:border-[#54A970] transition-colors cursor-pointer hover:border-gray-500 rounded-sm appearance-none touch-manipulation"
                style={{ fontSize: isTouchDevice ? '14px' : '12px' }} // Prevent iOS zoom
              >
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Wide</option>
                <option value="9:16">9:16 Tall</option>
                <option value="4:3">4:3 Retro</option>
                <option value="3:4">3:4 Portrait</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Chaos Mode */}
            <button 
              onClick={() => setChaosMode(!chaosMode)} 
              className={`h-9 sm:h-10 px-2 sm:px-3 text-[10px] xs:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 rounded-sm border touch-manipulation active:scale-95 ${chaosMode ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-[#0A0A0A] border-[#222] text-gray-400 hover:text-white'}`} 
              title="Chaos Mode: Increases randomness"
              aria-pressed={chaosMode}
            >
              <BoltIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
              <span className="truncate">{chaosMode ? 'Chaos ON' : 'Chaos OFF'}</span>
            </button>
            
            {/* Stack Mode - Only show when hasImage */}
            {hasImage && (
              <button 
                onClick={() => setStackEffect(!stackEffect)} 
                className={`h-9 sm:h-10 px-2 sm:px-3 text-[10px] xs:text-xs font-bold uppercase tracking-wider border transition-colors flex items-center justify-center rounded-sm touch-manipulation active:scale-95 ${stackEffect ? 'bg-[#54A970] text-black border-[#54A970]' : 'bg-[#0A0A0A] text-gray-400 border-[#222] hover:text-white'}`} 
                title={stackEffect ? "Stack on previous result" : "Apply to original image"}
                aria-pressed={stackEffect}
              >
                <span className="truncate">{stackEffect ? 'Stack: ON' : 'Stack: OFF'}</span>
              </button>
            )}
          </div>
          
          {/* Batch Size Control - Mobile hidden on small screens */}
          <div className="mt-3 hidden sm:block">
            <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Batch Size: {batchSize}</label>
            <input 
              type="range" 
              min="1" 
              max="4" 
              step="1"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#54A970]"
              disabled={isLoading}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer - Fixed for mobile */}
      <div className="p-3 sm:p-4 md:p-6 border-t-2 border-[#1A1A1A] bg-black/50 backdrop-blur-sm space-y-2 sticky bottom-0 z-10">
        {hasImage && (
          <button 
            onClick={() => handleAction(false)} 
            className="w-full h-10 sm:h-12 bg-black border-2 border-[#54A970] text-[#54A970] font-black uppercase italic tracking-widest transition-all duration-300 hover:bg-[#54A970] hover:text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed btn-sakuga text-xs sm:text-sm touch-manipulation" 
            disabled={isActionDisabled} 
            title="Modify the current image"
          >
            <span className="skew-x-[10deg] block">Transform Image</span>
          </button>
        )}
        <button 
          onClick={() => handleAction(true)} 
          className="w-full h-10 sm:h-12 bg-gradient-to-r from-[#54A970] to-[#2E8B57] text-white font-black uppercase italic tracking-widest transition-all duration-300 hover:shadow-[0_0_30px_rgba(84,169,112,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed btn-sakuga text-xs sm:text-sm border-t border-green-300/50 touch-manipulation" 
          disabled={isActionDisabled} 
          title={hasImage ? "Generate a completely new image" : "Generate image"}
        >
          <span className="skew-x-[10deg] block">
            {hasImage ? (isTouchDevice ? 'New Image' : 'Generate New Image') : 'Generate Image'}
          </span>
        </button>
      </div>
    </div>
  );
};