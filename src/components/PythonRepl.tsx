/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  Terminal,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Code,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { runPythonCode, PythonExecutionResult } from '../services/pythonRunner';
import { REPL_SAMPLES } from '../data/pythonSnippets';

export const PythonRepl: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<string>(REPL_SAMPLES[0].id);
  const [code, setCode] = useState<string>(REPL_SAMPLES[0].code);
  const [output, setOutput] = useState<string>('Clique em "Executar Python" para rodar o script no navegador.\n');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionStats, setExecutionStats] = useState<{ timeMs: number; status: 'ok' | 'error' | null }>({
    timeMs: 0,
    status: null,
  });
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    const sample = REPL_SAMPLES.find((s) => s.id === sampleId);
    if (sample) {
      setCode(sample.code);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setExecutionStats({ timeMs: 0, status: null });

    try {
      const result: PythonExecutionResult = await runPythonCode(code);
      setExecutionStats({
        timeMs: result.executionTimeMs,
        status: result.success ? 'ok' : 'error',
      });

      let display = '';
      if (result.output) {
        display += result.output;
      }
      if (result.result !== undefined && result.result !== 'None') {
        if (display && !display.endsWith('\n')) display += '\n';
        display += `>>> ${result.result}\n`;
      }
      if (result.error) {
        if (display && !display.endsWith('\n')) display += '\n';
        display += `❌ ${result.error}\n`;
      }
      if (!display) {
        display = '(Script executado sem saídas via print)\n';
      }

      setOutput(display);
    } catch (err: any) {
      setExecutionStats({ timeMs: 0, status: 'error' });
      setOutput(`Erro crítico: ${err.message || String(err)}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearOutput = () => {
    setOutput('');
    setExecutionStats({ timeMs: 0, status: null });
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetCode = () => {
    const sample = REPL_SAMPLES.find((s) => s.id === selectedSample);
    if (sample) {
      setCode(sample.code);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Title & Description */}
      <div className="pb-6 border-b border-[#21262d]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Terminal REPL & Executador Python
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Escreva e execute códigos matemáticos em Python diretamente no seu navegador com suporte a <code className="text-[#58a6ff]">math</code> e <code className="text-[#58a6ff]">statistics</code>.
            </p>
          </div>

          {/* Sample preset buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {REPL_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedSample === sample.id
                    ? 'bg-[#238636] text-white shadow-sm font-semibold'
                    : 'bg-[#161b22] text-[#8b949e] hover:text-white border border-[#30363d]'
                }`}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Code Editor & Output Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-stretch">
        {/* Editor Box */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-lg">
          {/* Editor Header */}
          <div className="px-4 py-3 bg-[#0c1017] border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
              <Code className="w-4 h-4 text-[#58a6ff]" />
              <span>script_calculo.py</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCode}
                className="p-1.5 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-md transition-colors"
                title="Restaurar código original"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#238636] hover:bg-[#2ea043] rounded-md transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isRunning ? 'Executando...' : 'Executar'}</span>
              </button>
            </div>
          </div>

          {/* Editor Textarea */}
          <div className="flex-1 relative bg-[#0c1017]">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 font-mono text-xs sm:text-sm text-[#e6edf3] bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-[#58a6ff] leading-relaxed selection:bg-[#264f78]"
              spellCheck={false}
              placeholder="# Digite seu código Python aqui..."
            />
          </div>

          {/* Editor Footer */}
          <div className="px-4 py-2 bg-[#0c1017] border-t border-[#21262d] text-[11px] text-[#6e7681] flex items-center justify-between">
            <span>Dica: Use <code className="text-[#8b949e]">print()</code> para exibir valores</span>
            <span>UTF-8 · Python 3</span>
          </div>
        </div>

        {/* Terminal Output Box */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-lg">
          {/* Terminal Header */}
          <div className="px-4 py-3 bg-[#0c1017] border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
              <Terminal className="w-4 h-4 text-[#f5b731]" />
              <span>Saída do Terminal (stdout)</span>
            </div>
            <div className="flex items-center gap-2">
              {executionStats.status && (
                <div className="flex items-center gap-1 text-[11px] text-[#8b949e] font-mono mr-2">
                  <Clock className="w-3 h-3" />
                  <span>{executionStats.timeMs}ms</span>
                </div>
              )}
              <button
                onClick={handleCopyOutput}
                className="p-1.5 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-md transition-colors"
                title="Copiar saída do terminal"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#238636]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleClearOutput}
                className="p-1.5 text-xs text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded-md transition-colors"
                title="Limpar tela do terminal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Display Screen */}
          <div className="flex-1 p-4 bg-[#05080c] font-mono text-xs sm:text-sm text-[#7ee787] overflow-y-auto whitespace-pre-wrap leading-relaxed selection:bg-[#264f78]">
            {output}
          </div>

          {/* Terminal Status bar */}
          <div className="px-4 py-2 bg-[#0c1017] border-t border-[#21262d] text-[11px] text-[#8b949e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? 'bg-[#d29922] animate-pulse'
                    : executionStats.status === 'ok'
                    ? 'bg-[#238636]'
                    : executionStats.status === 'error'
                    ? 'bg-[#f85149]'
                    : 'bg-[#58a6ff]'
                }`}
              ></span>
              <span>
                {isRunning
                  ? 'Executando processo Python...'
                  : executionStats.status === 'ok'
                  ? 'Execução finalizada com sucesso (Exit 0)'
                  : executionStats.status === 'error'
                  ? 'Erro na execução (Exit 1)'
                  : 'Pronto para executar'}
              </span>
            </div>
            <span className="font-mono text-[#6e7681]">Pyodide WASM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
