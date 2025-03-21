import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UploadProgressProps {
  progress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
      <div className={isMobile ? "w-28" : "w-36"}>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-center text-gray-500">Uploading...</p>
          <p className="text-xs font-medium text-gray-600">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
