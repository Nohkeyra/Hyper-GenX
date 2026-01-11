/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { StyleExtractorIcon, CopyIcon, SendIcon, AlertIcon, CheckIcon } from './icons';
import { extractStyleFromImage } from '../services/geminiService';
import { PanelScanner } from './Spinner';

interface StyleExtractorPanelProps {
  isLoading: boolean;
  hasImage: boolean;
  currentImageFile: File | null;
  onSendToFlux: (prompt: string) => void;
}

export const StyleExtractorPanel: React.FC<StyleExtractorPanelProps> = ({ 
  isLoading, 
  hasImage, 
  currentImageFile, 
  onSendToFlux 
}) => {
  const [extractedPrompt, setExtractedPrompt] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  // Update character count when extracted prompt changes
  useEffect(() => {
    setCharCount(extractedPrompt.length);
  }, [extractedPrompt]);

  const handleExtract = useCallback(async () => {
    if (!currentImageFile || isExtracting) return;
    
    setIsExtracting(true);
    setError(null);
    setExtractedPrompt('');
    setCopySuccess(false);
    
    try {
      const result = await extractStyleFromImage(currentImageFile);
      if (result && result.trim().length > 0) {
        setExtractedPrompt(result);
      } else {
        setError("No style could be extracted from this image. Try a different image with clearer visual style.");
      }
    } catch (e) {
      console.error('Style extraction failed:', e);
      setError("Failed to extract style. The service may be unavailable or the image format is not supported.");
    } finally {
      setIsExtracting(false);
    }
  }, [currentImageFile, isExtracting]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!extractedPrompt.trim()) return;
    
    try {
      await navigator.clipboard.writeText(extractedPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError("Failed to copy to clipboard. Please try again.");
    }
  }, [extractedPrompt]);

  const handleSend = useCallback(() => {
    if (extractedPrompt.trim()) {
      onSendToFlux(extractedPrompt);
    }
  }, [extractedPrompt, onSendToFlux]);

  const canExtract = hasImage && currentImageFile && !isLoading && !isExtracting;
  const canCopyOrSend = extractedPrompt.trim().length > 0 && !isLoading;

  return (
    <div className="flex flex-col h-full relative bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
      {/* Loading overlay */}
      {(isLoading || isExtracting) && <PanelScanner />}
      
      {/* Top gradient line */}
      <div 
        className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#54A970] via-[#DB24E3] to-[#54A970] z-10 opacity-50"
        aria-hidden="true"
      />
      
      {/* Header */}
      <div className="p-4 sm:p-6 text-center">
        <StyleExtractorIcon 
          className="w-16 h-16 text-[#DB24E3] mx-auto mb-4 drop-shadow-[0_0_15px_rgba(219,36,227,0.5)]" 
          aria-label="Style Extractor Icon"
        />
        <h3 
          className="text-2xl font-black italic tracking-tighter text-white uppercase mb-2" 
          style={{fontFamily: 'Koulen'}}
        >
          Style Extractor
        </h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Analyze any image and extract its visual style as a reusable AI prompt
        </p>
      </div>

      {/* Status Messages */}
      <div className="px-4 sm:px-6 mb-4">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-sm p-3 mb-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {!hasImage && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-sm p-3 mb-4">
            <p className="text-blue-300 text-sm text-center">
              Upload an image first to extract its style
            </p>
          </div>
        )}
        
        {isExtracting && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-sm p-3 mb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-purple-300 text-sm">Analyzing image style...</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
        {extractedPrompt ? (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Extracted Style Prompt
                </label>
                <span className="text-xs text-gray-500 font-mono">
                  {charCount} chars
                </span>
              </div>
              
              <textarea 
                readOnly
                value={extractedPrompt}
                className="w-full min-h-[200px] md:min-h-[250px] bg-black/50 border border-gray-700 text-white p-4 text-sm font-mono resize-none rounded-sm focus:outline-none focus:ring-2 focus:ring-[#DB24E3]/50 focus:border-transparent"
                aria-label="Extracted style prompt"
                style={{ 
                  lineHeight: '1.5',
                  fontFamily: 'monospace, Consolas, Monaco, "Courier New"'
                }}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
              <button 
                onClick={handleCopyToClipboard}
                disabled={!canCopyOrSend || copySuccess}
                className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-white text-sm font-bold uppercase rounded-sm transition-all hover:border-[#DB24E3]/50 hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                aria-label={copySuccess ? "Prompt copied to clipboard" : "Copy prompt to clipboard"}
              >
                {copySuccess ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={handleSend}
                disabled={!canCopyOrSend}
                className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#DB24E3] to-[#9D24E3] border border-[#DB24E3] text-white text-sm font-bold uppercase rounded-sm transition-all hover:shadow-[0_0_20px_rgba(219,36,227,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Send extracted style to Flux"
              >
                <SendIcon className="w-4 h-4" />
                <span>Send to Flux</span>
              </button>
            </div>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#DB24E3]/10 to-[#54A970]/10 rounded-full flex items-center justify-center mb-6">
              <StyleExtractorIcon className="w-12 h-12 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm mb-2 max-w-sm">
              {hasImage 
                ? "Ready to extract visual style from your image"
                : "Upload an image to begin style extraction"
              }
            </p>
            <p className="text-gray-600 text-xs max-w-xs">
              Extracts colors, composition, textures, and artistic elements
            </p>
          </div>
        )}
      </div>

      {/* Extract Button Footer */}
      <div className="p-4 sm:p-6 border-t border-gray-800">
        <button
          onClick={handleExtract}
          disabled={!canExtract}
          className="w-full h-[55px] bg-gradient-to-r from-[#DB24E3] via-[#B424E3] to-[#9D24E3] text-white font-black px-4 uppercase italic tracking-widest rounded-sm transition-all duration-300 shadow-[0_0_20px_rgba(219,36,227,0.3)] hover:shadow-[0_0_30px_rgba(219,36,227,0.5)] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden"
          aria-label={hasImage ? "Extract style from current image" : "Upload an image first to extract style"}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="flex flex-col items-center justify-center">
            <span className="block flex items-center justify-center gap-3 relative">
              {isExtracting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  <span className="animate-pulse">EXTRACTING...</span>
                </>
              ) : (
                <>
                  <StyleExtractorIcon className="w-5 h-5" />
                  <span>EXTRACT STYLE FROM IMAGE</span>
                </>
              )}
            </span>
            <div className="text-[9px] font-mono normal-case tracking-widest text-white/70 mt-1 opacity-80">
              VISUAL DNA ANALYSIS
            </div>
          </div>
        </button>
        
        {/* Extraction stats */}
        {extractedPrompt && (
          <div className="mt-3 text-center">
            <div className="text-[10px] text-gray-500 font-mono">
              Style extracted: {extractedPrompt.split(' ').length} words, {charCount} characters
            </div>
          </div>
        )}
      </div>

      {/* Mobile optimization styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          textarea {
            font-size: 14px;
          }
        }
        
        @media (max-width: 768px) {
          button {
            min-height: 44px; /* Minimum touch target size for mobile */
          }
        }
      `}</style>
    </div>
  );
};
