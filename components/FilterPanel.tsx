/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useEffect } from 'react';
import { PanelHeader } from './PanelHeader';
import { PanelScanner } from './Spinner';
import { GenerationRequest } from '../App';
import { CollapsibleSection } from './CollapsibleSection';
import { PaletteIcon } from './icons';

interface FilterPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  setViewerInstruction: (text: string | null) => void;
}

const presetGroups = {
  "BIOMECHANICAL & SURREAL": [
    { name: 'Gigeresque Symbiote', description: 'Fuses the subject with biomechanical, H.R. Giger-inspired textures.', prompt: 'Reconstruct the main subject as a Gigeresque biomechanical symbiote. Fuse flesh with a polished obsidian exoskeleton, pulsating bioluminescent tubing, and intricate, alien machinery. The aesthetic is dark, surreal, and hyper-detailed with a wet, glossy texture and cinematic lighting.' },
    { name: 'Mycelial Network Corruption', description: 'Overgrows the scene with glowing, fungal, cordyceps-like networks.', prompt: 'Corrupt the entire image with a bioluminescent mycelial network. The subject\'s form should be partially overtaken by intricate, glowing fungal structures and cordyceps-like growths. The atmosphere is beautiful but unsettling, a fusion of organic decay and alien life, with visible spores floating in the air.' },
    { name: 'Deconstructed Glass Anatomy', description: 'Re-imagines the subject as an anatomical model made of fragmented, translucent colored glass.', prompt: 'Deconstruct the subject into an anatomical sculpture made of fragmented, translucent colored glass. Show the inner workings as a beautiful, abstract network of light and form, as if a medical diagram was designed by a master glassblower. The style is clean, sharp, and surreal, isolated against a dark, minimalist background.' },
  ],
  "TEMPORAL GLITCH & ANOMALY": [
    { name: 'VHS Data-Bleed Anomaly', description: 'A "broken memory from the future" feel with 90s VHS errors and futuristic data streams.', prompt: 'Degrade the image with severe VHS data-bleed artifacts. Introduce analog tracking errors, heavy chroma noise, a flickering 90s camcorder timestamp overlay, and mix it with corrupted futuristic data streams and glitched-out hexadecimal code. The aesthetic is a temporal paradox.' },
    { name: 'Baroque-Punk Overload', description: 'A clash of historical opulence and futuristic body modification.', prompt: 'Create a Baroque-Punk anomaly. Fuse the subject\'s modern form with ornate, gilded Baroque ornamentation, intricate gold-leaf filigree, and cracked marble textures. Simultaneously, integrate exposed cybernetic implants, glowing conduits, and polished chrome. The lighting is dramatic chiaroscuro.' },
  ],
  "ESOTERIC & ARCANE": [
    { name: 'Arcane Sigil Overload', description: 'Overlays the image with complex, glowing esoteric sigils and occult geometric patterns.', prompt: 'Overload the image with an intricate network of glowing arcane sigils and occult geometric patterns. The symbols should appear to be projected onto the scene or emanating directly from the subject as raw energy. Use a vibrant, magical color palette like ethereal blues, purples, and golds against a dark, moody background.' },
    { name: 'Neo-Tarot Card Inlay', description: 'Reframes the subject as the central figure on a hyper-detailed, futuristic tarot card.', prompt: 'Re-frame the entire image as a hyper-detailed, futuristic tarot card. The subject is the central figure. Add an ornate, sci-fi inspired border with inlaid circuit patterns and holographic foil accents. Integrate esoteric symbols and give the card a title, such as "XIX: THE SUN" or "XV: THE DEVIL", rendered in a modern, sharp typeface.' },
  ],
  "CINEMATIC & MOODY": [
    { name: 'HDR Cinematic', description: 'Epic dynamic range, filmic lighting, deep contrast for dramatic impact.', prompt: 'Transform the image with an HDR cinematic style. Exaggerate the dynamic range with advanced tonemapping, apply intense filmic color grading (teal and orange), and create a dramatic, larger-than-life atmosphere. Enhance local contrast. Do not alter the subject.' },
    { name: 'Moody Grain Authentique', description: 'Dark moody tones with authentic film grain and natural imperfections.', prompt: 'Transform the image into an authentic, moody film photograph. Apply a visible 35mm film grain texture, desaturate the colors for a somber feel, and crush the blacks for an emotional, raw, and candid look. Add subtle light leaks.' },
    { name: 'Cyberpunk Noir', description: 'High contrast, deep shadows, and neon reflections on rainy, futuristic city streets.', prompt: 'Reconstruct the scene in a Cyberpunk Noir style. Use high contrast, deep shadows, and illuminate the subject with vibrant cyan and magenta neon reflections on rainy, futuristic city streets. Add atmospheric haze and chromatic aberration.' },
    { name: 'Candid Raw Lifestyle', description: 'Unfiltered natural moments, emotional authenticity, no polish.', prompt: 'Re-process the image to look like a candid, raw, lifestyle photograph from a 35mm camera. Use natural lighting, emphasize authentic skin textures and pores, and create a feeling of an unposed, captured moment. No airbrushing, no perfect smiles.' },
    { name: 'Editorial Luxury', description: 'Clean premium grading, balanced clarity, quiet sophistication.', prompt: 'Re-grade the entire image with a high-end editorial luxury look from a fashion magazine. Use clean, refined color palettes with subtle gold and earthy tones. Ensure perfect, yet natural skin tones and balanced clarity. The final output should feel sophisticated and premium.' },
  ],
  "ARTISTIC TRANSFORMATION": [
    { name: 'Digital Painting', description: 'Expressive brushwork, concept art style.', prompt: 'Re-imagine the entire photograph as a digital painting in the style of professional concept art. Use expressive, visible brushstrokes and artistic, dramatic lighting. Focus on mood and composition.' },
    { name: 'Van Gogh Oil Painting', description: 'Thick, swirling impasto brushstrokes and vibrant, emotional color.', prompt: 'Transform the entire image into an oil painting with the thick, swirling impasto brushstrokes and vibrant, emotional color palette of Vincent Van Gogh. The texture of the paint should be visible.' },
    { name: 'Blythe Doll Dream', description: 'Whimsical oversized eyes, porcelain skin, vintage doll fantasy.', prompt: 'Transform the main human subject into a Blythe doll. Exaggerate the eyes to be large, glossy, and soulful. Give the skin a smooth, perfect porcelain texture and apply soft, dreamy, vintage-style lighting.' },
    { name: 'Chibi Anime Burst', description: 'Cute exaggerated anime style, big sparkling eyes, playful vibe.', prompt: 'Transform the main subject into a cute Chibi anime character. Give them large, sparkling, expressive eyes, a small, compact body, and integrate them into a background with vibrant, dynamic energy and speed lines.' },
    { name: 'Ghibli-esque Anime', description: 'Lush, hand-painted backgrounds, vibrant colors, and a nostalgic, whimsical atmosphere.', prompt: 'Transform the image into a Ghibli-esque anime style. Use lush, hand-painted watercolor backgrounds, vibrant yet gentle colors, and a nostalgic, whimsical atmosphere with soft, warm lighting. The subject should be cel-shaded with clean lines.' },
    { name: 'Neo-Pop Illustration', description: 'Vibrant, abstract illustrations with flowing, ribbon-like color blocks and a high-contrast, energetic palette.', prompt: 'Transform the entire image into a vibrant, abstract neo-pop illustration. Use flowing, ribbon-like color blocks with a high-contrast, energetic palette (e.g., bold oranges, reds, blues, and greens). Eliminate traditional outlines, defining the form with the shapes of the color blocks themselves. The style should be modern, graphic, and reminiscent of a contemporary poster art.' },
  ],
  "SCI-FI & SURREAL": [
    { name: 'Neon Futuristic Glow', description: 'Vibrant neon accents, iridescent highlights, sci-fi energy.', prompt: 'Render the image in a neon futuristic style. The subject should be illuminated by vibrant, glowing cyan and magenta lights, casting reflections and creating a cyberpunk atmosphere. Add holographic interface elements.' },
    { name: 'Retrofuturism', description: '80s synthwave, neon chrome, nostalgic sci-fi.', prompt: 'Transform the image into an 80s retro-futuristic synthwave scene. Apply sunset gradients, neon grids, and chrome textures to the entire composition for a nostalgic sci-fi look. Add a lens flare.' },
    { name: 'Synthwave Pop Art (Neon Halftone)', description: 'Generates high-contrast, retro-futuristic illustrations in the style of 80s synthwave and pop art. Features a bold neon cyan and magenta palette, visible halftone dot textures, dramatic graphic lighting, and a powerful, iconic composition.', prompt: 'Transform the entire image into a high-contrast, retro-futuristic illustration in the style of 80s synthwave and pop art. Use a bold neon cyan and magenta color palette and incorporate visible halftone dot textures for a graphic, printed look. The lighting should be dramatic and graphic, creating a powerful and iconic composition.' },
    { name: 'Holographic Shift', description: 'Metallic rainbow iridescence, shifting holographic overlays.', prompt: 'Apply a holographic effect to the entire image. The subject and background should have a shimmering, iridescent, rainbow-like metallic sheen, with scan lines, as if being projected as a futuristic hologram.' },
    { name: 'Glitchy Glam 2026', description: 'Revived glitchcore: subtle digital artifacts, iridescent glam, asymmetric chaos.', prompt: 'Apply a "Glitchy Glam" aesthetic to the image. Introduce digital artifacts, chromatic aberration, pixel sorting, and iridescent neon sheens for a futuristic, corrupted, yet stylish look. Embrace intentional visual errors.' },
    { name: 'Solarized Infrared', description: 'Surreal inverted tones, shifting foliage to white/pink, and a dreamlike, otherworldly landscape.', prompt: 'Apply a surreal solarized infrared effect, emulating Aerochrome film. Invert tones, shift foliage and greens to white or pink, darken the sky, and create a dreamlike, otherworldly landscape.' },
    { name: 'Fantasy AR Glow', description: 'Grounded magical elements, soft ethereal light overlays.', prompt: 'Transform the image into a fantasy scene by adding a magical, ethereal glow. Ethereal light beams and sparkling, floating particles should illuminate the subject and their surroundings, creating a dreamlike, high-fantasy atmosphere.' }
  ],
  "ANALOG & VINTAGE": [
      { name: 'Retro Film Revival', description: 'Warm analog grain, faded nostalgic tones, fresh 2026 twist.', prompt: 'Transform the image to look like it was shot on retro 35mm film. Apply a warm color cast, visible film grain, subtle light leaks, and faded, milky highlights for a nostalgic, analog aesthetic. Soften focus slightly.' },
      { name: 'Chromatic Edge Max', description: 'Bold lens fringing, vibrant maximalist colors, intense pop.', prompt: 'Apply an extreme chromatic aberration effect to the entire image, especially around the high-contrast edges of the subject. Create strong RGB color splitting for a vibrant, maximalist, pop-art feel. This should look like a cheap, flawed lens.' }
  ],
};

