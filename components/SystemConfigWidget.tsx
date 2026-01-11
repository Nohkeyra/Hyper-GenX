/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SettingsIcon, XIcon } from './icons';

interface SystemConfigWidgetProps {
  onSoftFix: () => void;
  onHardFix: () => void;
}

interface Position {
  x: number;
  y: number;
}

export const SystemConfigWidget: React.FC<SystemConfigWidgetProps> = ({ 
  onSoftFix, 
  onHardFix 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>(() => {
    // Try to load saved position from localStorage
    try {
      const saved = localStorage.getItem('system-widget-position');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.x !== undefined && parsed.y !== undefined) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load widget position:', e);
    }
    // Default position: bottom-left with margin
    return { 
      x: Math.min(16, window.innerWidth - 64), 
      y: window.innerHeight - 80 
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [touchActive, setTouchActive] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastPositionRef = useRef(position);
  const touchIdentifierRef = useRef<number | null>(null);

  // Save position to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('system-widget-position', JSON.stringify(position));
    } catch (e) {
      console.warn('Failed to save widget position:', e);
    }
  }, [position]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        const newX = Math.min(position.x, window.innerWidth - rect.width);
        const newY = Math.min(position.y, window.innerHeight - rect.height);
        
        if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Keyboard navigation and escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      if (e.key === 'Tab' && isOpen) {
        // Keep focus within widget when open
        const widget = widgetRef.current;
        if (widget) {
          const focusableElements = widget.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
            
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      touchIdentifierRef.current = touch.identifier;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    dragOffsetRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
    
    setIsDragging(true);
    lastPositionRef.current = position;
    
    // Add active state for visual feedback
    if ('touches' in e) {
      setTouchActive(true);
    }
  }, [position]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    let clientX: number;
    let clientY: number;
    
    if (window.TouchEvent && e instanceof TouchEvent) {
      // Find the touch with our identifier
      const touch = Array.from(e.touches).find(
        t => t.identifier === touchIdentifierRef.current
      );
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    
    const widget = widgetRef.current;
    if (!widget) return;
    
    const rect = widget.getBoundingClientRect();
    const newX = clientX - dragOffsetRef.current.x;
    const newY = clientY - dragOffsetRef.current.y;
    
    // Calculate boundaries
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    const minX = 0;
    const minY = 0;
    
    const boundedX = Math.max(minX, Math.min(newX, maxX));
    const boundedY = Math.max(minY, Math.min(newY, maxY));
    
    setPosition({ x: boundedX, y: boundedY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setTouchActive(false);
    touchIdentifierRef.current = null;
    
    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
      
      window.addEventListener('mousemove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd, { passive: false });
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd, { passive: false });
      window.addEventListener('touchcancel', handleDragEnd, { passive: false });
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleOpenClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    // Check if this was a drag (position changed significantly)
    const movedDistance = Math.sqrt(
      Math.pow(position.x - lastPositionRef.current.x, 2) +
      Math.pow(position.y - lastPositionRef.current.y, 2)
    );
    
    // If moved less than 5 pixels, treat as a click
    if (movedDistance < 5 && !isDragging) {
      setIsOpen(true);
    }
  }, [position, isDragging]);

  const handleButtonClick = useCallback((handler: () => void) => {
    setIsOpen(false);
    setTimeout(handler, 100); // Small delay for smooth close
  }, []);

  // Close widget when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const widget = widgetRef.current;
      if (widget && !widget.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Closed state (draggable button)
  if (!isOpen) {
    return (
      <div
        ref={widgetRef}
        style={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          touchAction: 'none' // Prevent browser touch gestures
        }}
        className={`z-50 transition-transform duration-200 ${
          isDragging ? 'scale-105 opacity-90' : ''
        } ${touchActive ? 'scale-110' : ''}`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={handleOpenClick}
        role="application"
        aria-label="System configuration widget"
      >
        <button
          className={`
            w-14 h-14 sm:w-12 sm:h-12
            bg-black/70 backdrop-blur-md rounded-full
            flex items-center justify-center
            border border-gray-700/80
            transition-all duration-200
            ${isDragging 
              ? 'shadow-2xl border-blue-500/50 bg-blue-900/20' 
              : 'shadow-xl hover:shadow-2xl hover:border-gray-500'
            }
            ${touchActive ? 'bg-blue-900/30' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent
          `}
          aria-label="Open system configuration"
          title="System Config (Click to open, drag to move)"
          style={{
            WebkitTapHighlightColor: 'transparent',
            minWidth: '44px', // Minimum touch target for mobile
            minHeight: '44px',
          }}
        >
          <SettingsIcon 
            className={`w-6 h-6 sm:w-5 sm:h-5 transition-transform duration-200 ${
              isDragging ? 'rotate-90 scale-110' : ''
            }`}
            aria-hidden="true"
          />
          {isDragging && (
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/50 animate-pulse"></div>
          )}
        </button>
        
        {/* Drag indicator for mobile */}
        {isDragging && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-blue-400 font-mono whitespace-nowrap">
            Dragging...
          </div>
        )}
      </div>
    );
  }

  // Open state (configuration panel)
  return (
    <div
      ref={widgetRef}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
      className="z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border border-gray-800 rounded-lg shadow-2xl w-72 sm:w-64 animate-fade-in"
      role="dialog"
      aria-label="System configuration panel"
      aria-modal="true"
    >
      {/* Draggable header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="flex justify-between items-center p-4 pb-3 cursor-move border-b border-gray-800"
        style={{ touchAction: 'none' }}
      >
        <h3 
          className="text-sm font-black italic text-white uppercase tracking-wider"
          style={{ fontFamily: 'Koulen' }}
          id="system-config-title"
        >
          System Config
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-white transition-colors p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-transparent"
          aria-label="Close system configuration"
        >
          <XIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 pt-3" aria-labelledby="system-config-title">
        <p className="text-xs text-gray-400 font-mono mb-4">
          If you encounter an error, use a reset option.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleButtonClick(onSoftFix)}
            className="w-full text-left p-3 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-green-900/50 hover:to-green-800/50 border border-gray-700 hover:border-green-500/50 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent group"
            aria-label="Perform soft reset (minimal fix)"
          >
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1 rounded-full bg-green-500 group-hover:animate-pulse"></div>
              <div className="flex-1">
                <h4 className="font-bold text-xs text-green-400 uppercase mb-1">
                  Minimal Fix (Soft Reset)
                </h4>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Reloads the app and clears current session. Keeps history.
                </p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleButtonClick(onHardFix)}
            className="w-full text-left p-3 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-red-900/50 hover:to-red-800/50 border border-gray-700 hover:border-red-500/50 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-transparent group"
            aria-label="Perform hard reset (nuclear fix)"
          >
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1 rounded-full bg-red-500 group-hover:animate-pulse"></div>
              <div className="flex-1">
                <h4 className="font-bold text-xs text-red-400 uppercase mb-1">
                  Nuclear Fix (Hard Reset)
                </h4>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Wipes all data and performs factory reset. Use as last resort.
                </p>
              </div>
            </div>
          </button>
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-800">
          <p className="text-[10px] text-gray-500 text-center">
            Drag the widget to reposition • Press Esc to close
          </p>
        </div>
      </div>
    </div>
  );
};