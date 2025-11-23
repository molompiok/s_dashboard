import React from 'react';
import { IoImageOutline, IoVideocamOutline, IoArrowForwardOutline, IoResizeOutline, IoOptionsOutline, IoFilmOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { ChildViewer } from '../ChildViewer/ChildViewer';

interface FileSizeErrorPopupProps {
  fileName: string;
  fileSize: number; // en bytes
  fileType: 'image' | 'video';
}

const MAX_SIZE_MB = 2;

// Composant pour afficher le favicon avec fallback
const SiteIcon: React.FC<{ url: string; name: string; color: string }> = ({ url, name, color }) => {
  const [imgError, setImgError] = React.useState(false);
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shadow-sm">
      {!imgError ? (
        <img 
          src={`${url}/favicon.ico`}
          alt={name} 
          className="w-8 h-8"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
          {initials}
        </div>
      )}
    </div>
  );
};

export const FileSizeErrorPopup: React.FC<FileSizeErrorPopupProps> = ({
  fileName,
  fileSize,
  fileType,
}) => {
  const { t } = useTranslation();
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
  const isImage = fileType === 'image';

  return (
    <ChildViewer title={isImage ? t('fileSizeError.imageTitle') : t('fileSizeError.videoTitle')}>
      <div className="p-6 space-y-6">
        {/* Icon Header */}
        <div className="flex items-center justify-center">
          <div className={`p-4 rounded-full ${isImage ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            {isImage ? (
              <IoImageOutline className="w-12 h-12 text-orange-600 dark:text-orange-400" />
            ) : (
              <IoVideocamOutline className="w-12 h-12 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>

        {/* File Info */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{fileName}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('fileSizeError.sizeInfo', { size: fileSizeMB, max: MAX_SIZE_MB })}
          </p>
        </div>

        {isImage ? (
          <div className="space-y-4">
            <p className="text-base font-medium text-gray-900 dark:text-white text-center">
              {t('fileSizeError.imageRecommendation')}
            </p>
            
            <a
              href="https://www.iloveimg.com/fr/compresser-image"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
            >
              <SiteIcon url="https://www.iloveimg.com" name="iLoveIMG" color="bg-teal-500" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  iLoveIMG
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('fileSizeError.compressOnline')}
                </div>
              </div>
              <IoArrowForwardOutline className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-base font-medium text-gray-900 dark:text-white text-center">
              {t('fileSizeError.videoRecommendation')}
            </p>
            
            {/* Recommendations list */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <IoResizeOutline className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span>{t('fileSizeError.reduceResolution')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <IoOptionsOutline className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span>{t('fileSizeError.reduceQuality')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <IoFilmOutline className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>{t('fileSizeError.convertToWebM')}</span>
              </div>
            </div>
            
            <a
              href="https://www.freeconvert.com/video-compressor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
            >
              <SiteIcon url="https://www.freeconvert.com" name="FreeConvert" color="bg-blue-500" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  FreeConvert
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('fileSizeError.compressVideoOnline')}
                </div>
              </div>
              <IoArrowForwardOutline className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </a>
          </div>
        )}
      </div>
    </ChildViewer>
  );
};

