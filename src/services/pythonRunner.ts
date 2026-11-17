/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Python Runner with Pyodide integration + instant safe math engine fallback

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
  }
}

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

export async function getPyodide(onProgress?: (status: string) => void): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = (async () => {
    try {
      if (onProgress) onProgress('Carregando script do Pyodide WebAssembly...');

      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Falha ao carregar CDN do Pyodide'));
          document.head.appendChild(script);
        });
      }

      if (onProgress) onProgress('Inicializando ambiente Python CPython...');
      if (window.loadPyodide) {
        pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        });
        // Pre-import common math and statistics
        await pyodideInstance.runPythonAsync(`
import math
import statistics
`);
        if (onProgress) onProgress('Python pronto!');
        return pyodideInstance;
      }
      throw new Error('Pyodide não disponível');
    } catch (err) {
      pyodideLoadingPromise = null;
      throw err;
    }
  })();

  return pyodideLoadingPromise;
}

export interface PythonExecutionResult {
  success: boolean;
  output: string;
  result?: string;
  error?: string;
  executionTimeMs: number;
}

/**
 * Executes arbitrary Python code with stdout/stderr capture
 */
export async function runPythonCode(code: string): Promise<PythonExecutionResult> {
  const startTime = performance.now();

  try {
    const pyodide = await getPyodide();

    // Setup stdout capture
    await pyodide.runPythonAsync(`
import sys
import io

class CapturingStdout(io.StringIO):
    def __init__(self):
        super().__init__()
        self.captured = []
    def write(self, s):
        super().write(s)
        self.captured.append(s)

_sys_stdout_backup = sys.stdout
_sys_stderr_backup = sys.stderr
sys.stdout = CapturingStdout()
sys.stderr = CapturingStdout()
`);

    let evalResult: any = undefined;
    let evalError: string | null = null;

    try {
      evalResult = await pyodide.runPythonAsync(code);
    } catch (err: any) {
      evalError = err.message || String(err);
    }

    const stdoutResult = await pyodide.runPythonAsync(`
out = sys.stdout.getvalue()
err = sys.stderr.getvalue()
sys.stdout = _sys_stdout_backup
sys.stderr = _sys_stderr_backup
(out, err)
`);

    const [outText, errText] = stdoutResult.toJs();
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    if (evalError) {
      // Clean Python traceback for user friendliness
      const cleanedError = evalError.replace(/^PythonError:\s*/, '');
      return {
        success: false,
        output: outText + (errText ? '\n' + errText : ''),
        error: cleanedError,
        executionTimeMs,
      };
    }

    const output = outText + (errText ? '\n' + errText : '');
    let formattedResult: string | undefined = undefined;

    if (evalResult !== undefined && evalResult !== null) {
      formattedResult = String(evalResult);
    }

    return {
      success: true,
      output,
      result: formattedResult,
      executionTimeMs,
    };
  } catch (globalErr: any) {
    // If Pyodide fails to initialize or offline, fallback to safe JS math evaluator
    const endTime = performance.now();
    try {
      const fallback = safeEvaluatePythonMath(code);
      return {
        success: true,
        output: '',
        result: String(fallback),
        executionTimeMs: Math.round(endTime - startTime),
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        output: '',
        error: globalErr.message || fallbackErr.message || 'Erro de execução Python',
        executionTimeMs: Math.round(endTime - startTime),
      };
    }
  }
}

/**
 * Fast synchronous Python math expression evaluator (handles standard math, powers, floor division)
 */
export function safeEvaluatePythonMath(expr: string): number {
  if (!expr || !expr.trim()) return 0;

  let sanitized = expr.trim();

  // Replace Python constants
  sanitized = sanitized
    .replace(/\bmath\.pi\b/g, String(Math.PI))
    .replace(/\bmath\.e\b/g, String(Math.E))
    .replace(/\bmath\.tau\b/g, String(Math.PI * 2))
    .replace(/\bpi\b/g, String(Math.PI))
    .replace(/\be\b/g, String(Math.E));

  // Replace math functions
  sanitized = sanitized
    .replace(/\bmath\.sqrt\b/g, 'Math.sqrt')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\bmath\.sin\b/g, 'Math.sin')
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bmath\.cos\b/g, 'Math.cos')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\bmath\.tan\b/g, 'Math.tan')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\bmath\.log10\b/g, 'Math.log10')
    .replace(/\bmath\.log\b/g, 'Math.log')
    .replace(/\blog\b/g, 'Math.log')
    .replace(/\bmath\.exp\b/g, 'Math.exp')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bround\b/g, 'Math.round');

  // Replace Python operators:
  // ** -> ** (already JS power)
  // // -> Math.floor(a / b) - replace simple occurrences
  sanitized = sanitized.replace(/(\d+(\.\d+)?)\s*\/\/\s*(\d+(\.\d+)?)/g, 'Math.floor($1 / $3)');

  // Validate allowed tokens: numbers, operators, Math.*, parentheses
  const allowed = /^[0-9+\-*/().,% Math.sqrteincoablgf,\s]+$/;
  if (!allowed.test(sanitized)) {
    throw new Error('Expressão contém caracteres inválidos');
  }

  // Evaluate safely
  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${sanitized});`);
  const result = fn();

  if (typeof result !== 'number' || isNaN(result)) {
    throw new Error('Resultado numérico indefinido');
  }
  if (!isFinite(result)) {
    throw new Error('Divisão por zero ou valor infinito');
  }

  return result;
}
