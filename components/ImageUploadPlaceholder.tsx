/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { UploadIcon } from './icons';

interface ImageUploadPlaceholderProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploadPlaceholder: React.FC<ImageUploadPlaceholderProps> = ({ onImageUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <label 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-700/50 rounded-lg cursor-pointer bg-black/20 hover:bg-gray-900/50 hover:border-red-500/50 transition-colors relative overflow-hidden"
      >
        <div className="absolute inset-0 cyber-grid opacity-20 transform-none animation-none"></div>
        <div className="relative flex flex-col items-center justify-center pt-5 pb-6 text-center z-10">
          <UploadIcon className="w-10 h-10 mb-3 text-gray-500" />
          <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-red-400">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-500 font-mono">PNG, JPG, WEBP, MP4 or WEBM Video</p>
        </div>
        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
      </label>
    </div>
  );
};