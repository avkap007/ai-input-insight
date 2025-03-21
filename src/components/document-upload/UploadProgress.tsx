import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UploadProgressProps {
  progress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg shadow-md">
      <div className={isMobile ? "w-28" : "w-40"}>
        <div className="h-2 w-full bg-gray-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-600">Uploading...</p>
          <p className="text-xs font-medium text-gray-700">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
