
import React, { useState, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ sidebar, content }) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    // On mobile, hide sidebar by default
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="flex flex-col lg:flex-row relative">
      {/* Mobile toggle button */}
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="absolute top-2 left-2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-md shadow-sm border border-gray-100"
          aria-label={showSidebar ? "Hide documents" : "Show documents"}
        >
          <SlidersHorizontal size={20} className={showSidebar ? "text-primary" : "text-gray-500"} />
        </button>
      )}
      
      {/* Sidebar overlay for mobile */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/20 z-10"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Document sidebar */}
      <div 
        className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-10 w-5/6 max-w-xs bg-white shadow-lg transform transition-transform ${
                showSidebar ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-full lg:w-1/4 border-r border-gray-100 bg-gray-50'
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          {sidebar}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        {content}
      </div>
    </div>
  );
};

export default MainLayout;
