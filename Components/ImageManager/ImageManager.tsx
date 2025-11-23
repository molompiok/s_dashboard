import React, { useState } from 'react';
import { IoCloudUploadOutline, IoTrash } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { getMedia } from '../Utils/StringFormater';
import { ClientCall, getFileType } from '../Utils/functions';
import { NO_PICTURE } from '../Utils/constants';
import { useChildViewer } from '../ChildViewer/useChildViewer';
import Gallery from '../Gallery/Gallery';
import { image } from 'html2canvas-pro/dist/types/css/types/image';
import { validateFiles } from '../Utils/fileValidation';
import { FileSizeErrorPopup } from '../FileSizeErrorPopup/FileSizeErrorPopup';

export type ImageItem = { id: string; source: string | File };

interface ImageManagerProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  className?: string;
  canOpenGallery?:boolean
}

const MAX_IMAGES = 6;

export const ImageManager: React.FC<ImageManagerProps> = ({canOpenGallery, images, onImagesChange, className = '' }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { openChild } = useChildViewer()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
   
    if (files.length === 0) return;

    // Valider la taille des fichiers
    const validation = validateFiles(files);
    if (!validation.isValid && validation.error) {
      openChild(
        <FileSizeErrorPopup
          fileName={validation.error.fileName}
          fileSize={validation.error.fileSize}
          fileType={validation.error.fileType}
        />,
        { background: 'rgba(0, 0, 0, 0.7)', blur: 4 }
      );
      e.target.value = ''; // reset input
      return;
    }

    const availableSlots = MAX_IMAGES - images.length;
    files.forEach((f, i) => Object.defineProperty(f, 'name', {
      value: f.name + i,
      writable: false,
    }));
    const filesToAdd = files.slice(0, availableSlots).map(file => ({
      id: ClientCall(function () { return Math.random() }, 0),
      source: file,
    }));
   
    onImagesChange([...images, ...filesToAdd]);
    e.target.value = ''; // reset input
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    // Valider la taille des fichiers
    const validation = validateFiles(files);
    if (!validation.isValid && validation.error) {
      openChild(
        <FileSizeErrorPopup
          fileName={validation.error.fileName}
          fileSize={validation.error.fileSize}
          fileType={validation.error.fileType}
        />,
        { background: 'rgba(0, 0, 0, 0.7)', blur: 4 }
      );
      return;
    }

    files.forEach((f, i) => Object.defineProperty(f, 'name', {
      value: f.name + i,
      writable: false,
    }));
    const availableSlots = MAX_IMAGES - images.length;
    const filesToAdd = files.slice(0, availableSlots).map(file => ({
      id: ClientCall(function () { return Math.random() }, 0),
      source: file,
    }));

    if (filesToAdd.length > 0) {
      onImagesChange([...images, ...filesToAdd]);
    }
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnImage = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex)) {
      moveImage(fromIndex, toIndex);
    }
  };

  const removeImage = (idToRemove: string) => {
    onImagesChange(images.filter(img => img.id !== idToRemove));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onImagesChange(updated);
  };

  const openGallery = (index: number) => {
    openChild(<Gallery defaultIndex={index} onClose={() => {
      openChild(null)
    }} media={images.map(img =>
    ({
      src: getMedia({ source: img.source, from: 'api' }),
      type: getFileType(img.source) || 'image'
    })
    )} />, {
      blur: 3
    })
  }

  return (
    <div
        className={`image-manager ${className}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        ref={containerRef}
      >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
        <AnimatePresence>
          {images.map((image, index) => {
            const fileType = getFileType(image.source);
            const src = getMedia({ source: image.source, from: 'api' });

            return (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                draggable
                onDragStart={(e) => handleDragStart(e as any, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnImage(e, index)}
                className="relative aspect-square rounded-lg overflow-hidden shadow-md cursor-grab active:cursor-grabbing"
              >
                {
                  fileType === 'image' ? (
                    <img src={src || NO_PICTURE}
                      alt="Product" loading="lazy" className="w-full h-full object-cover block"
                      onError={(e) => {
                        e.currentTarget.src = NO_PICTURE
                      }} />
                  ) : fileType === 'video' ? (
                    <video muted autoPlay loop playsInline className="w-full h-full object-cover block" src={src || ''} onError={(e) => {
                      e.currentTarget.src = NO_PICTURE
                    }} />
                  ) : (
                    <img src={NO_PICTURE} alt="Product" loading="lazy" className="w-full h-full object-cover block bg-gray-100 dark:bg-gray-800" />
                  )
                }
                <div onClick={(e) => {
                  
           
                  canOpenGallery && openGallery(index);
                }} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/80 text-white rounded-full hover:bg-red-700 transition-all"
                    aria-label="Supprimer l'image"
                  >
                    <IoTrash size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Bouton d'ajout d'image */}
        {images.length < MAX_IMAGES && (
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-teal-500 hover:text-teal-500 cursor-pointer transition-colors">
            <IoCloudUploadOutline size={32} />
            <span className="text-xs mt-1 text-center font-medium">Ajouter des images</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
};
