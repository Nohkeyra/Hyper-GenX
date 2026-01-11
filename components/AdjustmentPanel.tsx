/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useEffect } from 'react';
import { PanelHeader } from './PanelHeader';
import { PanelScanner } from './Spinner';
import { GenerationRequest } from '../App';

interface AdjustmentPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  setViewerInstruction: (text: string | null) => void;
}

export const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onRequest, isLoading, setViewerInstruction }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');
  
  const presets = [
    { name: 'Auto Enhance', description: 'Optimize exposure, contrast, and saturation.', prompt: 'Perform a professional-grade automatic adjustment of exposure, contrast, and color saturation. The goal is to create a balanced, natural, and clear image. Do not change the subject\'s identity, alter the composition, or add artistic styles.' },
    { name: 'Golden Hour', description: 'Warm sunset lighting with soft orange tones.', prompt: 'Re-light the image with the warm, soft, low-angle light of the golden hour. Enhance highlights with orange and yellow tones and soften shadows. Do not change the subject\'s identity or the core composition.' },
    { name: 'Dramatic B&W', description: 'High-contrast monochrome, deep shadows.', prompt: 'Convert the image to a high-contrast black and white. Deepen the blacks, brighten the whites, and maximize the tonal range for a dramatic, impactful look. Do not alter the composition.' },
    { name: 'Cinematic', description: 'Teal and orange grading, movie contrast.', prompt: 'Apply a professional cinematic color grade with teal in the shadows and orange in the highlights. Adjust contrast for a filmic look. Do not alter the subject or composition.' },
    { name: 'Blur Background', description: 'Realistic depth-of-field bokeh focus.', prompt: 'Apply a photorealistic depth-of-field blur (bokeh) to the background. The main subject must remain perfectly sharp and isolated from the blur. The transition should be natural.' },
    { name: 'HDR Pop', description: 'Vibrant dynamic range, detail recovery.', prompt: 'Apply a high-dynamic-range (HDR) effect to recover details in shadows and highlights. Increase local contrast and texture clarity for a sharp, "popping" look without creating unrealistic halos.' },
    { name: 'Matte Finish', description: 'Faded blacks, low contrast, editorial look.', prompt: 'Apply a matte photo finish by lifting the black levels to a faded grey and reducing overall contrast. Create a soft, film-like, editorial look. Do not alter colors significantly.' },
    { name: 'Cold Winter', description: 'Cool blue temperature, moody atmosphere.', prompt: 'Shift the color temperature of the image to be colder, with subtle blue and cyan tones in the shadows and midtones to evoke a winter atmosphere. Do not change the subject or composition.' },
  ];

  const selectedPreset = useMemo(() => presets.find(p => p.name === selectedPresetName), [selectedPresetName]);

  useEffect(() => {
    if (!selectedPreset) {
      setViewerInstruction("SELECT A STYLE TO SEE DETAILS");
    } else {
      setViewerInstruction(null);
    }
    // Cleanup instruction when component unmounts
    return () => setViewerInstruction(null);
  }, [selectedPreset, setViewerInstruction]);

  const handleApply = (editedPrompt: string, useOriginal: boolean, aspectRatio: string) => {
    const preset = presets.find(p => p.name === selectedPresetName);
    const finalPrompt = [preset?.prompt, editedPrompt].filter(Boolean).join('. ');
    
     if (finalPrompt.trim()) {
        onRequest({ type: 'adjust', prompt: finalPrompt.trim(), useOriginal, aspectRatio });
     }
  };

  const handleClear = () => {
    setSelectedPresetName('');
    setUserPrompt('');
  };

  return (
    <div className="flex flex-col h-full relative bg-[#050505]">
      {isLoading && <PanelScanner />}
      <div className="absolute top-0 left-0 w-full h-[1px] animate-sweep z-20 opacity-50"></div>

      <PanelHeader
        title="Professional Adjustments"
        onApply={handleApply}
        isLoading={isLoading}
        hasImage={true}
        prompt={userPrompt}
        setPrompt={setUserPrompt}
        onClear={handleClear}
        placeholder={selectedPresetName ? "Add extra details to the style..." : "Or describe a custom adjustment..."}
        applyButtonLabel="APPLY"
      />
      
      <div className="panel-padding overflow-y-auto p-6">
          <div className="mb-4">
              <select
                  value={selectedPresetName}
                  onChange={(e) => setSelectedPresetName(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-black border-2 border-[#222] focus:border-red-500 text-white p-4 focus:ring-0 focus:outline-none transition disabled:opacity-60 text-sm placeholder-gray-700 font-mono"
              >
                  <option value="" disabled>-- Select An Adjustment Style --</option>
                  {presets.map(preset => (
                      <option key={preset.name} value={preset.name}>
                          {preset.name}
                      </option>
                  ))}
              </select>
          </div>

          {selectedPreset && (
            <div className="min-h-[3rem] flex items-center justify-center text-center px-4 bg-black border border-[#222] relative animate-fade-in">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                <div>
                    <span className="font-black text-orange-500 mr-2 block sm:inline uppercase italic tracking-wide">{selectedPreset.name}:</span>
                    <span className="text-gray-400 text-xs sm:text-sm uppercase font-bold">{selectedPreset.description}</span>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};