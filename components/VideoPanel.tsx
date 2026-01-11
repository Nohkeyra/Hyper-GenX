/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BoltIcon, PlayIcon, InfinityIcon, ShieldOffIcon, ZapIcon, SparklesIcon } from './icons';
import { GenerationRequest } from '../App';
import { refineImagePrompt } from '../services/geminiService';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
};

const loadingMessages = [
  "Connecting to rendering farm...",
  "Allocating GPU resources...",
  "Parsing prompt vectors...",
  "Initializing motion sequence...",
  "Synthesizing primary frames...",
  "Interpolating motion vectors...",
  "Applying post-processing effects...",
  "Encoding final frames...",
  "Finalizing video stream..."
];

interface VideoPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage: boolean;
  setViewerInstruction: (text: string | null) => void;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({ 
  onRequest, 
  isLoading,
  hasImage,
  setViewerInstruction
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoFps, setVideoFps] = useState(60);
  const [motionStrength, setMotionStrength] = useState(0.8);
  const [isRefining, setIsRefining] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const timerRef = useRef<number>();
  const messageIntervalRef = useRef<number>();
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Set viewer instruction on mount
  useEffect(() => {
    setViewerInstruction("DESCRIBE YOUR ANIMATION IN DETAIL");
    return () => setViewerInstruction(null);
  }, [setViewerInstruction]);

  // Update viewer instruction based on prompt
  useEffect(() => {
    if (prompt.trim().length > 100) {
      setViewerInstruction("READY TO GENERATE - ADJUST SETTINGS BELOW");
    } else if (prompt.trim()) {
      setViewerInstruction("ADD MORE DETAILS FOR BETTER RESULTS");
    } else {
      setViewerInstruction("DESCRIBE YOUR ANIMATION IN DETAIL");
    }
  }, [prompt, setViewerInstruction]);

  // Loading effects
  useEffect(() => {
    if (isLoading) {
      setElapsedTime(0);
      setCurrentLoadingMessage(loadingMessages[0]);
      let messageIndex = 0;
      
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      messageIntervalRef.current = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setCurrentLoadingMessage(loadingMessages[messageIndex]);
      }, 3000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, [isLoading]);

  const handleRefine = useCallback(async () => {
    if (!prompt.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refined = await refineImagePrompt(prompt);
      setPrompt(refined);
      // Focus back on textarea
      promptTextareaRef.current?.focus();
    } catch (e) {
      console.error("Refinement failed", e);
      // Could add toast notification here
    } finally {
      setIsRefining(false);
    }
  }, [prompt, isRefining]);

  const handleGenerateVideo = useCallback(() => {
    if (hasImage && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    if (prompt.trim()) {
      onRequest({
        type: 'video_animation',
        prompt: prompt.trim(),
        forceNew: !hasImage,
        aspectRatio: aspectRatio,
        duration: videoDuration,
        fps: videoFps,
        motionStrength: motionStrength,
        seed: Date.now(),
      });
      setShowConfirmation(false);
    }
  }, [prompt, hasImage, showConfirmation, onRequest, aspectRatio, videoDuration, videoFps, motionStrength]);

  const handleUnrestrictedMode = useCallback(() => {
    setMotionStrength(1.0);
    setVideoFps(60);
    setVideoDuration(8);
    setAspectRatio('16:9');
    // Focus prompt after setting
    promptTextareaRef.current?.focus();
  }, []);

  const handleDurationChange = useCallback((value: number) => {
    setVideoDuration(value);
  }, []);

  const handleMotionChange = useCallback((value: number) => {
    setMotionStrength(value);
  }, []);

  const handleFpsChange = useCallback((fps: number) => {
    setVideoFps(fps);
  }, []);

  const isActionDisabled = isLoading || !prompt.trim();

  // Close confirmation on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmation) {
        setShowConfirmation(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showConfirmation]);

  return (
    <div className="flex flex-col h-full relative bg-gradient-to-b from-[#0A0A0A] to-black text-gray-100">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#111] to-black border border-red-500/30 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-3">Animate Current Image?</h3>
            <p className="text-gray-300 mb-6">
              This will use your current image as a starting point for the new animation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateVideo}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-yellow-600 text-white hover:opacity-90 transition-opacity"
              >
                Animate Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 animate-fade-in">
          <div className="w-16 h-16 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500"></div>
          <h3 className="text-xl font-black text-red-500 uppercase italic tracking-wider mt-4" style={{fontFamily: 'Koulen'}}>
            Engaged VEO Render Engine...
          </h3>
          <p className="text-gray-400 text-xs font-mono mt-2 max-w-xs">
            This is a complex operation and may take several minutes. Please do not close this tab.
          </p>
          <div className="mt-4 w-full max-w-xs text-center">
            <div className="w-full bg-red-900/50 h-2 overflow-hidden relative border border-red-500/50">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-yellow-500"
                style={{ width: `${Math.min(100, (elapsedTime / 120) * 100)}%` }}
              ></div>
            </div>
            <p className="text-lg font-mono text-yellow-300 mt-2">{formatTime(elapsedTime)}</p>
            <p className="text-xs font-mono text-cyan-400 mt-2 h-4">{currentLoadingMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center pb-2 border-b border-red-500/40 mb-3">
          <h3 className="text-xl font-black italic tracking-tighter text-white uppercase" style={{ fontFamily: 'Koulen' }}>
            <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
              <BoltIcon className="w-5 h-5 text-red-500 animate-pulse" />
              <span>ANIMATION PRO STUDIO</span>
            </div>
          </h3>
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-red-900/20 border border-red-500/30 rounded-sm">
              <InfinityIcon className="w-3 h-3 text-red-400" />
              <span className="text-xs font-mono font-bold text-red-300">UNLIMITED</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/20 border border-yellow-500/30 rounded-sm">
              <ShieldOffIcon className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-mono font-bold text-yellow-300">NO LIMITS</span>
            </div>
          </div>
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-green-400/90 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>ANIMATION PRO MODE ACTIVATED</span>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4 pb-4">
        <div className="p-3 bg-gradient-to-r from-red-900/10 to-yellow-900/10 border border-red-500/20 rounded-sm">
          <p className="text-xs font-mono text-red-300">
            <ZapIcon className="w-3 h-3 inline mr-1" />
            UNRESTRICTED MODE: ALL CONTENT ALLOWED — NO FILTERS, NO CENSORSHIP
          </p>
        </div>

        <div className="relative">
          <textarea
            ref={promptTextareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={4000}
            placeholder="Describe your animation in detail... What should happen? What style? Any specific movements?"
            className="w-full min-h-[120px] md:min-h-[140px] bg-[#050505] border-2 border-red-500/30 text-white p-4 focus:ring-0 focus:outline-none transition-all disabled:opacity-50 text-sm placeholder-red-400/40 font-mono resize-none rounded-sm focus:border-red-500 shadow-lg shadow-red-500/5"
            disabled={isLoading}
            style={{ fontFamily: 'monospace' }}
            aria-label="Animation prompt"
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs font-mono text-red-400">
              {prompt.length}/4000 characters
            </div>
            <button
              onClick={handleRefine}
              disabled={isLoading || isRefining || !prompt.trim()}
              className="text-sm px-3 py-1 bg-gradient-to-r from-red-900/50 to-yellow-900/50 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500 rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label="Enhance prompt with AI"
            >
              <SparklesIcon className={`w-4 h-4 ${isRefining ? 'animate-spin' : ''}`} />
              Enhance
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-red-500/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-mono uppercase text-gray-400">
                  Duration: {videoDuration}s
                </label>
                <button 
                  onClick={() => handleDurationChange(8)}
                  className="text-xs font-mono text-red-400 hover:text-red-300"
                  disabled={isLoading}
                >
                  CINEMATIC
                </button>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="1"
                value={videoDuration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-red-500 [&::-webkit-slider-thumb]:to-yellow-500"
                disabled={isLoading}
                aria-label="Animation duration"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>2s</span>
                <span>15s</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-mono uppercase text-gray-400">
                  Motion: {motionStrength.toFixed(1)}
                </label>
                <button 
                  onClick={handleUnrestrictedMode}
                  className="text-xs font-mono text-red-400 hover:text-red-300"
                  disabled={isLoading}
                >
                  MAX POWER
                </button>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={motionStrength}
                onChange={(e) => handleMotionChange(Number(e.target.value))}
                className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-red-500 [&::-webkit-slider-thumb]:to-yellow-500"
                disabled={isLoading}
                aria-label="Motion strength"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Subtle</span>
                <span>Extreme</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                Frame Rate
              </label>
              <div className="flex gap-1">
                {[ { fps: 24, label: 'CINEMATIC' }, { fps: 30, label: 'SMOOTH' }, { fps: 60, label: 'MAX FPS' } ].map(({ fps, label }) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => handleFpsChange(fps)}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-sm transition-all ${videoFps === fps ? 'bg-gradient-to-r from-red-600 to-yellow-600 text-white border border-red-500' : 'bg-[#0A0A0A] border border-[#333] text-gray-400 hover:text-white hover:border-red-500/50'}`}
                    disabled={isLoading}
                    aria-label={`${fps} FPS - ${label}`}
                  >
                    <div className="font-mono">{fps}</div>
                    <div className="text-[8px] opacity-70">{label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={isLoading}
                className="w-full h-[42px] bg-[#0A0A0A] border border-[#333] text-white text-xs font-mono uppercase p-2 outline-none focus:border-red-500 transition-colors cursor-pointer hover:border-red-500 rounded-sm appearance-none pr-10"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ef4444'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
                  backgroundPosition: 'right 0.75rem center', 
                  backgroundRepeat: 'no-repeat', 
                  backgroundSize: '1em' 
                }}
                aria-label="Aspect ratio"
              >
                <option value="16:9">16:9 WIDESCREEN</option>
                <option value="1:1">1:1 SQUARE</option>
                <option value="9:16">9:16 VERTICAL</option>
                <option value="21:9">21:9 CINEMATIC</option>
                <option value="4:3">4:3 CLASSIC</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button Footer */}
      <div className="p-4 sm:p-6 border-t border-red-500/20">
        <button
          onClick={handleGenerateVideo}
          disabled={isActionDisabled}
          className="w-full h-[55px] font-black px-4 uppercase italic tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(239,68,68,0.7)] disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 text-white border border-red-500 text-lg group relative overflow-hidden rounded-sm"
          aria-label="Generate animation"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="flex flex-col items-center justify-center">
            <span className="skew-x-[10deg] block flex items-center justify-center gap-3 relative">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  <span className="animate-pulse">GENERATING...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-6 h-6" />
                  <span>{hasImage ? 'Animate Current Image' : 'Generate Unrestricted'}</span>
                  <BoltIcon className="w-5 h-5 text-yellow-300" />
                </>
              )}
            </span>
            <div className="text-[9px] font-mono normal-case tracking-widest text-yellow-300/70 mt-1 skew-x-[10deg] opacity-80">
              NO LIMITS • NO CENSORSHIP
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};