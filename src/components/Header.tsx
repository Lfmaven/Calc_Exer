/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Terminal, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: 'calculator' | 'repl' | 'library' | 'ai' | 'guide';
  setActiveTab: (tab: 'calculator' | 'repl' | 'library' | 'ai' | 'guide') => void;
  onDownloadMainScript: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadMainScript,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#30363d] bg-[#0c1017]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text element wordmark with Python accent */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#387eb8] to-[#f5b731] flex items-center justify-center shadow-sm">
            <Terminal className="w-4 h-4 text-[#0c1017] stroke-[2.5]" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white">
            Python <span className="text-[#58a6ff]">Calculator</span> Studio
          </span>
        </div>

        {/* Zone 2: 5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'calculator'
                ? 'bg-[#21262d] text-[#58a6ff] font-semibold shadow-inner'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]'
            }`}
          >
            Calculadora
          </button>
          <button
            onClick={() => setActiveTab('repl')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'repl'
                ? 'bg-[#21262d] text-[#58a6ff] font-semibold shadow-inner'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]'
            }`}
          >
            Terminal REPL
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'library'
                ? 'bg-[#21262d] text-[#58a6ff] font-semibold shadow-inner'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]'
            }`}
          >
            Códigos .py
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'ai'
                ? 'bg-[#21262d] text-[#58a6ff] font-semibold shadow-inner'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]'
            }`}
          >
            Assistente IA
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'guide'
                ? 'bg-[#21262d] text-[#58a6ff] font-semibold shadow-inner'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]'
            }`}
          >
            Guia
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onDownloadMainScript}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
            title="Baixar calculadora_terminal.py pronta para rodar"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar .py</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-[#21262d] bg-[#161b22] overflow-x-auto">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'calculator' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e]'
          }`}
        >
          Calculadora
        </button>
        <button
          onClick={() => setActiveTab('repl')}
          className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'repl' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e]'
          }`}
        >
          REPL
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'library' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e]'
          }`}
        >
          Códigos
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'ai' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e]'
          }`}
        >
          IA & Voz
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'guide' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e]'
          }`}
        >
          Guia
        </button>
      </div>
    </header>
  );
};
