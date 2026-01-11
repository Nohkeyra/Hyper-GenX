/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PanelScanner } from './Spinner';
import { GenerationRequest } from '../App';
import { CollapsibleSection } from './CollapsibleSection';
import { TypeIcon } from './icons';

interface TypographicPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage: boolean;
  setViewerInstruction: (text: string | null) => void;
}

// ======================== CONSTANTS & DATA ========================
const PROMPT_SUFFIX = ", scalable vector style, 8k ultra sharp, professional typography mockup";
const NEGATIVE_PROMPT = "--no messy, blurry, pixelated, low quality, amateur, ugly, deformed, text errors, watermark, signature";

const BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', prompt: 'clean white background' },
  { value: 'black', label: 'Black', prompt: 'pure black background' },
  { value: 'transparent', label: 'Transparent', prompt: 'transparent background, isolated' },
  { value: 'gradient', label: 'Gradient', prompt: 'subtle gradient background' },
  { value: 'texture', label: 'Texture', prompt: 'textured paper background' },
  { value: 'none', label: 'No Background', prompt: 'no background, isolated on transparent' }
];

const STYLE_INTENSITY_RANGE = { min: 0.5, max: 3.0, step: 0.25 };

const presetGroups = {
  "🏆 PREMIUM LUXURY": [
    {
      name: 'Art Deco Opulence',
      description: '1920s Gatsby-era luxury with geometric gold filigree.',
      applyPrompt: 'Transform the MAIN SUBJECT into an Art Deco opulent monogram style.',
      genPrompt: 'Art Deco opulent monogram of "{TEXT}", geometric symmetry, sunburst motifs, gold leaf filigree, black and gold palette, roaring twenties luxury, intricate metalwork effect',
      negativePrompt: '--no modern, minimalist, simple, flat, colorful',
      colorPalette: ['#D4AF37', '#000000', '#FFFFFF'], // Gold, Black, White
      tags: ['LUXURY', 'ART DECO', 'GOLD'],
      difficulty: 3,
      styleWeight: 1.4
    },
    {
      name: 'Diamond Cut Crystal',
      description: 'Faceted like a precious gemstone with brilliant refraction.',
      applyPrompt: 'Transform the MAIN SUBJECT into a diamond-cut crystal monogram.',
      genPrompt: 'Diamond-cut crystal monogram of "{TEXT}", multi-faceted glass effect, brilliant refraction, luxury jewelry aesthetic, clean sharp edges, transparent with light reflections',
      negativePrompt: '--no opaque, matte, dull, flat, simple',
      colorPalette: ['#FFFFFF', '#E6F7FF', '#CCCCCC'],
      tags: ['CRYSTAL', 'LUXURY', 'JEWELRY'],
      difficulty: 2,
      styleWeight: 1.3
    },
    {
      name: 'Guilloché Engraving',
      description: 'Banknote-level precision engraving with mechanical patterns.',
      applyPrompt: 'Transform the MAIN SUBJECT into a Guilloché engraved monogram.',
      genPrompt: 'Guilloché engraved monogram of "{TEXT}", intricate mechanical patterns, fine line engraving, currency-level precision, luxury watch dial aesthetic, metallic sheen',
      negativePrompt: '--no digital, simple, rough, amateur',
      colorPalette: ['#C0C0C0', '#FFD700', '#000000'],
      tags: ['ENGRAVED', 'LUXURY', 'PRECISION'],
      difficulty: 3,
      styleWeight: 1.5
    },
    {
      name: 'Marble Veined',
      description: 'Luxury stone material with natural veining.',
      applyPrompt: 'Transform the MAIN SUBJECT into a marble veined monogram.',
      genPrompt: 'Marble veined monogram of "{TEXT}", Carrara marble texture, natural stone veins, luxury material treatment, subtle veining through letters, classical elegance',
      negativePrompt: '--no plastic, uniform, flat, colorful',
      colorPalette: ['#F5F5F5', '#808080', '#E0E0E0'],
      tags: ['MARBLE', 'LUXURY', 'CLASSICAL'],
      difficulty: 2,
      styleWeight: 1.2
    }
  ],

  "🌀 MODERN TECH": [
    {
      name: 'Neo-Brutalist Concrete',
      description: 'Raw, textured architectural aesthetic.',
      applyPrompt: 'Transform the MAIN SUBJECT into a neo-brutalist concrete monogram.',
      genPrompt: 'Neo-brutalist concrete monogram of "{TEXT}", raw textured surface, exposed aggregate effect, architectural typography, muted earth tones, structural integrity',
      negativePrompt: '--no smooth, polished, decorative, ornate',
      colorPalette: ['#7F7F7F', '#4A4A4A', '#E0E0E0'],
      tags: ['BRUTALIST', 'ARCHITECTURAL', 'RAW'],
      difficulty: 2,
      styleWeight: 1.4
    },
    {
      name: 'Holographic Chrome',
      description: 'Futuristic iridescent surfaces with rainbow metallic sheen.',
      applyPrompt: 'Transform the MAIN SUBJECT into a holographic chrome monogram.',
      genPrompt: 'Holographic chrome monogram of "{TEXT}", rainbow metallic sheen, futuristic surface treatment, liquid metal effect, shifting colors, cyberpunk aesthetic',
      negativePrompt: '--no matte, dull, flat, simple colors',
      colorPalette: ['Rainbow gradient', '#000000'],
      tags: ['FUTURISTIC', 'CHROME', 'TECH'],
      difficulty: 2,
      styleWeight: 1.6
    },
    {
      name: 'Neural Network',
      description: 'AI/neural connection aesthetic with glowing pathways.',
      applyPrompt: 'Transform the MAIN SUBJECT into a neural network monogram.',
      genPrompt: 'Neural network monogram of "{TEXT}", interconnected nodes and pathways, glowing connection lines, data flow visualization, blue/orange glow, AI aesthetic',
      negativePrompt: '--no organic, hand-drawn, simple, static',
      colorPalette: ['#00FFFF', '#FF00FF', '#000000'],
      tags: ['AI', 'TECH', 'FUTURISTIC'],
      difficulty: 3,
      styleWeight: 1.7
    },
    {
      name: 'Liquid Metal',
      description: 'Morphing mercury-like reflective forms.',
      applyPrompt: 'Transform the MAIN SUBJECT into a liquid metal monogram.',
      genPrompt: 'Liquid metal monogram of "{TEXT}", mercury pool effect, reflective liquid surface, organic melting forms, chrome reflections, morphing typography',
      negativePrompt: '--no solid, static, matte, dull',
      colorPalette: ['#C0C0C0', '#A0A0A0', '#000000'],
      tags: ['METAL', 'LIQUID', 'FUTURISTIC'],
      difficulty: 2,
      styleWeight: 1.5
    }
  ],

  "🎨 ARTISTIC EXPRESSIVE": [
    {
      name: 'Watercolor Bleed',
      description: 'Artistic paint diffusion with organic color gradients.',
      applyPrompt: 'Transform the MAIN SUBJECT into a watercolor bleed monogram.',
      genPrompt: 'Watercolor bleed monogram of "{TEXT}", soft pigment diffusion, paper texture visible, artistic brush strokes, organic color gradients, handmade aesthetic',
      negativePrompt: '--no digital, clean, precise, sharp',
      colorPalette: ['#4A90E2', '#50E3C2', '#B8E986'],
      tags: ['WATERCOLOR', 'ARTISTIC', 'HANDMADE'],
      difficulty: 2,
      styleWeight: 1.3
    },
    {
      name: 'Glass Mosaic',
      description: 'Stained glass window effect with jewel tones.',
      applyPrompt: 'Transform the MAIN SUBJECT into a glass mosaic monogram.',
      genPrompt: 'Glass mosaic monogram of "{TEXT}", leaded glass separation, stained glass effect, jewel-toned panes, light transmission glow, cathedral window aesthetic',
      negativePrompt: '--no opaque, flat, dull, simple',
      colorPalette: ['#FF6B6B', '#4ECDC4', '#8338EC'],
      tags: ['MOSAIC', 'GLASS', 'COLORFUL'],
      difficulty: 3,
      styleWeight: 1.6
    },
    {
      name: 'Charcoal Sketch',
      description: 'Raw artistic medium with textured paper.',
      applyPrompt: 'Transform the MAIN SUBJECT into a charcoal sketch monogram.',
      genPrompt: 'Charcoal sketch monogram of "{TEXT}", textured paper background, smudged edges, artistic roughness, black and white contrast, atelier aesthetic',
      negativePrompt: '--no clean, digital, colorful, smooth',
      colorPalette: ['#000000', '#7F7F7F', '#FFFFFF'],
      tags: ['SKETCH', 'ARTISTIC', 'TEXTURED'],
      difficulty: 2,
      styleWeight: 1.4
    },
    {
      name: 'Kinetic Motion Blur',
      description: 'Dynamic sense of movement with speed trails.',
      applyPrompt: 'Transform the MAIN SUBJECT into a kinetic motion blur monogram.',
      genPrompt: 'Kinetic motion blur monogram of "{TEXT}", dynamic movement trails, speed lines, energetic typography, overlapping transparencies, futuristic velocity',
      negativePrompt: '--no static, still, simple, flat',
      colorPalette: ['#FF005C', '#00D2FF', '#000000'],
      tags: ['DYNAMIC', 'MOTION', 'ENERGETIC'],
      difficulty: 2,
      styleWeight: 1.5
    }
  ],

  "🌿 ORGANIC NATURAL": [
    {
      name: 'Pressed Botanical',
      description: 'Nature-infused letters with leaves and flowers.',
      applyPrompt: 'Transform the MAIN SUBJECT into a pressed botanical monogram.',
      genPrompt: 'Pressed botanical monogram of "{TEXT}", leaves and flowers forming letters, herbarium aesthetic, organic shapes, natural color palette, eco-friendly feel',
      negativePrompt: '--no geometric, mechanical, synthetic, neon',
      colorPalette: ['#2E8B57', '#DAA520', '#8B4513'],
      tags: ['BOTANICAL', 'NATURE', 'ORGANIC'],
      difficulty: 3,
      styleWeight: 1.4
    },
    {
      name: 'Driftwood Carved',
      description: 'Natural wood texture with beach-worn edges.',
      applyPrompt: 'Transform the MAIN SUBJECT into a driftwood carved monogram.',
      genPrompt: 'Driftwood carved monogram of "{TEXT}", weathered wood texture, natural grain visible, beach-worn edges, organic shaping, coastal aesthetic',
      negativePrompt: '--no plastic, metal, glossy, perfect',
      colorPalette: ['#8B4513', '#D2691E', '#F4A460'],
      tags: ['WOOD', 'NATURAL', 'COASTAL'],
      difficulty: 2,
      styleWeight: 1.3
    },
    {
      name: 'Kintsugi Gold Repair',
      description: 'Japanese broken pottery art with gold repair.',
      applyPrompt: 'Transform the MAIN SUBJECT into a Kintsugi monogram.',
      genPrompt: 'Kintsugi monogram of "{TEXT}", broken ceramic pieces, gold lacquer repair lines, Japanese art aesthetic, beautiful imperfections, philosophical design',
      negativePrompt: '--no perfect, uniform, simple, modern',
      colorPalette: ['#D4AF37', '#FFFFFF', '#000000'],
      tags: ['JAPANESE', 'ART', 'PHILOSOPHICAL'],
      difficulty: 3,
      styleWeight: 1.6
    },
    {
      name: 'Topographic Map',
      description: 'Geographic contour lines with earthy palette.',
      applyPrompt: 'Transform the MAIN SUBJECT into a topographic map monogram.',
      genPrompt: 'Topographic map monogram of "{TEXT}", elevation contour lines, map legend details, geographic aesthetic, earthy color palette, exploration theme',
      negativePrompt: '--no flat, simple, colorful, abstract',
      colorPalette: ['#8B7355', '#2F2F2F', '#98C1D9'],
      tags: ['MAP', 'GEOGRAPHIC', 'EARTHY'],
      difficulty: 2,
      styleWeight: 1.4
    }
  ],

  "📜 VINTAGE HERITAGE": [
    {
      name: 'Wax Seal',
      description: 'Classic stamped impression on parchment.',
      applyPrompt: 'Transform the MAIN SUBJECT into a wax seal monogram.',
      genPrompt: 'Wax seal monogram of "{TEXT}", stamped wax texture, broken edges, authentic seal impression, deep crimson color, parchment paper background',
      negativePrompt: '--no digital, clean, modern, colorful',
      colorPalette: ['#8B0000', '#DAA520', '#F5DEB3'],
      tags: ['VINTAGE', 'CLASSICAL', 'SEAL'],
      difficulty: 2,
      styleWeight: 1.3
    },
    {
      name: 'Victorian Ironwork',
      description: 'Ornate wrought iron patterns like garden gates.',
      applyPrompt: 'Transform the MAIN SUBJECT into Victorian ironwork monogram.',
      genPrompt: 'Victorian ironwork monogram of "{TEXT}", ornate wrought iron patterns, blacksmith aesthetic, scrollwork and flourishes, architectural metalwork, garden gate style',
      negativePrompt: '--no simple, minimal, colorful, modern',
      colorPalette: ['#000000', '#696969', '#D3D3D3'],
      tags: ['VICTORIAN', 'IRONWORK', 'ORNAMENTAL'],
      difficulty: 3,
      styleWeight: 1.5
    },
    {
      name: 'Library Emboss',
      description: 'Classic leather book cover with gold foil.',
      applyPrompt: 'Transform the MAIN SUBJECT into a library embossed monogram.',
      genPrompt: 'Library emboss monogram of "{TEXT}", leather book cover texture, gold foil stamping, deep embossed impression, academic aesthetic, vintage library feel',
      negativePrompt: '--no flat, digital, simple, modern',
      colorPalette: ['#8B4513', '#D4AF37', '#000000'],
      tags: ['BOOK', 'ACADEMIC', 'EMBOSSED'],
      difficulty: 2,
      styleWeight: 1.4
    }
  ],

  "🎭 PLAYFUL YOUTHFUL": [
    {
      name: 'Inflatable Pool Toy',
      description: '3D plastic inflatable look with bright colors.',
      applyPrompt: 'Transform the MAIN SUBJECT into an inflatable pool toy monogram.',
      genPrompt: 'Inflatable pool toy monogram of "{TEXT}", shiny plastic surface, air valve detail, bright summer colors, 3D inflated look, playful beach aesthetic',
      negativePrompt: '--no serious, dark, flat, matte',
      colorPalette: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
      tags: ['PLAYFUL', 'SUMMER', '3D'],
      difficulty: 2,
      styleWeight: 1.3
    },
    {
      name: 'Glow Stick Neon',
      description: 'Rave/party aesthetic with glowing edges.',
      applyPrompt: 'Transform the MAIN SUBJECT into a glow stick neon monogram.',
      genPrompt: 'Glow stick neon monogram of "{TEXT}", bright neon colors, glowing edges, dark background contrast, rave party aesthetic, vibrant energy',
      negativePrompt: '--no dull, muted, daytime, flat',
      colorPalette: ['#00FF00', '#FF00FF', '#FFFF00'],
      tags: ['NEON', 'PARTY', 'GLOWING'],
      difficulty: 2,
      styleWeight: 1.5
    },
    {
      name: 'Bubble Gum',
      description: 'Chewy, shiny, playful candy aesthetic.',
      applyPrompt: 'Transform the MAIN SUBJECT into a bubble gum monogram.',
      genPrompt: 'Bubble gum monogram of "{TEXT}", sticky shiny surface, stretchy texture, bright pink color, playful typography, candy store aesthetic',
      negativePrompt: '--no serious, dark, professional, flat',
      colorPalette: ['#FF69B4', '#FFFFFF', '#FFB6C1'],
      tags: ['CANDY', 'PLAYFUL', 'SHINY'],
      difficulty: 2,
      styleWeight: 1.4
    }
  ],

  "✨ SPECIAL EFFECTS": [
    {
      name: 'Anaglyph 3D',
      description: 'Red/blue 3D glasses vintage effect.',
      applyPrompt: 'Transform the MAIN SUBJECT into an anaglyph 3D monogram.',
      genPrompt: 'Anaglyph 3D monogram of "{TEXT}", red and blue color separation, vintage 3D effect, retro cinema aesthetic, offset layers, comic book style',
      negativePrompt: '--no flat, single color, modern 3D',
      colorPalette: ['#FF0000', '#0000FF', '#000000'],
      tags: ['3D', 'RETRO', 'VINTAGE'],
      difficulty: 2,
      styleWeight: 1.6
    },
    {
      name: 'Hologram Glitch',
      description: 'Digital artifact aesthetic with scan lines.',
      applyPrompt: 'Transform the MAIN SUBJECT into a hologram glitch monogram.',
      genPrompt: 'Hologram glitch monogram of "{TEXT}", digital projection effect, scan line artifacts, color channel separation, digital distortion, cyber aesthetic',
      negativePrompt: '--no clean, perfect, analog, natural',
      colorPalette: ['#00FFFF', '#FF00FF', '#00FF00'],
      tags: ['GLITCH', 'DIGITAL', 'CYBER'],
      difficulty: 3,
      styleWeight: 1.7
    }
  ]
};

