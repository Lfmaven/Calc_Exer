/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  CheckCircle2,
  BookOpen,
  Layers,
  Monitor,
  ShieldCheck,
} from 'lucide-react';
import { PYTHON_SCRIPTS, PythonSnippet } from '../data/pythonSnippets';

interface CodeLibraryProps {
  onDownloadScript?: (snippet: PythonSnippet) => void;
}

export const CodeLibrary: React.FC<CodeLibraryProps> = () => {
  const [activeSnippetId, setActiveSnippetId] = useState<string>(PYTHON_SCRIPTS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const currentSnippet =
    PYTHON_SCRIPTS.find((s) => s.id === activeSnippetId) || PYTHON_SCRIPTS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (snippet: PythonSnippet) => {
    const blob = new Blob([snippet.code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = snippet.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: PythonSnippet['category']) => {
    switch (category) {
      case 'CLI / Terminal':
        return <FileCode className="w-4 h-4 text-[#58a6ff]" />;
      case 'Orientada a Objetos':
        return <Layers className="w-4 h-4 text-[#f5b731]" />;
      case 'Interface Gráfica':
        return <Monitor className="w-4 h-4 text-[#2ea043]" />;
      case 'Expressões AST':
        return <ShieldCheck className="w-4 h-4 text-[#bc8cff]" />;
      default:
        return <FileCode className="w-4 h-4 text-[#58a6ff]" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Title */}
      <div className="pb-6 border-b border-[#21262d]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Biblioteca de Códigos Python (.py)
        </h1>
        <p className="text-sm text-[#8b949e] mt-1">
          Scripts completos, testados e comentados em português prontos para copiar ou baixar no seu computador.
        </p>
      </div>

      {/* Script Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {PYTHON_SCRIPTS.map((snippet) => {
          const isSelected = snippet.id === activeSnippetId;
          return (
            <button
              key={snippet.id}
              onClick={() => setActiveSnippetId(snippet.id)}
              className={`p-4 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-[#161b22] border-[#58a6ff] ring-1 ring-[#58a6ff]/40 shadow-md'
                  : 'bg-[#0c1017] border-[#30363d] hover:bg-[#161b22]/70 hover:border-[#8b949e]/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(snippet.category)}
                <span className="text-xs font-semibold text-[#8b949e]">
                  {snippet.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {snippet.title}
              </h3>
              <p className="text-xs text-[#8b949e] font-mono truncate">
                {snippet.filename}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Script Details & Action Bar */}
      <div className="mt-8 bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-xl">
        {/* Banner with metadata */}
        <div className="p-5 sm:p-6 border-b border-[#30363d] bg-gradient-to-r from-[#161b22] to-[#0c1017]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-xl font-bold text-white">
                  {currentSnippet.title}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                  {currentSnippet.filename}
                </span>
              </div>
              <p className="text-sm text-[#8b949e] max-w-2xl leading-relaxed">
                {currentSnippet.summary}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg transition-colors shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#238636]" />
                    <span className="text-[#238636]">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownload(currentSnippet)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar {currentSnippet.filename}</span>
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-[#21262d]">
            {currentSnippet.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[#c9d1d9]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#238636] shrink-0" />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="relative bg-[#05080c] max-h-[500px] overflow-y-auto">
          <pre className="p-4 sm:p-6 font-mono text-xs sm:text-sm text-[#e6edf3] leading-relaxed overflow-x-auto">
            <code>
              {currentSnippet.code.split('\n').map((line, index) => (
                <div key={index} className="table-row">
                  <span className="table-cell select-none pr-4 text-right text-[#484f58] text-xs w-8 tabular-nums">
                    {index + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Didactic Step-by-Step Explanation */}
        <div className="p-5 sm:p-6 bg-[#0c1017] border-t border-[#30363d]">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-[#58a6ff]" />
            <h3 className="text-sm font-bold text-white">
              {currentSnippet.explanation.title}
            </h3>
          </div>
          <p className="text-xs text-[#8b949e] mb-4 leading-relaxed">
            {currentSnippet.explanation.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentSnippet.explanation.steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#161b22] border border-[#21262d]"
              >
                <div className="text-[11px] font-mono text-[#58a6ff] mb-1">
                  {step.lineRange}
                </div>
                <div className="text-xs font-bold text-white mb-1">
                  {step.concept}
                </div>
                <div className="text-xs text-[#8b949e] leading-relaxed">
                  {step.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
