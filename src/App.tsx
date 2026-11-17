/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Calculator } from './components/Calculator';
import { PythonRepl } from './components/PythonRepl';
import { CodeLibrary } from './components/CodeLibrary';
import { GuideSection } from './components/GuideSection';
import { AIStudio } from './components/AIStudio';
import { PYTHON_SCRIPTS } from './data/pythonSnippets';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'repl' | 'library' | 'ai' | 'guide'>('calculator');

  const handleDownloadMainScript = () => {
    const mainScript = PYTHON_SCRIPTS[0]; // calculadora_terminal.py
    const blob = new Blob([mainScript.code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = mainScript.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0c1017] text-[#e6edf3] flex flex-col font-sans selection:bg-[#1f6feb]/30">
      {/* Top Bar with 3-Zone Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadMainScript={handleDownloadMainScript}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'calculator' && <Calculator />}
        {activeTab === 'repl' && <PythonRepl />}
        {activeTab === 'library' && <CodeLibrary />}
        {activeTab === 'ai' && <AIStudio />}
        {activeTab === 'guide' && <GuideSection />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#21262d] bg-[#0c1017] py-8 text-xs text-[#8b949e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Python Calculator Studio</span>
            <span>·</span>
            <span>Compatível com Python 3.8+ e CPython</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveTab('calculator')}
              className="hover:text-white transition-colors"
            >
              Calculadora
            </button>
            <button
              onClick={() => setActiveTab('repl')}
              className="hover:text-white transition-colors"
            >
              Terminal REPL
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className="hover:text-white transition-colors"
            >
              Códigos Fonte
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className="hover:text-white transition-colors"
            >
              Assistente IA
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className="hover:text-white transition-colors"
            >
              Como Rodar
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