const allPresets = Object.values(presetGroups).flat();

// ======================== CUSTOM HOOKS ========================
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(initialValue) && !Array.isArray(parsed)) {
          console.warn(`LocalStorage item for key "${key}" is not an array, falling back to initial value.`);
          return initialValue;
        }
        return parsed;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
};

// ======================== ERROR BOUNDARY ========================
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

class TypographyErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: React.PropsWithChildren<{}>;
  
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Typography Panel Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-500 text-red-300">
          <h3 className="font-bold">Typography Panel Error</h3>
          <p className="text-sm">Please refresh the panel.</p>
          {this.state.error && (
            <p className="text-xs mt-2 opacity-70">{this.state.error.message}</p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// ======================== MAIN COMPONENT ========================
const TypographicPanel: React.FC<TypographicPanelProps> = ({
  onRequest,
  isLoading,
  hasImage,
  setViewerInstruction
}) => {
  const [userInput, setUserInput] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [styleIntensity, setStyleIntensity] = useState(1.0);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('white');
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [customColor1, setCustomColor1] = useState('#DB24E3');
  const [customColor2, setCustomColor2] = useState('#54A970');
  
  const [recentPresets, setRecentPresets] = useLocalStorage<string[]>('typographyRecentPresets', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('typographyFavorites', []);

  const selectedPreset = useMemo(() => 
    allPresets.find(p => p.name === selectedPresetName), 
    [selectedPresetName]
  );
  
  const debouncedText = useDebounce(userInput, 500);

  const preparePrompt = useCallback((template: string, text: string, backgroundOption: string) => {
    const trimmed = text.trim();
    if (!trimmed) return template.replace('{TEXT}', 'ABC');
    
    const escaped = trimmed.replace(/[{}]/g, '');
    const finalText = template.includes('uppercase') || template.includes('UPPERCASE') 
      ? escaped.toUpperCase()
      : escaped;
    
    const background = BACKGROUND_OPTIONS.find(bg => bg.value === backgroundOption)?.prompt || 'clean white background';
    const coloredTemplate = useCustomColors 
      ? template.replace(/(gold|black|white|silver|chrome)/gi, '')
      : template;
    
    let finalPrompt = coloredTemplate.replace('{TEXT}', finalText);
    
    if (useCustomColors) {
      finalPrompt += `, primary color ${customColor1}, secondary color ${customColor2}`;
    }
    
    finalPrompt += `, ${background}`;
    
    if (selectedPreset?.styleWeight) {
      const weight = (selectedPreset.styleWeight * styleIntensity).toFixed(2);
      finalPrompt += `, style weight:${weight}`;
    }
    
    return finalPrompt;
  }, [useCustomColors, customColor1, customColor2, selectedPreset, styleIntensity]);

  const buildFinalPrompt = useCallback((isApply: boolean = false) => {
    if (!selectedPreset || !userInput.trim()) return '';
    
    const template = isApply ? selectedPreset.applyPrompt : selectedPreset.genPrompt;
    const basePrompt = preparePrompt(template, userInput, selectedBackground);
    
    let finalPrompt = basePrompt;
    
    if (isApply) {
      finalPrompt += ` The final design should incorporate the letters "${userInput.trim()}".`;
    }
    
    finalPrompt += PROMPT_SUFFIX;
    
    const negative = selectedPreset.negativePrompt || NEGATIVE_PROMPT;
    finalPrompt += ` ${negative}`;
    
    return finalPrompt;
  }, [selectedPreset, userInput, selectedBackground, preparePrompt]);

  const handleGenerate = useCallback(() => {
    if (hasImage && !window.confirm("This will start a new session and clear your current image and history. Are you sure?")) {
      return;
    }
    if (!selectedPreset || !userInput.trim()) return;
    
    const finalPrompt = buildFinalPrompt(false);
    onRequest({ type: 'typography', prompt: finalPrompt, forceNew: true, aspectRatio });
  }, [hasImage, selectedPreset, userInput, buildFinalPrompt, onRequest, aspectRatio]);
  
  const handleApply = useCallback(() => {
    if (!selectedPreset || !userInput.trim() || !hasImage) return;
    
    const finalPrompt = buildFinalPrompt(true);
    onRequest({ type: 'typography', prompt: finalPrompt, forceNew: false, aspectRatio });
  }, [selectedPreset, userInput, hasImage, buildFinalPrompt, onRequest, aspectRatio]);

  const handlePresetSelect = useCallback((presetName: string) => {
    setSelectedPresetName(presetName);
    setRecentPresets(prev => [presetName, ...prev.filter(p => p !== presetName)].slice(0, 5));
  }, [setRecentPresets]);

  const toggleFavorite = useCallback((presetName: string) => {
    setFavorites(prev => prev.includes(presetName) ? prev.filter(p => p !== presetName) : [...prev, presetName]);
  }, [setFavorites]);

  const getPreviewText = useCallback(() => {
    if (!selectedPreset || !userInput.trim()) return userInput || 'ABC';
    if (selectedPreset.name.includes('Monogram')) return userInput.slice(0, 3).toUpperCase();
    return userInput;
  }, [selectedPreset, userInput]);

  const validateText = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 1) return { valid: false, message: 'Enter at least 1 character', warning: false };
    if (trimmed.length > 50) return { valid: false, message: 'Maximum 50 characters', warning: false };
    const problematicChars = /[@#$%^&*()+=<>?/\\|{}[\]]/;
    if (problematicChars.test(trimmed)) {
      return { valid: true, message: 'Special characters may affect generation quality', warning: true };
    }
    return { valid: true, message: '', warning: false };
  }, []);

  const validation = validateText(userInput);
  const isActionDisabled = isLoading || !userInput.trim() || !selectedPresetName || !validation.valid;

  useEffect(() => {
    if (!userInput.trim()) setViewerInstruction("TYPE YOUR TEXT IN THE PANEL");
    else if (!selectedPreset) setViewerInstruction("NOW SELECT A TYPOGRAPHIC STYLE");
    else setViewerInstruction(null);
    return () => setViewerInstruction(null);
  }, [userInput, selectedPreset, setViewerInstruction]);

  useEffect(() => {
    if (userInput.trim() && !selectedPresetName) {
      const firstGroup = Object.values(presetGroups)[0];
      if (firstGroup?.[0]) handlePresetSelect(firstGroup[0].name);
    }
  }, [userInput, selectedPresetName, handlePresetSelect]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isActionDisabled) {
        e.preventDefault();
        if (hasImage) handleApply();
        else handleGenerate();
      }
      if (e.key === 'Escape') {
        setSelectedPresetName('');
        setPreviewMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActionDisabled, hasImage, handleApply, handleGenerate]);

  return (
    <div className="flex flex-col h-full relative bg-[#050505]">
      {isLoading && <PanelScanner />}
      
      {previewMode && selectedPreset && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" 
          onClick={() => setPreviewMode(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Style preview modal"
        >
          <div 
            className="bg-[#111] border-2 border-[#DB24E3] p-6 max-w-md rounded-lg" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white font-bold">Style Preview</h4>
              <button onClick={() => setPreviewMode(false)} className="text-gray-400 hover:text-white text-xl" aria-label="Close preview">✕</button>
            </div>
            <div className="bg-black p-8 flex items-center justify-center min-h-[200px] border border-[#333]">
              <div className="text-white text-4xl font-bold opacity-70">{getPreviewText()}</div>
            </div>
            <p className="text-gray-400 text-sm mt-4 text-center">{selectedPreset.description}</p>
            <div className="flex justify-center mt-4">
              <button onClick={() => { setPreviewMode(false); handleGenerate(); }} className="px-4 py-2 bg-[#DB24E3] text-white text-sm font-bold rounded hover:bg-[#C41FD0]">Generate This Style</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-[#1A1A1A] bg-black/90 backdrop-blur-sm flex flex-col sm:flex-row items-stretch gap-4 z-10 shadow-lg">
        <div className="flex-1 flex items-stretch gap-2">
          {hasImage ? (
            <>
              <button onClick={handleApply} disabled={isActionDisabled} className="btn-sakuga flex-1 h-12 bg-black border-2 border-[#54A970] text-[#54A970] font-black uppercase italic tracking-widest transition-all duration-300 hover:bg-[#54A970] hover:text-black hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-xs truncate min-w-0" aria-label="Apply selected style to current image">
                {isLoading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-[#54A970]/30 border-t-[#54A970] rounded-full animate-spin" /><span className="skew-x-[10deg]">Applying...</span></div> : <span className="skew-x-[10deg] block">Apply Style</span>}
              </button>
              <button onClick={handleGenerate} disabled={isActionDisabled} className="btn-sakuga flex-1 h-12 bg-gradient-to-r from-[#DB24E3] to-[#54A970] text-white font-black uppercase italic tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(219,36,227,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-xs truncate min-w-0" aria-label="Generate new image with selected style">
                {isLoading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span className="skew-x-[10deg]">Generating...</span></div> : <span className="skew-x-[10deg] block">Generate New</span>}
              </button>
            </>
          ) : (
            <button onClick={handleGenerate} disabled={isActionDisabled} className="btn-sakuga flex-1 h-12 bg-gradient-to-r from-[#DB24E3] to-[#54A970] text-white font-black uppercase italic tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(219,36,227,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Generate typography image">
              {isLoading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span className="skew-x-[10deg]">Generating...</span></div> : <span className="skew-x-[10deg] block">Generate</span>}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {recentPresets.length > 0 && (
          <CollapsibleSection title="RECENTLY USED" startOpen={false}>
            <div className="flex flex-wrap gap-2 mb-4">
              {recentPresets.map(presetName => {
                const preset = allPresets.find(p => p.name === presetName);
                if (!preset) return null;
                return <button key={presetName} onClick={() => handlePresetSelect(presetName)} className={`px-3 py-2 text-xs rounded border ${selectedPresetName === presetName ? 'bg-[#DB24E3]/20 border-[#DB24E3] text-white' : 'bg-[#222] border-[#333] text-gray-300 hover:bg-[#333]'}`} aria-label={`Select ${preset.name} style`} aria-pressed={selectedPresetName === presetName}>{preset.name}</button>;
              })}
            </div>
          </CollapsibleSection>
        )}
        
        {favorites.length > 0 && (
          <CollapsibleSection title="⭐ FAVORITES" startOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {allPresets.filter(preset => favorites.includes(preset.name)).map(preset => (
                  <button key={preset.name} onClick={() => handlePresetSelect(preset.name)} disabled={isLoading} className={`p-3 text-left border-2 rounded-sm transition-all duration-200 relative min-h-[60px] touch-manipulation active:scale-95 ${selectedPresetName === preset.name ? 'bg-[#DB24E3]/10 border-[#DB24E3]' : 'bg-[#111] border-transparent hover:border-[#333]'}`} aria-label={`Select ${preset.name} style`} aria-pressed={selectedPresetName === preset.name}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1"><TypeIcon className={`w-4 h-4 ${selectedPresetName === preset.name ? 'text-[#DB24E3]' : 'text-gray-600'}`} /></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`text-xs font-bold uppercase tracking-wider ${selectedPresetName === preset.name ? 'text-white' : 'text-gray-400'}`}>{preset.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(preset.name); }} className="text-yellow-500 hover:text-yellow-300 text-sm" aria-label={favorites.includes(preset.name) ? `Remove ${preset.name} from favorites` : `Add ${preset.name} to favorites`}>{favorites.includes(preset.name) ? '★' : '☆'}</button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">{preset.description}</p>
                        {preset.tags && <div className="flex flex-wrap gap-1 mt-2">{preset.tags.map(tag => <span key={tag} className="text-[8px] px-1 py-0.5 bg-[#222] text-gray-400">{tag}</span>)}</div>}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </CollapsibleSection>
        )}
        
        {Object.entries(presetGroups).map(([groupName, presets]) => (
          <CollapsibleSection title={groupName} key={groupName} startOpen={groupName.includes("PREMIUM")}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Array.isArray(presets) && presets.map(preset => (
                <button key={preset.name} onClick={() => handlePresetSelect(preset.name)} disabled={isLoading} className={`p-3 text-left border-2 rounded-sm transition-all duration-200 relative min-h-[60px] touch-manipulation active:scale-95 ${selectedPresetName === preset.name ? 'bg-[#DB24E3]/10 border-[#DB24E3]' : 'bg-[#111] border-transparent hover:border-[#333]'}`} aria-label={`Select ${preset.name} style`} aria-pressed={selectedPresetName === preset.name}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1"><TypeIcon className={`w-4 h-4 ${selectedPresetName === preset.name ? 'text-[#DB24E3]' : 'text-gray-600'}`} /></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className={`text-xs font-bold uppercase tracking-wider ${selectedPresetName === preset.name ? 'text-white' : 'text-gray-400'}`}>{preset.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(preset.name); }} className="text-gray-500 hover:text-yellow-500 text-sm" aria-label={favorites.includes(preset.name) ? `Remove ${preset.name} from favorites` : `Add ${preset.name} to favorites`}>{favorites.includes(preset.name) ? '★' : '☆'}</button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{preset.description}</p>
                      {preset.tags && <div className="flex flex-wrap gap-1 mt-2">{preset.tags.map(tag => <span key={tag} className="text-[8px] px-1 py-0.5 bg-[#222] text-gray-400">{tag}</span>)}</div>}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">{[1, 2, 3].map(level => <div key={level} className={`w-2 h-2 rounded-full ${level <= (preset.difficulty || 1) ? 'bg-gray-600' : 'bg-gray-900'}`} />)}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">{preset.styleWeight}x</span>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPresetName(preset.name); setPreviewMode(true); }} className="text-[10px] text-gray-500 hover:text-white" aria-label={`Preview ${preset.name} style`}>Preview</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>
        ))}
      </div>
      
      <div className="p-4 sm:p-6 border-t border-[#1A1A1A] bg-black/95 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-black italic tracking-tighter text-white uppercase" style={{fontFamily: 'Koulen'}}>Typography Lab</h3>
          <div className="text-xs text-gray-500">{allPresets.length} styles</div>
        </div>
        <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} maxLength={50} placeholder="TYPE YOUR TEXT (e.g., ABC)" className={`w-full h-20 bg-[#0A0A0A] border-2 ${validation.warning ? 'border-yellow-500' : !validation.valid ? 'border-red-500' : 'border-[#222]'} focus:border-[#DB24E3] text-white p-4 text-center text-2xl font-black focus:ring-0 focus:outline-none transition disabled:opacity-60 placeholder-gray-700 font-mono resize-none`} disabled={isLoading} aria-label="Text input for typography" aria-invalid={!validation.valid} aria-describedby={validation.message ? "text-validation" : undefined} />
        {validation.message && <div id="text-validation" className={`text-xs mt-1 flex items-center gap-1 ${validation.warning ? 'text-yellow-500' : 'text-red-500'}`} role="alert">{validation.warning ? '⚠️' : '❌'} {validation.message}</div>}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} disabled={isLoading} className="h-12 bg-[#0A0A0A] border border-[#222] text-white text-xs font-bold uppercase p-2 outline-none focus:border-[#DB24E3] transition-colors cursor-pointer hover:border-gray-500 w-24" aria-label="Select aspect ratio">
            <option value="1:1">1:1</option><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="4:3">4:3</option><option value="3:4">3:4</option>
          </select>
          <select value={selectedBackground} onChange={(e) => setSelectedBackground(e.target.value)} disabled={isLoading} className="h-12 bg-[#0A0A0A] border border-[#222] text-white text-xs font-bold uppercase p-2 outline-none focus:border-[#DB24E3] transition-colors cursor-pointer hover:border-gray-500 w-32" aria-label="Select background type">
            {BACKGROUND_OPTIONS.map(bg => <option key={bg.value} value={bg.value}>{bg.label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:block">Intensity:</span>
            <input type="range" min={STYLE_INTENSITY_RANGE.min} max={STYLE_INTENSITY_RANGE.max} step={STYLE_INTENSITY_RANGE.step} value={styleIntensity} onChange={(e) => setStyleIntensity(parseFloat(e.target.value))} disabled={isLoading} className="w-24 accent-[#DB24E3]" aria-label="Style intensity" aria-valuemin={STYLE_INTENSITY_RANGE.min} aria-valuemax={STYLE_INTENSITY_RANGE.max} aria-valuenow={styleIntensity} />
            <span className="text-xs text-white w-8">{styleIntensity.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={useCustomColors} onChange={(e) => setUseCustomColors(e.target.checked)} className="accent-[#DB24E3]" aria-label="Use custom colors" />
              <span className="text-xs text-gray-400">Custom Colors</span>
            </label>
            {useCustomColors && <div className="flex gap-1"><input type="color" value={customColor1} onChange={(e) => setCustomColor1(e.target.value)} className="w-6 h-6 cursor-pointer" aria-label="Primary color" /><input type="color" value={customColor2} onChange={(e) => setCustomColor2(e.target.value)} className="w-6 h-6 cursor-pointer" aria-label="Secondary color" /></div>}
          </div>
        </div>
      </div>
      
      {selectedPreset && (
        <div className="px-4 py-2 border-t border-[#1A1A1A] bg-black/80">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Selected: <span className="text-white font-bold">{selectedPreset.name}</span></div>
            <div className="text-[10px] text-gray-500">Difficulty: {"★".repeat(selectedPreset.difficulty)}{"☆".repeat(3-selectedPreset.difficulty)}</div>
          </div>
        </div>
      )}
      
      <div className="text-[10px] text-gray-600 px-4 py-2 border-t border-[#1A1A1A] hidden sm:block">
        💡 Shortcuts: <kbd className="px-1 py-0.5 bg-[#111] border border-[#333]">Ctrl/Cmd + Enter</kbd> to generate • <kbd className="px-1 py-0.5 bg-[#111] border border-[#333]">Esc</kbd> to clear
      </div>
    </div>
  );
};

const TypographicPanelWithErrorBoundary: React.FC<TypographicPanelProps> = (props) => (
  <TypographyErrorBoundary>
    <TypographicPanel {...props} />
  </TypographyErrorBoundary>
);

export default TypographicPanelWithErrorBoundary;