/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useEffect } from 'react';
import { PanelHeader } from './PanelHeader';
import { PanelScanner } from './Spinner';
import { GenerationRequest } from '../App';
import { CollapsibleSection } from './CollapsibleSection';
import { VectorIcon } from './icons';

interface VectorArtPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage: boolean;
  setViewerInstruction: (text: string | null) => void;
}

const presetGroups = {
  "PROFESSIONAL": [
    { name: 'Logo & Flat Vector', description: 'Professional minimalist logo, scalable geometry.', applyPrompt: 'Transform the MAIN SUBJECT into a professional flat vector logo: minimalist geometric shapes, clean crisp lines, solid flat colors, isolated on white. NO shadows, NO gradients, NO 3D.', genPrompt: 'Minimalist flat vector logo design of' },
    { name: 'Cleanline', description: 'Minimalist, stroke-based, pure line art. Thin black outlines, no fills.', applyPrompt: 'Transform the MAIN SUBJECT into an ultra-minimalist, stroke-based, pure line-art vector. Use thin, perfect black outlines ONLY. Emphasize extreme negative space. NO fills, NO color, NO texture. The style should be elegant, with sharp mathematical contours, like a tattoo flash icon. Isolate on a plain white background.', genPrompt: 'Ultra-minimalist, stroke-based, pure line-art vector with thin perfect black outlines only, extreme negative space, no fills, no texture, tattoo flash icon style, isolated on a white background, of' },
    { name: 'Sticker Decal', description: 'Die-cut sticker with white border and subtle shadow.', applyPrompt: 'Transform the MAIN SUBJECT into a die-cut vinyl sticker: vibrant vector illustration, thick white contour border, subtle drop shadow, sticker aesthetic. Flat colors.', genPrompt: 'Die-cut vinyl sticker vector art with white border of' },
    { name: 'Architectural Digest', description: 'Clean, architectural illustration with a serene, travel-poster aesthetic.', applyPrompt: 'Re-imagine the MAIN SUBJECT as a clean architectural vector illustration. Use sharp, precise lines and a palette of flat colors with very subtle gradients for depth. The style should be serene and elegant, reminiscent of a high-end travel poster or a feature in an architectural digest. Emphasize clean composition and a tranquil atmosphere. Isolate on a plain white background.', genPrompt: 'A clean architectural vector illustration with sharp precise lines, a palette of flat colors with subtle gradients for depth, serene and elegant, high-end travel poster style, tranquil atmosphere, isolated on a white background, of' },
    { name: 'Bauhausgeo', description: 'Abstract constructivist portrait using overlapping geometric shapes.', applyPrompt: 'Reconstruct the MAIN SUBJECT as an abstract constructivist geometric portrait vector. The face must be built from overlapping circles, triangles, and rectangles. Use flat, bold, high-contrast colors. The style should be angular, mechanical, and cubist-inspired, a fusion of 1920s Russian avant-garde and modern flat design. Isolate on a plain white background.', genPrompt: 'An abstract constructivist geometric portrait vector, built from overlapping circles, triangles, and rectangles, using flat bold high-contrast colors, angular and mechanical, inspired by 1920s Russian avant-garde and modern flat design, isolated on a white background, of' },
    { name: 'Angularflat', description: 'Modern geometric portrait with sharp, fragmented face planes.', applyPrompt: 'Create an angular, flat, modern geometric portrait vector of the MAIN SUBJECT. Use sharp, fragmented face planes, bright flat color blocks with subtle gradients, and stylized features. The style is contemporary, inspired by Instagram, NFT, and Memphis revival aesthetics. Isolate on a plain white background.', genPrompt: 'An angular flat modern geometric portrait vector with sharp fragmented face planes, bright flat color blocks with subtle gradients, and stylized features, in a contemporary Instagram/NFT/Memphis revival style, isolated on a white background, of' },
    { name: 'Geoduotone', description: 'Minimalist geometric duotone silhouette with a 2-color split.', applyPrompt: 'Transform the MAIN SUBJECT into an ultra-clean, minimalist, geometric duotone silhouette vector. The design must be a bold 2-color split-face outline with perfect symmetry and extreme negative space. The style is a modern icon, tattoo, or stencil. Isolate on a plain white background.', genPrompt: 'An ultra-clean minimalist geometric duotone silhouette vector, a bold 2-color split-face outline, with perfect symmetry and extreme negative space, modern icon/tattoo/stencil style, isolated on a white background, of' },
  ],
  "EXPRESSIVE": [
    { name: 'Graphic Novel Realism', description: 'Detailed comic book style with strong linework and cel-shaded colors.', applyPrompt: 'Transform the MAIN SUBJECT into a detailed graphic novel illustration. Use clean, bold black linework for definition and a cel-shaded color palette with limited gradients. The style should be reminiscent of a high-quality comic book, with a focus on realism and clear composition. Isolate on a plain white background.', genPrompt: 'A detailed graphic novel illustration with clean bold black linework and a cel-shaded color palette, high-quality comic book style, focused on realism and clear composition, isolated on a white background, of' },
    { name: 'Rage Vector', description: 'Chaotic, abstract, expressionist vector with thick, messy strokes.', applyPrompt: 'Transform the MAIN SUBJECT into a chaotic abstract expressionist portrait in a furious painterly vector style. Use explosive, thick, overlapping impasto brush strokes and wild, messy, layered aggression. The dominant palette must be deep black, burning fiery orange, electric cobalt blue, and creamy beige/off-white. Ensure visible bristle marks, splatters, drips, and heavy texture with high dramatic contrast and no clean lines, conveying brutal dynamic movement. Isolate on a plain white background.', genPrompt: 'A chaotic abstract expressionist portrait in a furious painterly vector style, with explosive thick overlapping impasto brush strokes, wild messy layered aggression, using a dominant palette of deep black, burning fiery orange, electric cobalt blue, and creamy beige/off-white, high dramatic contrast, no clean lines, isolated on a white background, of' },
    { name: 'Naive Hand-Drawn', description: 'Childlike wobbly lines, imperfect human charm, sincere mess.', applyPrompt: 'Transform the MAIN SUBJECT into naive hand-drawn vector illustration with wobbly lines and imperfect shapes.', genPrompt: 'Naive hand-drawn imperfect vector illustration of' },
    { name: 'Doodle Chaos Playful', description: 'Joyful scribbles, energetic hand-drawn chaos.', applyPrompt: 'Transform the SUBJECT into a collage of playful, chaotic doodle vectors.', genPrompt: 'Playful doodle chaos vector art of' },
    { name: 'Imperfect Brush Stroke', description: 'Visible organic brushes, tactile rebellion against clean lines.', applyPrompt: 'Apply an imperfect, organic brush stroke vector style to the SUBJECT, showing texture and human touch.', genPrompt: 'Imperfect brush stroke tactile vector of' },
    { name: 'Organic Flow Nature', description: 'Fluid biophilic curves, grounded organic shapes inspired by nature.', applyPrompt: 'Render the MAIN SUBJECT in an organic flow, nature-inspired vector style with fluid, biophilic curves.', genPrompt: 'Organic flow nature-inspired vector art of' },
    { name: 'Wobbly Childlike Charm', description: 'Shaky naive fills and outlines for a sincere, playful warmth.', applyPrompt: 'Render the SUBJECT with a wobbly, childlike charm vector style, using shaky lines and imperfect fills.', genPrompt: 'Wobbly childlike charm vector art of' },
  ],
  "GEOMETRIC": [
    { name: 'Chunkpixel', description: 'Chunky vector pixel art. Large square blocks, hard edges, retro palette.', applyPrompt: 'Re-render the MAIN SUBJECT as chunky, deliberate true vector pixel art. Use large, perfect square blocks and hard edges. Adhere to a limited 8-32 color retro palette. Curves must be stair-stepped. The aesthetic is nostalgic 8-bit/16-bit NES/SNES arcade vibe, but infinitely scalable with NO blur. Isolate on a plain white background.', genPrompt: 'Chunky deliberate true vector pixel art with large perfect square blocks, hard edges, a limited 8-32 color retro palette, and stair-step curves, in a nostalgic 8-bit 16-bit NES SNES arcade vibe, infinitely scalable with no blur, isolated on a white background, of' },
    { name: 'Isofold', description: 'Isometric faux-3D layered paper/origami effect. Minimalist palette.', applyPrompt: 'Re-imagine the MAIN SUBJECT as an isometric faux-3D layered paper geometric vector. It should have the illusion of folded origami, with clean sharp edges, subtle depth shadows, and a minimalist white, black, and limited color palette. The style is modern and premium, like a logo. Isolate on a plain white background.', genPrompt: 'Isometric faux-3D layered paper geometric vector with a folded origami illusion, clean sharp edges, subtle depth shadows, and a minimalist white/black limited palette, in a modern premium logo style, isolated on a white background, of' },
    { name: 'Chunkisometric', description: 'Bold, chunky isometric 3D-shaded geometric emblem.', applyPrompt: 'Convert the MAIN SUBJECT into a bold, chunky, isometric 3D-shaded geometric letter emblem vector. Use bright contrasting colors, internal circuit-board patterns, and strong volume depth shading for a modern tech logo vibe. Isolate on a plain white background.', genPrompt: 'A bold, chunky, isometric 3D-shaded geometric letter emblem vector with bright contrasting colors, circuit-board internal patterns, and volume depth shading, in a modern tech logo vibe, isolated on a white background, of' },
    { name: 'Lo-Fi Low Poly Revival', description: 'Faceted triangles with nostalgic grit and flattened, non-photorealistic lighting.', applyPrompt: 'Reconstruct the MAIN SUBJECT in a lo-fi low poly vector style. The form should be defined by faceted, geometric triangles, but with added nostalgic grit, texture, and flattened, non-photorealistic lighting for a modern retro feel.', genPrompt: 'Lo-fi low poly revival vector illustration, faceted geometric triangles with nostalgic grit and texture, flattened lighting, of' },
    { name: 'Low Poly Grain Imperfect', description: 'Triangular mesh with tactile noise and uneven, organic shading.', applyPrompt: 'Transform the MAIN SUBJECT into a low-poly vector illustration, defined by a triangular mesh. Introduce tactile grain, noise, and uneven, human-like shading to give it an imperfect, organic feel.', genPrompt: 'Imperfect grain low poly vector art with a triangular mesh, tactile grain, noise, and organic shading, of' },
    { name: 'Flat-3D Hybrid', description: 'Clean 2D shapes blended with subtle 3D depth elements.', applyPrompt: 'Transform the MAIN SUBJECT into a flat-3D hybrid vector illustration. Blend clean, flat 2D shapes with subtle 3D depth elements like shadows, gradients, and extrusions for a modern, layered look.', genPrompt: 'Flat-3D hybrid depth vector illustration, blending clean 2D shapes with subtle 3D depth elements, of' },
  ],
  "VINTAGE": [
    { name: 'Engravevint', description: 'Vintage engraved steel-etching style with fine cross-hatching.', applyPrompt: 'Render the MAIN SUBJECT as a vintage engraved steel-etching vector portrait. Use ultra-fine parallel cross-hatching lines and high-density black linework for shading. The aesthetic should be 1800s newspaper, patent, or whiskey label retro. Isolate on a plain white background.', genPrompt: 'A vintage engraved steel-etching vector portrait with ultra-fine parallel cross-hatching lines, high-density black linework shading, in an 1800s newspaper/patent/whiskey label retro aesthetic, isolated on a white background, of' },
    { name: 'Vintagedist', description: 'Distressed negative-space poster with a bold black silhouette.', applyPrompt: 'Design the MAIN SUBJECT as a vintage distressed negative-space vector poster. It must be a bold, solid black silhouette on a plain white background, with fake wear, tear, and grunge texture applied to the silhouette. Create dramatic high contrast for a retro propaganda or movie lobby card feel.', genPrompt: 'A vintage distressed negative-space vector poster, a bold solid black silhouette with fake wear, tear, and grunge texture, dramatic high contrast, retro propaganda/movie lobby card feel, isolated on a white background, of' },
    { name: 'Textured Grain Tactile', description: 'Subtle grit and scanned textures for emotional depth.', applyPrompt: 'Apply a tactile vector style to the MAIN SUBJECT, with subtle grit and scanned textures for emotional depth.', genPrompt: 'Textured grain tactile vector art with subtle imperfections of' },
    { name: 'Linocut Print Rough', description: 'Carved texture revival, bold high-contrast cuts.', applyPrompt: 'Simulate a rough, carved linocut print vector style on the SUBJECT, with bold high-contrast cuts.', genPrompt: 'Rough linocut print revival vector of' },
    { name: 'Mixed Media Collage', description: 'Layered tactile collage elements, isolated on white.', applyPrompt: 'Render the MAIN SUBJECT as a mixed media collage vector illustration, using layered tactile paper and fabric elements. The subject MUST be isolated on a plain white background.', genPrompt: 'Mixed media collage vector illustration of a subject, using layered tactile paper and fabric elements, isolated on a plain white background:' },
  ],
  "PATTERN": [
    { name: 'Mandaline', description: 'Highly detailed, ornamental, symmetrical mandala linework.', applyPrompt: 'Transform the MAIN SUBJECT into a highly detailed, ornamental, symmetrical mandala vector. The design must feature intricate concentric layered fine linework and nested geometric sacred patterns with ultra-precise intersecting paths. Render in classic black on a plain white background for an ancient-modern fusion.', genPrompt: 'A highly detailed ornamental symmetrical mandala vector with intricate concentric layered fine linework, nested geometric sacred patterns, ultra-precise intersecting paths, classic black on a plain white background, ancient-modern fusion, of' },
    { name: 'Bandana Paisley', description: 'Subject rendered with intricate paisley line art, isolated on white.', applyPrompt: 'Transform the MAIN SUBJECT into a vector illustration with a classic Bandana Paisley pattern style. The subject MUST be isolated on a plain white background.', genPrompt: 'Vector art illustration of a subject with intricate bandana paisley details, isolated on a plain white background:' },
    { name: 'Maximal Minimal Bold', description: 'Clean minimalism with bold pops and masterful use of whitespace.', applyPrompt: 'Apply a maximal-minimal bold vector style to the SUBJECT, using high contrast and strategic negative space.', genPrompt: 'Maximum minimal bold vector illustration of' },
  ],
  "BOLD": [
    { name: 'Crimson Tear Propaganda', description: 'A high-impact, stylized portrait with bold crimson makeup accents in a stark propaganda poster style.', applyPrompt: 'Transform the MAIN SUBJECT into a bold vector portrait in a vintage propaganda poster style. The subject should look fierce, with heavy crimson red makeup that flows artistically down their face. Use a stark, dramatic contrast against a black background, with flat design, sharp edges, and minimal shading for high impact.', genPrompt: 'bold vector portrait of a fierce subject, heavy crimson red makeup that flows artistically down their face, stark black background, dramatic contrast, vintage propaganda poster style, flat design, sharp edges, minimal shading, high impact, cinematic lighting' },
    { name: 'X21 Rayauthe Directive', description: 'Retro-futurist propaganda poster with a 1970s dystopian aesthetic and glowing red-orange highlights.', applyPrompt: 'Transform the MAIN SUBJECT into a retro-futurist propaganda poster with a 1970s sci-fi dystopian aesthetic. The subject should appear serious, rendered in black with glowing red-orange highlights. Use a flat vector art style with high contrast and a powerful, constructivist-influenced composition.', genPrompt: 'retro-futurist propaganda poster of a serious subject in black with glowing red-orange highlights, 1970s sci-fi dystopian aesthetic, flat vector art, high contrast, constructivist influence, powerful composition' },
  ]
};

