import React, { useState, useCallback } from 'react';
import { generatePlate } from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Button from './components/Button';
import { CarPlateState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<CarPlateState>({
    originalImage: null,
    generatedImage: null,
    plateNumber: '',
    plateCountry: '',
    mode: 'add', // Default mode
    isGenerating: false,
    error: null,
    statusMessage: '',
  });

  const handleImageSelect = (base64: string) => {
    setState(prev => ({
      ...prev,
      originalImage: base64,
      generatedImage: null,
      error: null,
      statusMessage: ''
    }));
  };

  const handleModeSwitch = (mode: 'add' | 'replace') => {
    setState(prev => ({
      ...prev,
      mode,
      error: null,
      statusMessage: '',
      generatedImage: null 
    }));
  };

  const handleGenerate = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!state.originalImage) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null, statusMessage: 'Initializing...' }));

    try {
      if (!state.plateNumber || !state.plateCountry) {
          throw new Error("Please fill in all text fields.");
      }
      
      const result = await generatePlate(
          state.originalImage,
          state.plateNumber,
          state.plateCountry,
          state.mode,
          (status) => setState(prev => ({ ...prev, statusMessage: status }))
      );
      
      setState(prev => ({ ...prev, generatedImage: result, isGenerating: false, statusMessage: 'Complete!' }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: err.message || "An unexpected error occurred." 
      }));
    }
  }, [state.originalImage, state.plateNumber, state.plateCountry, state.mode]);

  const handleDownload = () => {
    if (state.generatedImage) {
      const link = document.createElement('a');
      link.href = state.generatedImage;
      link.download = `platemorph-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={handleGenerate} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              
              {/* Tool Switcher Tabs */}
              <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg mb-6 border border-slate-700/50">
                <button 
                  type="button"
                  onClick={() => handleModeSwitch('add')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${state.mode === 'add' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                >
                  Add Plate
                </button>
                <button 
                  type="button"
                  onClick={() => handleModeSwitch('replace')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${state.mode === 'replace' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                >
                  Replace Plate
                </button>
              </div>

              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Plate Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Plate Country / Style</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Germany, California, Japan"
                    value={state.plateCountry}
                    onChange={(e) => setState(prev => ({ ...prev, plateCountry: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">New Plate Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g., ABC 1234"
                    value={state.plateNumber}
                    onChange={(e) => setState(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-mono tracking-wider uppercase"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                 <Button 
                    type="submit"
                    isLoading={state.isGenerating}
                    disabled={!state.originalImage || !state.plateNumber || !state.plateCountry}
                    className="w-full"
                 >
                   {state.isGenerating ? 'Processing...' : (state.mode === 'add' ? 'Add New Plate' : 'Replace Existing Plate')}
                 </Button>
                 {!state.originalImage && (
                    <p className="text-center text-xs text-slate-500 mt-3">Please upload a car image first</p>
                 )}
              </div>
            </form>

            {/* Instructions Panel */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">How it works</h3>
              {state.mode === 'add' ? (
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
                    <li>Upload a photo of a car without a plate.</li>
                    <li>Enter the desired country style.</li>
                    <li>Type the alphanumeric characters.</li>
                    <li>AI adds a brand new plate to the bumper.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
                    <li>Upload a photo of a car with a plate.</li>
                    <li>Enter the desired country style.</li>
                    <li>Type the new alphanumeric characters.</li>
                    <li>AI swaps the old plate for the new one.</li>
                </ol>
              )}
            </div>
          </div>

          {/* Right Area: Image Preview */}
          <div className="lg:col-span-8 space-y-6">
            {state.error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {/* Input View */}
              <ImageUploader 
                currentImage={state.originalImage} 
                onImageSelect={handleImageSelect} 
                label={state.mode === 'add' ? "Upload Car (No Plate)" : "Upload Car (With Plate)"}
              />

              {/* Result View */}
              {state.generatedImage ? (
                 <div className="relative w-full h-full min-h-[300px] bg-slate-800 rounded-xl overflow-hidden border border-indigo-500/30 shadow-2xl shadow-indigo-900/20">
                  <img 
                    src={state.generatedImage} 
                    alt="Generated Car" 
                    className="w-full h-full object-contain bg-slate-900/50"
                  />
                  <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg font-semibold">
                    AI Generated Result
                  </div>
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <Button 
                      type="button"
                      onClick={handleDownload}
                      variant="primary"
                      className="py-2 px-4 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                state.originalImage && state.isGenerating ? (
                    <div className="w-full h-[400px] bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center animate-pulse">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-400 font-medium">{state.statusMessage || 'Processing...'}</p>
                        <p className="text-slate-500 text-sm mt-2">
                          {state.mode === 'add' ? 'Adding new plate to bumper...' : 'Swapping existing plate...'}
                        </p>
                    </div>
                ) : (
                    state.originalImage && (
                         <div className="w-full h-[200px] bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600">
                            <p>Result will appear here</p>
                         </div>
                    )
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;