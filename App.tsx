/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect, useMemo, useContext } from 'react';
import { saveState, loadState, nukeDatabase, clearState } from './services/persistence';
import { AppContext } from './context/AppContext';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';
import { FilterPanel } from './components/FilterPanel';
import { AdjustmentPanel } from './components/AdjustmentPanel';
// Fix: Use default import for TypographicPanel as it is exported as a default member.
import TypographicPanel from './components/TypographicPanel';
import { VectorArtPanel } from './components/VectorArtPanel';
import { FluxPanel } from './components/FluxPanel';
import { InpaintPanel } from './components/InpaintPanel';
// Fix: Add missing import for VideoPanel component.
import { VideoPanel } from './components/VideoPanel';
import { StyleExtractorPanel } from './components/StyleExtractorPanel';
import { CompareSlider } from './components/CompareSlider';
import { ZoomPanViewer } from './components/ZoomPanViewer';
// Fix: Add DownloadIcon to imports to resolve 'Cannot find name' error.
import { UndoIcon, RedoIcon, CompareIcon, XIcon, MagicWandIcon, PaletteIcon, SunIcon, EraserIcon, TypeIcon, VectorIcon, BoltIcon, DownloadIcon, UploadIcon, StyleExtractorIcon } from './components/icons';
import { SystemConfigWidget } from './components/SystemConfigWidget';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ImageUploadPlaceholder } from './components/ImageUploadPlaceholder';
import { StartScreen } from './components/StartScreen';
import * as geminiService from './services/geminiService';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL or File content");
    
    let mime = 'image/png';
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (mimeMatch && mimeMatch[1]) {
        mime = mimeMatch[1];
    }

    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

// Helper to "stabilize" a file by reading it into memory and recreating it.
const stabilizeFile = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
             const result = reader.result as string;
             resolve(dataURLtoFile(result, file.name));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

export type ActiveTab = 'filters' | 'adjust' | 'typography' | 'vector' | 'flux' | 'inpaint' | 'video_animation' | 'style_extractor';
export type GenerationRequest = {
    type: ActiveTab;
    prompt?: string;
    useOriginal?: boolean;
    forceNew?: boolean;
    aspectRatio?: string;
    isChaos?: boolean;
    batchSize?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    maskBase64?: string;
    referenceFile?: File;
    duration?: number;
    fps?: number;
    motionStrength?: number;
    unlimitedMode?: boolean;
    noCensorship?: boolean;
    autoEnhance?: boolean;
    seed?: number;
};

const AndroidOptimizations = () => {
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      const setVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      setVh();
      window.addEventListener('resize', setVh);
      window.addEventListener('orientationchange', setVh);
      document.body.classList.add('is-android');
      const handleResize = () => {
        if (window.visualViewport) {
          document.body.style.height = `${window.visualViewport.height}px`;
        }
      };
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
      }
      return () => {
        window.removeEventListener('resize', setVh);
        window.removeEventListener('orientationchange', setVh);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
        }
      };
    }
  }, []);
  
  return null;
};

