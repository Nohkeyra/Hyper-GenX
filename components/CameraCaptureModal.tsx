/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { XIcon } from './icons';

interface CameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(mediaStream => {
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                })
                .catch(err => {
                    console.error("Camera access error:", err);
                    setError("Could not access camera. Please check permissions.");
                });
        } else {
            stopStream();
        }

        return () => {
            stopStream();
        };
    }, [isOpen, stopStream]);

    const handleCapture = () => {
        if (videoRef.current && stream) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                        onCapture(file);
                        onClose();
                    }
                }, 'image/png');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#050505] border-2 border-[#333] p-4 sm:p-6 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors p-1 rounded-sm z-20">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-black italic text-white mb-4 uppercase tracking-tighter" style={{ fontFamily: 'Koulen' }}>
                    Camera Capture
                </h2>
                <div className="relative bg-black border border-[#222]">
                    {error ? (
                        <div className="aspect-video flex items-center justify-center text-red-400 font-mono text-sm p-4">{error}</div>
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto aspect-video" />
                    )}
                </div>
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={handleCapture}
                        disabled={!stream || !!error}
                        className="w-20 h-20 bg-transparent border-4 border-gray-500 rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer hover:border-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Capture Photo"
                    >
                        <div className="w-16 h-16 bg-red-700 rounded-full group-hover:bg-red-500 transition-colors group-active:scale-95"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};