const allPresets = Object.values(presetGroups).flat();

export const VectorArtPanel: React.FC<VectorArtPanelProps> = ({ onRequest, isLoading, hasImage, setViewerInstruction }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');

  const selectedPreset = useMemo(() => allPresets.find(p => p.name === selectedPresetName), [selectedPresetName]);

  const placeholderText = useMemo(() => {
    if (hasImage) {
        return "Add extra details to the style...";
    }
    if (selectedPreset) {
        return `Subject for '${selectedPreset.name}' style...`;
    }
    return "e.g., 'A cyberpunk warrior'";
  }, [hasImage, selectedPreset]);

  useEffect(() => {
    if (!selectedPreset) {
      setViewerInstruction("SELECT A VECTOR STYLE TO SEE DETAILS");
    } else if (!hasImage && !userPrompt.trim()) {
      setViewerInstruction("NOW DESCRIBE THE SUBJECT TO GENERATE");
    }
    else {
      setViewerInstruction(null);
    }
    return () => setViewerInstruction(null);
  }, [selectedPreset, userPrompt, hasImage, setViewerInstruction]);

  const handleApply = (editedPrompt: string, useOriginal: boolean, aspectRatio: string) => {
    const finalPrompt = [selectedPreset?.applyPrompt, editedPrompt].filter(Boolean).join('. ');
    if (finalPrompt.trim()) onRequest({ type: 'vector', prompt: finalPrompt.trim(), useOriginal, aspectRatio });
  };

  const handleGenerate = (subjectPrompt: string, aspectRatio: string) => {
    if (subjectPrompt.trim()) {
        const finalPrompt = selectedPreset 
            ? `${selectedPreset.genPrompt.trim()} ${subjectPrompt.trim()}`
            : subjectPrompt.trim();
      onRequest({ type: 'vector', prompt: finalPrompt, forceNew: true, aspectRatio });
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
        title={hasImage ? "Vector Art Mode" : "Generate 2026 Vectors"}
        onApply={handleApply}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        hasImage={hasImage}
        prompt={userPrompt}
        setPrompt={setUserPrompt}
        onClear={handleClear}
        placeholder={placeholderText}
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
                                    <VectorIcon className={`w-4 h-4 ${selectedPresetName === preset.name ? 'text-red-400' : 'text-gray-600'}`} />
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