const GlobalSakugaEffects: React.FC = () => {
  const [glitchEffect, setGlitchEffect] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    let animationId: number;
    const particles: any[] = [];
    const createParticle = () => {
      const colors = ['rgba(248, 19, 13, 0.8)', 'rgba(251, 70, 6, 0.8)', 'rgba(252, 247, 33, 0.7)'];
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1,
        maxLife: 2 + Math.random() * 3,
        size: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };
    for (let i = 0; i < 50; i++) createParticle();
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 1 / (60 * p.maxLife);
        if (p.life <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          particles.splice(i, 1);
          createParticle();
          continue;
        }
        ctx.globalAlpha = p.life * 0.8;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const glitchType = Math.floor(Math.random() * 3);
      setGlitchEffect(glitchType + 1);
      setTimeout(() => setGlitchEffect(0), 80 + Math.random() * 120);
    }, 5000 + Math.random() * 3000);
    const energyInterval = setInterval(() => setEnergyLevel(1), 10000);
    return () => {
      clearInterval(glitchInterval);
      clearInterval(energyInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <canvas ref={canvasRef} />
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full transition-all duration-300 ${energyLevel > 0 ? 'opacity-30' : 'opacity-10'}`} style={{ background: 'radial-gradient(circle, rgba(248, 19, 13, 0.3) 0%, transparent 70%)', filter: `blur(${20 + energyLevel * 20}px)`, transform: `scale(${1 + energyLevel * 0.2})` }} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full transition-all duration-500 ${energyLevel > 0 ? 'opacity-40' : 'opacity-15'}`} style={{ background: 'radial-gradient(circle, rgba(251, 70, 6, 0.3) 0%, transparent 70%)', filter: `blur(${30 + energyLevel * 30}px)`, transform: `scale(${1 + energyLevel * 0.3}) translate(${energyLevel * 10}px, ${-energyLevel * 10}px)` }} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full transition-all duration-200 cyber-grid ${glitchEffect === 1 ? 'skew-x-2' : glitchEffect === 2 ? '-skew-y-1' : ''}`} style={{ backgroundSize: `${50 + energyLevel * 10}px ${50 + energyLevel * 10}px` }} />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-100 ${glitchEffect === 3 ? 'opacity-100' : 'opacity-20'}`} style={{ background: `linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.5) 50%)`, backgroundSize: '100% 4px', animation: glitchEffect === 3 ? 'scanline 0.1s linear infinite' : 'scanline 8s linear infinite' }} />
      <div className={`absolute inset-0 transition-opacity duration-150 ${glitchEffect ? 'opacity-15' : 'opacity-[0.02]'}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
};

export const App: React.FC = () => {
    const { isLoading, setIsLoading } = useContext(AppContext);
    const [appStarted, setAppStarted] = useState(false);
    const [history, setHistory] = useState<(File | string)[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab | null>('flux');
    const [isComparing, setIsComparing] = useState(false);
    const [viewerInstruction, setViewerInstruction] = useState<string | null>(null);
    
    // LIFTED/NEW STATE FOR FEATURES
    const [fluxPrompt, setFluxPrompt] = useState('');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    // Inpainting State
    const [isPainting, setIsPainting] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const lastPosition = useRef<{ x: number, y: number } | null>(null);
    const imageDimensions = useRef<{width: number, height: number}>({width: 0, height: 0});

    // Settings State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hakiEnabled, setHakiEnabled] = useState(true);
    const [hakiColor, setHakiColor] = useState('#DB24E3');
    const [isPlatinumTier, setIsPlatinumTier] = useState(true); // Locked

    const currentImageFile = useMemo(() => {
        const item = history[historyIndex];
        return item instanceof File ? item : null;
    }, [history, historyIndex]);
    
    const currentMediaUrl = useMemo(() => {
        const item = history[historyIndex];
        if (!item) return null;
        if (typeof item === 'string') return item;
        return URL.createObjectURL(item);
    }, [history, historyIndex]);

    const originalImageFile = useMemo(() => {
        const item = history[0];
        return item instanceof File ? item : null;
    }, [history]);
    
    const originalImageUrl = useMemo(() => {
        const item = history[0];
        if (!item) return null;
        if (typeof item === 'string') return item;
        return URL.createObjectURL(item);
    }, [history]);

    // This effect cleans up the Object URLs to prevent memory leaks.
    useEffect(() => {
        const currentUrl = currentMediaUrl;
        const originalUrl = originalImageUrl;
        return () => {
            if (currentUrl && currentUrl.startsWith('blob:')) URL.revokeObjectURL(currentUrl);
            if (originalUrl && originalUrl !== currentUrl && originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl);
        };
    }, [currentMediaUrl, originalImageUrl]);

    // Load state from IndexedDB on initial mount
    useEffect(() => {
        const loadInitialState = async () => {
            setIsLoading(true);
            try {
                const savedState = await loadState();
                if (savedState && savedState.history.length > 0) {
                    setHistory(savedState.history);
                    setHistoryIndex(savedState.historyIndex);
                    setActiveTab(savedState.activeTab as ActiveTab || 'flux'); 
                    setHakiEnabled(savedState.hakiEnabled ?? true);
                    setHakiColor(savedState.hakiColor ?? '#DB24E3');
                    setIsPlatinumTier(true);
                    setAppStarted(true); // If history exists, bypass start screen
                }
            } catch (e: any) {
                setError(`Failed to load session: ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialState();
    }, [setIsLoading]);

    // Save state whenever history or settings change
    useEffect(() => {
        if (!isLoading) {
            saveState(history, historyIndex, activeTab || '', hakiEnabled, hakiColor, 1, 1, isPlatinumTier);
        }
    }, [history, historyIndex, activeTab, hakiEnabled, hakiColor, isPlatinumTier, isLoading]);

    // Clear error message after a delay
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        setPreviewImageUrl(null);
    }, [activeTab]);
    
    useEffect(() => {
        if (currentMediaUrl && currentImageFile) {
            const img = new Image();
            img.onload = () => {
                imageDimensions.current = { width: img.naturalWidth, height: img.naturalHeight };
            };
            img.src = currentMediaUrl;
        }
    }, [currentMediaUrl, currentImageFile]);
    
    useEffect(() => {
        if (activeTab === 'inpaint' && maskCanvasRef.current && imageDimensions.current.width > 0) {
            const canvas = maskCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const { width, height } = imageDimensions.current;
            const ratio = window.devicePixelRatio || 1;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(ratio, ratio);
        }
    }, [activeTab]);

    const handleImageUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const stabilizedFile = await stabilizeFile(file);
            setHistory([stabilizedFile]);
            setHistoryIndex(0);
            setActiveTab('flux');
            setFluxPrompt(''); 
            setPreviewImageUrl(null);
        } catch (e: any) {
            setError(`Error processing upload: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading]);

    const updateHistory = (newMedia: string | string[], type: 'edit' | 'new' | 'batch', ext: 'png' | 'mp4' = 'png') => {
        if (type === 'edit' && typeof newMedia === 'string') {
            const newFile = dataURLtoFile(newMedia, `edit-${Date.now()}.${ext}`);
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newFile);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        } else if (type === 'new' && typeof newMedia === 'string') {
            const newFile = dataURLtoFile(newMedia, `gen-${Date.now()}.${ext}`);
            setHistory([newFile]);
            setHistoryIndex(0);
        } else if (type === 'batch' && Array.isArray(newMedia)) {
            const newFiles = newMedia.map(url => dataURLtoFile(url, `batch-${Date.now()}.${ext}`));
            setHistory(newFiles);
            setHistoryIndex(0);
        }
    };
    
    const handleGenerationRequest = useCallback(async (req: GenerationRequest) => {
        setIsLoading(true);
        setError(null);
        setPreviewImageUrl(null);
        try {
            const source = (req.useOriginal ? originalImageFile : currentImageFile) || currentImageFile;
            
            switch(req.type) {
                case 'flux': {
                    if (req.forceNew || !source) {
                        if (req.batchSize && req.batchSize > 1) {
                            const results = await geminiService.generateBatchImages(req.prompt!, req.batchSize, req.aspectRatio, req.isChaos);
                            updateHistory(results, 'batch');
                        } else {
                            const result = await geminiService.generateFluxTextToImage(req.prompt!, req.aspectRatio, req.isChaos);
                            updateHistory(result, 'new');
                        }
                    } else if (source) {
                        const result = await geminiService.generateFluxImage(source, req.prompt!, req.aspectRatio, req.isChaos);
                        updateHistory(result, 'edit');
                    }
                    setFluxPrompt('');
                    break;
                }
                case 'filters':
                    if (source) updateHistory(await geminiService.generateFilteredImage(source, req.prompt!, req.aspectRatio), 'edit');
                    break;
                case 'adjust':
                    if (source) updateHistory(await geminiService.generateAdjustedImage(source, req.prompt!, req.aspectRatio), 'edit');
                    break;
                case 'typography':
                    if (req.forceNew || !source) {
                        updateHistory(await geminiService.generateTypographicTextToImage(req.prompt!, req.aspectRatio), 'new');
                    } else {
                        updateHistory(await geminiService.generateTypographicImage(source, req.prompt!, req.aspectRatio), 'edit');
                    }
                    break;
                case 'vector':
                     if (req.forceNew || !source) {
                        updateHistory(await geminiService.generateVectorTextToImage(req.prompt!, req.aspectRatio), 'new');
                    } else {
                        updateHistory(await geminiService.generateVectorArtImage(source, req.prompt!, req.aspectRatio), 'edit');
                    }
                    break;
                case 'inpaint':
                    if (source && req.maskBase64) updateHistory(await geminiService.generateInpaintedImage(source, req.maskBase64, req.prompt!), 'edit');
                    break;
                case 'video_animation': {
                    const result = await geminiService.generateVideo(req.prompt!, req.aspectRatio, source);
                    updateHistory(result, 'new', 'mp4');
                    break;
                }
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [historyIndex, history, originalImageFile, currentImageFile, setIsLoading, setFluxPrompt]);

    const handleUndo = () => historyIndex > 0 && setHistoryIndex(historyIndex - 1);
    const handleRedo = () => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1);
    const handleGoHome = () => {
        if (window.confirm('This will start a new session. Are you sure?')) {
            setHistory([]);
            setHistoryIndex(-1);
            setActiveTab('flux');
            setAppStarted(false);
            setFluxPrompt('');
            setPreviewImageUrl(null);
            setIsComparing(false);
            setError(null);
            clearState().catch(e => {
                console.error("Failed to clear session:", e);
                setError("Could not clear session. Please try a hard reset.");
            });
        }
    };
    const handleRemoveImage = () => {
        if (window.confirm('Are you sure you want to remove this image and clear your session? This cannot be undone.')) {
            setHistory([]);
            setHistoryIndex(-1);
            setActiveTab('flux');
            setFluxPrompt('');
            setPreviewImageUrl(null);
            setIsComparing(false);
            setError(null);
             clearState().catch(e => {
                console.error("Failed to clear session:", e);
                setError("Could not clear session. Please try a hard reset.");
            });
        }
    };
    const handleHardFix = async () => { await nukeDatabase(); window.location.reload(); };
    const handleSoftFix = () => window.location.reload();

    const handleDownload = () => {
        if (currentMediaUrl && currentImageFile) {
            const link = document.createElement('a');
            link.href = currentMediaUrl;
            link.download = `pixshop-export-${Date.now()}.${currentImageFile.name.split('.').pop() || 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const mediaType = useMemo(() => {
        const item = history[historyIndex];
        if (typeof item === 'string') return 'video/mp4';
        return item?.type;
    }, [history, historyIndex]);

    const handleToggleTab = (tab: ActiveTab) => {
        setActiveTab(prev => (prev === tab ? null : tab));
    };

    const handleStart = (tab?: ActiveTab) => {
        setAppStarted(true);
        setActiveTab(tab || 'flux');
    };
    
    const handleSendToFlux = (prompt: string) => {
        setFluxPrompt(prompt);
        setActiveTab('flux');
    };

    const getPaintCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!maskCanvasRef.current) return null;
        const canvas = maskCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const { clientX, clientY } = 'touches' in event ? event.touches[0] : event;
        const scaleX = canvas.width / (rect.width * (window.devicePixelRatio || 1));
        const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };
    
    const startPainting = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (event.nativeEvent instanceof MouseEvent && event.button !== 0) return;
        setIsPainting(true);
        lastPosition.current = getPaintCoordinates(event);
    }, []);

    const stopPainting = useCallback(() => { setIsPainting(false); lastPosition.current = null; }, []);

    const paint = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isPainting || !maskCanvasRef.current) return;
        event.preventDefault();
        const canvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const currentPos = getPaintCoordinates(event);
        if (!currentPos || !lastPosition.current) return;
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(lastPosition.current.x, lastPosition.current.y); ctx.lineTo(currentPos.x, currentPos.y); ctx.stroke();
        lastPosition.current = currentPos;
    }, [isPainting, brushSize]);

    const panelProps = useMemo(() => ({
        onRequest: handleGenerationRequest,
        isLoading,
        hasImage: !!currentImageFile,
        setViewerInstruction
    }), [handleGenerationRequest, isLoading, currentImageFile, setViewerInstruction]);

    const toolPanels = useMemo(() => [
        { id: 'flux', title: 'Flux', icon: MagicWandIcon, component: <FluxPanel {...panelProps} currentImageFile={currentImageFile} fluxPrompt={fluxPrompt} setFluxPrompt={setFluxPrompt} setPreviewImageUrl={setPreviewImageUrl} /> },
        { id: 'style_extractor', title: 'Style', icon: StyleExtractorIcon, component: <StyleExtractorPanel isLoading={isLoading} hasImage={!!currentImageFile} currentImageFile={currentImageFile} onSendToFlux={handleSendToFlux} /> },
        { id: 'filters', title: 'Filters', icon: PaletteIcon, component: <FilterPanel {...panelProps} /> },
        { id: 'adjust', title: 'Adjust', icon: SunIcon, component: <AdjustmentPanel {...panelProps} /> },
        { id: 'inpaint', title: 'Inpaint', icon: EraserIcon, component: <InpaintPanel onApplyInpaint={(instruction: string) => {const canvas = maskCanvasRef.current; if(canvas) { const maskBase64 = canvas.toDataURL('image/png'); handleGenerationRequest({ type: 'inpaint', prompt: instruction, maskBase64 }); }}} isLoading={isLoading} hasImage={!!currentImageFile} brushSize={brushSize} setBrushSize={setBrushSize} onClearMask={() => { const canvas = maskCanvasRef.current; const ctx = canvas?.getContext('2d'); if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }} /> },
        { id: 'typography', title: 'Typography', icon: TypeIcon, component: <TypographicPanel {...panelProps} /> },
        { id: 'vector', title: 'Vector', icon: VectorIcon, component: <VectorArtPanel {...panelProps} /> },
        { id: 'video_animation', title: 'Animation', icon: BoltIcon, component: <VideoPanel {...panelProps} /> },
    ], [panelProps, currentImageFile, fluxPrompt, setFluxPrompt, setPreviewImageUrl, isLoading, handleSendToFlux, handleGenerationRequest, brushSize, setBrushSize]);

    return (
        <>
            <AndroidOptimizations />
            <GlobalSakugaEffects />
            
            <div className="relative z-10 w-full h-full">
                {!appStarted ? (
                    <StartScreen onStart={handleStart} />
                ) : (
                    <div className="flex flex-col h-screen max-h-screen bg-transparent text-white overflow-hidden">
                        <Header isPlatinumTier={isPlatinumTier} onGoHome={handleGoHome} />
                        <main className="flex-1 flex flex-col overflow-hidden relative">
                            {isLoading && (
                                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in"><Spinner /></div>
                            )}
                            
                            <div className="flex-1 min-h-0 min-w-0 relative bg-transparent flex">
                                {previewImageUrl && !isLoading ? (
                                    <ZoomPanViewer src={previewImageUrl} mimeType="image/png">
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-md shadow-lg pointer-events-none opacity-65 animate-pulse">
                                            NEURAL CANVAS: LIVE PREVIEW
                                        </div>
                                    </ZoomPanViewer>
                                ) : currentImageFile && currentMediaUrl ? (
                                    <>
                                        <div className="absolute top-2 left-2 z-20 p-2 flex items-center gap-2">
                                            <button onClick={handleUndo} disabled={historyIndex <= 0 || isLoading} className="p-2 bg-[#161318]/60 border border-[#2D2831] rounded text-white disabled:opacity-30 hover:bg-[#222] transition-colors"><UndoIcon className="w-5 h-5"/></button>
                                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1 || isLoading} className="p-2 bg-[#161318]/60 border border-[#2D2831] rounded text-white disabled:opacity-30 hover:bg-[#222] transition-colors"><RedoIcon className="w-5 h-5"/></button>
                                            {originalImageUrl && !isComparing && <button onClick={() => setIsComparing(true)} className="p-2 bg-[#161318]/60 border border-[#2D2831] rounded text-white hover:bg-[#222] transition-colors"><CompareIcon className="w-5 h-5"/></button>}
                                            <button onClick={handleRemoveImage} disabled={isLoading} className="p-2 bg-[#161318]/60 border border-[#2D2831] rounded text-white disabled:opacity-30 hover:bg-red-800 hover:border-red-500 transition-colors" title="Remove Image & Clear Session"><XIcon className="w-5 h-5"/></button>
                                        </div>
                                        {isComparing && originalImageUrl ? (
                                            <>
                                                <button onClick={() => setIsComparing(false)} className="absolute top-2 right-2 z-30 p-2 bg-red-800/80 border border-red-500 rounded-full text-white hover:bg-red-600 transition-colors"><XIcon className="w-5 h-5"/></button>
                                                <CompareSlider originalImage={originalImageUrl} modifiedImage={currentMediaUrl} />
                                            </>
                                        ) : (
                                            <ZoomPanViewer src={currentMediaUrl} mimeType={mediaType}>
                                                {activeTab === 'inpaint' ? (
                                                    <>
                                                        {currentImageFile && 
                                                            <canvas ref={maskCanvasRef} className="absolute top-0 left-0 opacity-50 pointer-events-auto mix-blend-screen"
                                                                onMouseDown={startPainting} onMouseUp={stopPainting} onMouseLeave={stopPainting} onMouseMove={paint}
                                                                onTouchStart={startPainting} onTouchEnd={stopPainting} onTouchMove={paint} />
                                                        }
                                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-md shadow-lg pointer-events-none opacity-65">
                                                            USE MOUSE OR FINGER TO PAINT MASK ON IMAGE
                                                        </div>
                                                    </>
                                                ) : viewerInstruction && (
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-md shadow-lg pointer-events-none opacity-65 animate-fade-in">
                                                        {viewerInstruction}
                                                    </div>
                                                )}
                                            </ZoomPanViewer>
                                        )}
                                    </>
                                ) : (
                                    <ImageUploadPlaceholder onImageUpload={handleImageUpload} />
                                )}
                            </div>
            
                            {activeTab && (
                                <div className="w-full flex-shrink-0 bg-[#0A0A0A] border-t-2 border-[#1A1A1A] max-h-[50vh] md:max-h-[40vh] overflow-hidden">
                                    {toolPanels.find(p => p.id === activeTab)?.component}
                                </div>
                            )}
                            
                            <div className="w-full flex-shrink-0 bg-black border-t-2 border-[#1A1A1A] p-2 flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className={`w-14 h-14 bg-[#1A1A1A] border-2 border-transparent rounded-md flex flex-col items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-red-500'}`} title="Upload New Image">
                                        <UploadIcon className="w-5 h-5 mb-1 text-gray-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Load</span>
                                        <input type="file" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} accept="image/*,video/*" disabled={isLoading} />
                                    </label>
                                    <button onClick={handleDownload} disabled={!currentMediaUrl || isComparing || isLoading} className="w-14 h-14 bg-[#1A1A1A] border-2 border-transparent rounded-md flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-500" title="Download Current Image">
                                    <DownloadIcon className="w-5 h-5 mb-1 text-gray-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Save</span>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-x-auto whitespace-nowrap custom-scrollbar flex items-center gap-2 h-[60px]">
                                    {toolPanels.map(tool => {
                                        const isActive = activeTab === tool.id;
                                        return (
                                            <button
                                                key={tool.id}
                                                onClick={() => handleToggleTab(tool.id as ActiveTab)}
                                                className={`h-full aspect-square flex flex-col items-center justify-center p-1 rounded-md border-2 transition-all duration-200 ${isActive ? 'bg-red-500/20 border-red-500' : 'bg-[#1A1A1A] border-transparent hover:bg-[#222]'}`}
                                                title={tool.title}
                                            >
                                                <tool.icon className={`w-5 h-5 mb-1 ${isActive ? 'text-red-400' : 'text-gray-400'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-500'}`}>{tool.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <SystemConfigWidget onSoftFix={handleSoftFix} onHardFix={handleHardFix} />
                        </main>
            
                        {error && (
                            <div className="absolute bottom-[80px] md:bottom-6 left-1/2 -translate-x-1/2 z-[10001] bg-red-900/90 border-2 border-red-500 text-white text-sm font-bold px-6 py-3 rounded-md shadow-2xl max-w-lg w-11/12 text-center backdrop-blur-sm animate-fade-in">
                                <p className="font-mono text-xs uppercase text-red-300 mb-1">Application Error</p>
                                {error}
                            </div>
                        )}
                        
                        <CameraCaptureModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleImageUpload} />
                    </div>
                )}
            </div>
        </>
    );
}