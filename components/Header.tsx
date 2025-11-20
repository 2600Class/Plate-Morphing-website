import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            PlateMorph AI
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <a 
            href="https://youtube.com/@theaverageirishtrainspotter" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            My YT ;)
          </a>
          <div className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            Powered by Gemini 2.5
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;