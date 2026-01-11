/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { DragIcon } from './icons';

interface ZoomPanViewerProps {
    src: string;
    mimeType?: string; // New prop to explicitly identify file type
    className?: string;
    children?: React.ReactNode; 
}

export const ZoomPanViewer: React.FC<ZoomPanViewerProps> = ({ src, mimeType, className, children }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Pinch Zoom State
    const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
    const [initialScale, setInitialScale] = useState(1);

    const containerRef = useRef<HTMLDivElement>(null);

    // Robust video detection: Check mimeType first, then fallback to URL extensions
    const isVideo = (mimeType?.startsWith('video/')) || 
                    src?.toLowerCase().includes('.mp4') || 
                    src?.toLowerCase().includes('googlevideo.com');

    // --- MOUSE HANDLERS ---

    const handleWheel = (e: React.WheelEvent) => {
        const delta = -Math.sign(e.deltaY) * 0.2;
        const newScale = Math.max(1, Math.min(8, scale + delta));
        setScale(newScale);
        if (newScale === 1) setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            e.preventDefault();
            setPosition({ 
                x: e.clientX - dragStart.x, 
                y: e.clientY - dragStart.y 
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // --- TOUCH HANDLERS (Mobile Support) ---

    const getDistance = (touches: React.TouchList) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && scale > 1) {
            // Single touch drag
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
        } else if (e.touches.length === 2) {
            // Pinch start
            setIsDragging(false);
            const dist = getDistance(e.touches);
            setInitialPinchDist(dist);
            setInitialScale(scale);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && isDragging && scale > 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        } else if (e.touches.length === 2 && initialPinchDist) {
            const dist = getDistance(e.touches);
            const ratio = dist / initialPinchDist;
            const newScale = Math.max(1, Math.min(8, initialScale * ratio));
            setScale(newScale);
            if (newScale === 1) setPosition({ x: 0, y: 0 });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        setInitialPinchDist(null);
    };

    const handleDoubleClick = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };
    
    // Reset when src changes
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [src]);

    return (
        <div 
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#050505] transition-colors duration-300 ${className}`}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                touchAction: 'none' // CRITICAL: Prevent browser scroll while manipulating image
            }}
        >
             {scale === 1 && !isVideo && (
                 <div className="absolute top-4 right-4 z-20 pointer-events-none bg-black/50 p-1.5 rounded-full text-gray-400 backdrop-blur-sm border border-white/10">
                     <DragIcon className="w-4 h-4" />
                 </div>
             )}
             
             {/* Transformed Container */}
             <div 
                className="relative transition-transform duration-100 ease-out will-change-transform flex items-center justify-center"
                style={{
                    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    transformOrigin: 'center center',
                    width: '100%',
                    height: '100%'
                }}
             >
                 {isVideo ? (
                     <video
                        key={src} // Add key to force re-render on src change
                        src={src}
                        controls
                        autoPlay
                        loop
                        muted // Muted to allow autoplay policy compliance
                        playsInline
                        className="max-w-full max-h-full object-contain shadow-2xl border border-[#333]"
                        draggable={false}
                     />
                 ) : (
                    <>
                        <img 
                            src={src} 
                            alt="Viewer" 
                            className="block max-w-full max-h-full object-contain select-none pointer-events-none" 
                            draggable={false}
                        />
                        {/* Overlays (like Mask Canvas) - Positioned over the image */}
                         {children && (
                             <div className="absolute inset-0 w-full h-full pointer-events-auto">
                                 {children}
                             </div>
                         )}
                    </>
                 )}
             </div>
        </div>
    );
};
