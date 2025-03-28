
import React from 'react';
import { Info } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="w-full py-6 px-8 flex items-center justify-between border-b border-gray-100 glass-panel animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-2">
            <Link to="/">
              <h1 className="text-xl font-semibold text-foreground tracking-tight">AI Transparency</h1>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="rounded-full p-1 hover:bg-gray-100 transition-colors">
                    <Info size={16} className="text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-80">
                  <p className="text-sm">
                    This app visualizes how different sources influence AI-generated content.
                    Upload documents to see their impact on the AI's responses.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">Exploring How AI Knows What It Knows</p>
        </div>
      </div>
      <nav>
        <ul className="flex items-center gap-6">
          <li>
            <Link 
              to="/how-it-works" 
              className={`text-sm font-medium ${
                location.pathname === '/how-it-works' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground transition-colors'
              }`}
            >
              How It Works
            </Link>
          </li>
          <li>
            <Link 
              to="/about" 
              className={`text-sm font-medium ${
                location.pathname === '/about' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground transition-colors'
              }`}
            >
              About
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
