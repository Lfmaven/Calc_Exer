/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw,
  Delete,
  Copy,
  Check,
  Code2,
  Clock,
  Sparkles,
  Equal,
} from 'lucide-react';
import { safeEvaluatePythonMath, runPythonCode } from '../services/pythonRunner';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export const Calculator: React.FC = () => {
  const [expression, setExpression] = useState<string>('0');
  const [resultPreview, setResultPreview] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 'h1',
      expression: '12 * 8 + 4',
      result: '100',
      timestamp: 'Exemplo',
    },
    {
      id: 'h2',
      expression: 'math.sqrt(144) + 2**3',
      result: '20',
      timestamp: 'Exemplo',
    },
  ]);
  const [mode, setMode] = useState<'padrao' | 'cientifica'>('padrao');
  const [memory, setMemory] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isExecutingPython, setIsExecutingPython] = useState<boolean>(false);
  const displayEndRef = useRef<HTMLDivElement>(null);

  // Live evaluate preview when expression changes
  useEffect(() => {
    if (!expression || expression === '0') {
      setResultPreview('');
      setLastError(null);
      return;
    }

    try {
      const res = safeEvaluatePythonMath(expression);
      setResultPreview(formatNumber(res));
      setLastError(null);
    } catch {
      // Expression might be incomplete while typing
      setResultPreview('');
    }
  }, [expression]);

  const formatNumber = (num: number): string => {
    if (Number.isInteger(num)) return num.toString();
    // Round to 8 decimal places to avoid floating point imprecision
    return parseFloat(num.toFixed(8)).toString();
  };

  const handleInput = useCallback((val: string) => {
    setLastError(null);
    setExpression((prev) => {
      if (prev === '0' && !['+', '-', '*', '/', '.', '**', '//', '%'].includes(val)) {
        return val;
      }
      return prev + val;
    });
  }, []);

  const handleClear = () => {
    setExpression('0');
    setResultPreview('');
    setLastError(null);
  };

  const handleBackspace = () => {
    setLastError(null);
    setExpression((prev) => {
      if (prev.length <= 1 || prev === '0') return '0';
      // If ends with a function call like 'math.sqrt(' delete entire token
      const funcs = ['math.sqrt(', 'math.sin(', 'math.cos(', 'math.tan(', 'math.log10(', 'math.log(', 'math.exp(', 'abs(', 'round('];
      for (const fn of funcs) {
        if (prev.endsWith(fn)) {
          const cut = prev.slice(0, -fn.length);
          return cut.length === 0 ? '0' : cut;
        }
      }
      return prev.slice(0, -1);
    });
  };

  const handleCalculate = async () => {
    if (!expression || expression === '0') return;

    setIsExecutingPython(true);
    setLastError(null);

    try {
      // First try local fast math
      let computedResult: string = '';
      try {
        const val = safeEvaluatePythonMath(expression);
        computedResult = formatNumber(val);
      } catch {
        // Fallback to real Python runner
        const res = await runPythonCode(expression);
        if (res.success && res.result !== undefined) {
          computedResult = res.result;
        } else {
          throw new Error(res.error || 'Erro de sintaxe');
        }
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setHistory((prev) => [
        {
          id: Date.now().toString(),
          expression,
          result: computedResult,
          timestamp: timeStr,
        },
        ...prev.slice(0, 19),
      ]);

      setExpression(computedResult);
      setResultPreview('');
    } catch (err: any) {
      setLastError(err.message || 'Erro no cálculo');
    } finally {
      setIsExecutingPython(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key);
      } else if (['+', '-', '*', '/', '(', ')', '.', '%'].includes(e.key)) {
        handleInput(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, handleCalculate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Memory functions
  const handleMemoryAdd = () => {
    try {
      const val = safeEvaluatePythonMath(expression);
      setMemory((prev) => prev + val);
    } catch {
      // ignore
    }
  };

  const handleMemorySub = () => {
    try {
      const val = safeEvaluatePythonMath(expression);
      setMemory((prev) => prev - val);
    } catch {
      // ignore
    }
  };

  const handleMemoryRecall = () => {
    setExpression((prev) => (prev === '0' ? String(memory) : prev + String(memory)));
  };

  const handleMemoryClear = () => {
    setMemory(0);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Banner / Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#21262d]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Calculadora em Python
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">
              Sintaxe Python 3
            </span>
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Execute operações com operadores nativos do Python (<code className="text-[#f5b731] font-mono">**</code>, <code className="text-[#f5b731] font-mono">//</code>, <code className="text-[#f5b731] font-mono">%</code>) e funções da biblioteca <code className="text-[#58a6ff] font-mono">math</code>.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#161b22] border border-[#30363d] rounded-lg self-start md:self-center">
          <button
            onClick={() => setMode('padrao')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'padrao'
                ? 'bg-[#21262d] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            Padrão (+, -, *, /, **, //)
          </button>
          <button
            onClick={() => setMode('cientifica')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'cientifica'
                ? 'bg-[#21262d] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            Científica (math.sqrt, sin, log)
          </button>
        </div>
      </div>

      {/* Main Grid: Calculator Body + History/Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Calculator Hardware Unit */}
        <div className="lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden p-4 sm:p-6">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between text-xs text-[#8b949e] mb-3">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#238636]"></span>
              <span>CPython Runtime</span>
              {memory !== 0 && (
                <span className="text-[#f5b731] font-bold ml-2">M = {memory}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(`resultado = ${expression}`)}
                className="flex items-center gap-1 hover:text-[#58a6ff] transition-colors"
                title="Copiar expressão em código Python"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#238636]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Python</span>
              </button>
            </div>
          </div>

          {/* Calculator Screen / Display */}
          <div className="bg-[#0c1017] border border-[#30363d] rounded-xl p-4 sm:p-5 mb-5 shadow-inner">
            {/* Expression line */}
            <div className="min-h-[2.5rem] flex items-center justify-end overflow-x-auto text-[#8b949e] font-mono text-sm sm:text-base tracking-wide select-all">
              <span>{expression}</span>
              <div ref={displayEndRef} />
            </div>

            {/* Live Result or Error */}
            <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-[#21262d]">
              <div className="text-xs text-[#58a6ff] font-mono flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>Python eval()</span>
              </div>
              <div className="text-right">
                {lastError ? (
                  <span className="text-xs sm:text-sm font-mono text-[#f85149] font-semibold">
                    {lastError}
                  </span>
                ) : resultPreview ? (
                  <span className="text-lg sm:text-2xl font-mono font-bold text-[#e6edf3] tabular-nums">
                    = {resultPreview}
                  </span>
                ) : (
                  <span className="text-lg sm:text-2xl font-mono font-bold text-[#e6edf3] tabular-nums">
                    {expression === '0' ? '0' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Memory Bar */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              onClick={handleMemoryClear}
              className="py-1.5 text-xs font-mono font-semibold text-[#8b949e] bg-[#21262d] hover:bg-[#30363d] hover:text-white rounded-lg transition-colors border border-[#30363d]"
              title="Memory Clear (Zerar memória)"
            >
              MC
            </button>
            <button
              onClick={handleMemoryRecall}
              className="py-1.5 text-xs font-mono font-semibold text-[#8b949e] bg-[#21262d] hover:bg-[#30363d] hover:text-white rounded-lg transition-colors border border-[#30363d]"
              title="Memory Recall (Inserir memória)"
            >
              MR
            </button>
            <button
              onClick={handleMemoryAdd}
              className="py-1.5 text-xs font-mono font-semibold text-[#8b949e] bg-[#21262d] hover:bg-[#30363d] hover:text-white rounded-lg transition-colors border border-[#30363d]"
              title="Memory Plus (Somar à memória)"
            >
              M+
            </button>
            <button
              onClick={handleMemorySub}
              className="py-1.5 text-xs font-mono font-semibold text-[#8b949e] bg-[#21262d] hover:bg-[#30363d] hover:text-white rounded-lg transition-colors border border-[#30363d]"
              title="Memory Minus (Subtrair da memória)"
            >
              M-
            </button>
          </div>

          {/* Scientific Functions Grid (Visible when in 'cientifica' mode) */}
          {mode === 'cientifica' && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4 p-3 bg-[#0c1017]/60 border border-[#21262d] rounded-xl">
              <button
                onClick={() => handleInput('math.sqrt(')}
                className="py-2 text-xs font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Raiz Quadrada math.sqrt(x)"
              >
                √x
              </button>
              <button
                onClick={() => handleInput('**2')}
                className="py-2 text-xs font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Quadrado x**2"
              >
                x²
              </button>
              <button
                onClick={() => handleInput('**')}
                className="py-2 text-xs font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Potência x**y"
              >
                x^y
              </button>
              <button
                onClick={() => handleInput('math.sin(')}
                className="py-2 text-xs font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Seno math.sin(rad)"
              >
                sin
              </button>
              <button
                onClick={() => handleInput('math.cos(')}
                className="py-2 text-xs font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Cosseno math.cos(rad)"
              >
                cos
              </button>

              <button
                onClick={() => handleInput('math.tan(')}
                className="py-2 text-xs font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Tangente math.tan(rad)"
              >
                tan
              </button>
              <button
                onClick={() => handleInput('math.log(')}
                className="py-2 text-xs font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Logaritmo Natural ln(x)"
              >
                ln
              </button>
              <button
                onClick={() => handleInput('math.log10(')}
                className="py-2 text-xs font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Logaritmo Base 10"
              >
                log10
              </button>
              <button
                onClick={() => handleInput('math.pi')}
                className="py-2 text-xs font-mono font-semibold text-[#f5b731] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Constante Pi (3.14159...)"
              >
                π (pi)
              </button>
              <button
                onClick={() => handleInput('math.e')}
                className="py-2 text-xs font-mono font-semibold text-[#f5b731] bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                title="Constante Euler e (2.71828...)"
              >
                e
              </button>
            </div>
          )}

          {/* Main Keypad */}
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {/* Row 1: Clear / Backspace / Special Python operators */}
            <button
              onClick={handleClear}
              className="py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-[#f85149] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
              title="Limpar Tudo (Escape)"
            >
              C
            </button>
            <button
              onClick={() => handleInput('//')}
              className="py-3 sm:py-3.5 text-xs sm:text-sm font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
              title="Divisão Inteira do Python (ex: 7 // 2 = 3)"
            >
              //
            </button>
            <button
              onClick={() => handleInput('%')}
              className="py-3 sm:py-3.5 text-xs sm:text-sm font-mono font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
              title="Módulo / Resto da Divisão (ex: 7 % 2 = 1)"
            >
              %
            </button>
            <button
              onClick={() => handleInput('/')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-mono font-bold text-white bg-[#1f6feb] hover:bg-[#388bfd] rounded-xl transition-all active:scale-95 shadow-sm"
              title="Divisão Decimal"
            >
              /
            </button>

            {/* Row 2: 7, 8, 9, * */}
            <button
              onClick={() => handleInput('7')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              7
            </button>
            <button
              onClick={() => handleInput('8')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              8
            </button>
            <button
              onClick={() => handleInput('9')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              9
            </button>
            <button
              onClick={() => handleInput('*')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-mono font-bold text-white bg-[#1f6feb] hover:bg-[#388bfd] rounded-xl transition-all active:scale-95 shadow-sm"
              title="Multiplicação"
            >
              *
            </button>

            {/* Row 3: 4, 5, 6, - */}
            <button
              onClick={() => handleInput('4')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              4
            </button>
            <button
              onClick={() => handleInput('5')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              5
            </button>
            <button
              onClick={() => handleInput('6')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              6
            </button>
            <button
              onClick={() => handleInput('-')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-mono font-bold text-white bg-[#1f6feb] hover:bg-[#388bfd] rounded-xl transition-all active:scale-95 shadow-sm"
              title="Subtração"
            >
              -
            </button>

            {/* Row 4: 1, 2, 3, + */}
            <button
              onClick={() => handleInput('1')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              1
            </button>
            <button
              onClick={() => handleInput('2')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              2
            </button>
            <button
              onClick={() => handleInput('3')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              3
            </button>
            <button
              onClick={() => handleInput('+')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-mono font-bold text-white bg-[#1f6feb] hover:bg-[#388bfd] rounded-xl transition-all active:scale-95 shadow-sm"
              title="Adição"
            >
              +
            </button>

            {/* Row 5: 0, ., Backspace, = */}
            <button
              onClick={() => handleInput('0')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              0
            </button>
            <button
              onClick={() => handleInput('.')}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 border border-[#30363d]"
            >
              .
            </button>
            <button
              onClick={handleBackspace}
              className="py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-[#d29922] bg-[#21262d] hover:bg-[#30363d] rounded-xl transition-all active:scale-95 flex items-center justify-center border border-[#30363d]"
              title="Apagar último caractere"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              onClick={handleCalculate}
              disabled={isExecutingPython}
              className="py-3 sm:py-3.5 text-base sm:text-lg font-mono font-bold text-white bg-[#238636] hover:bg-[#2ea043] rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-1"
              title="Calcular (Enter)"
            >
              {isExecutingPython ? (
                <span className="animate-spin text-xs">...</span>
              ) : (
                <Equal className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Python Quick Reference Strip */}
          <div className="mt-5 pt-4 border-t border-[#21262d] text-xs text-[#8b949e] flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-white">Operadores Python:</span>
              <span><code className="text-[#f5b731]">**</code> potência</span>
              <span>·</span>
              <span><code className="text-[#58a6ff]">//</code> divisão inteira</span>
              <span>·</span>
              <span><code className="text-[#e6edf3]">%</code> resto</span>
            </span>
            <span className="text-[11px] text-[#6e7681]">Suporta teclado físico</span>
          </div>
        </div>

        {/* Right Column: History & Python Interactive Inspector */}
        <div className="lg:col-span-5 space-y-5">
          {/* Calculation History Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="text-sm font-bold text-white">Histórico de Cálculos</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-xs text-[#8b949e] hover:text-[#f85149] transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8b949e]">
                  Nenhum cálculo recente. Digite uma conta ou use o teclado.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-[#0c1017] border border-[#21262d] hover:border-[#388bfd]/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="overflow-hidden pr-2">
                      <div className="font-mono text-xs text-[#8b949e] truncate">
                        {item.expression}
                      </div>
                      <div className="font-mono text-sm font-bold text-[#e6edf3] tabular-nums">
                        = {item.result}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                      <button
                        onClick={() => setExpression(item.result)}
                        className="p-1 text-xs text-[#58a6ff] hover:bg-[#21262d] rounded transition-colors"
                        title="Usar resultado no visor"
                      >
                        Usar
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.result)}
                        className="p-1 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
                        title="Copiar resultado"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Python Syntax Conversion Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#21262d]">
              <Sparkles className="w-4 h-4 text-[#f5b731]" />
              <h3 className="text-sm font-bold text-white">Como fica em Python puro?</h3>
            </div>
            <p className="text-xs text-[#8b949e] mt-2.5 mb-3 leading-relaxed">
              Veja exatamente a linha de código equivalente em Python para usar nos seus próprios scripts:
            </p>
            <div className="p-3 bg-[#0c1017] rounded-xl border border-[#21262d] font-mono text-xs text-[#e6edf3] overflow-x-auto">
              <span className="text-[#f5b731]">import</span> math
              <br />
              <span className="text-[#8b949e]"># Cálculo atual</span>
              <br />
              <span className="text-[#79c0ff]">resultado</span> ={' '}
              <span className="text-[#a5d6ff]">
                {expression.replace(/\s+/g, ' ')}
              </span>
              <br />
              <span className="text-[#7ee787]">print</span>(f
              <span className="text-[#a5d6ff]">"Resultado: &#123;resultado&#125;"</span>)
            </div>
            <button
              onClick={() => {
                const codeSnippet = `import math\nresultado = ${expression}\nprint(f"Resultado: {resultado}")\n`;
                copyToClipboard(codeSnippet);
              }}
              className="mt-3 w-full py-2 px-3 text-xs font-semibold text-[#58a6ff] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Trecho Python</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