const allPresets = Object.values(presetGroups).flat();

export const FilterPanel: React.FC<FilterPanelProps> = ({ onRequest, isLoading, setViewerInstruction }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');

  const selectedPreset = useMemo(() => allPresets.find(p => p.name === selectedPresetName), [selectedPresetName]);

  useEffect(() => {
    if (!selectedPreset) {
      setViewerInstruction("SELECT AN ARTISTIC FILTER TO SEE DETAILS");
    } else {
      setViewerInstruction(null);
    }
    return () => setViewerInstruction(null);
  }, [selectedPreset, setViewerInstruction]);

  const handleApply = (editedPrompt: string, useOriginal: boolean, aspectRatio: string) => {
    const finalPrompt = [selectedPreset?.prompt, editedPrompt].filter(Boolean).join('. ');
    if (finalPrompt.trim()) {
      onRequest({ type: 'filters', prompt: finalPrompt.trim(), useOriginal, aspectRatio });
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
        title="2026 Artistic Filters"
        onApply={handleApply}
        isLoading={isLoading}
        hasImage={true}
        prompt={userPrompt}
        setPrompt={setUserPrompt}
        onClear={handleClear}
        placeholder={selectedPresetName ? "Add details to the selected filter..." : "Describe a custom filter..."}
        applyButtonLabel="EXECUTE"
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {Object.entries(presetGroups).map(([groupName, presets]) => (
              <CollapsibleSection title={groupName} key={groupName} startOpen={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {presets.map(preset => (
                          <button 
                              key={preset.name} 
                              onClick={() => setSelectedPresetName(preset.name)}
                              disabled={isLoading}
                              className={`p-3 text-left border-2 rounded-sm transition-all duration-200 ${selectedPresetName === preset.name ? 'bg-red-500/10 border-red-500' : 'bg-[#111] border-transparent hover:border-[#333]'}`}
                          >
                              <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <PaletteIcon className={`w-4 h-4 ${selectedPresetName === preset.name ? 'text-red-400' : 'text-gray-600'}`} />
                                  </div>
                                  <div>
                                      <p className={`text-xs font-bold uppercase tracking-wider ${selectedPresetName === preset.name ? 'text-white' : 'text-gray-400'}`}>{preset.name}</p>
                                      <p className="text-[10px] text-gray-500">{preset.description}</p>
                                  </div>
                              </div>
                          </button>
                      ))}
                  </div>
              </CollapsibleSection>
          ))}
      </div>
    </div>
  );
};