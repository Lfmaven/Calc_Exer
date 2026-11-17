/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Terminal,
  HelpCircle,
  Copy,
  Check,
  Cpu,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export const GuideSection: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const operators = [
    { op: '+', name: 'Adição', example: '10 + 5', result: '15', desc: 'Soma dois valores' },
    { op: '-', name: 'Subtração', example: '10 - 4', result: '6', desc: 'Diferença entre valores' },
    { op: '*', name: 'Multiplicação', example: '6 * 7', result: '42', desc: 'Produto dos fatores' },
    { op: '/', name: 'Divisão Real', example: '7 / 2', result: '3.5', desc: 'Retorna sempre float' },
    { op: '//', name: 'Divisão Inteira', example: '7 // 2', result: '3', desc: 'Descarta a parte decimal' },
    { op: '%', name: 'Módulo (Resto)', example: '7 % 2', result: '1', desc: 'Resto da divisão inteira' },
    { op: '**', name: 'Exponenciação', example: '2 ** 8', result: '256', desc: 'Potência base ** expoente' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Title */}
      <div className="pb-6 border-b border-[#21262d]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Como Rodar a Calculadora no seu Computador
        </h1>
        <p className="text-sm text-[#8b949e] mt-1">
          Guia prático para executar os arquivos Python baixados em qualquer sistema operacional (Windows, Mac ou Linux).
        </p>
      </div>

      {/* Step by Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {/* Step 1 */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 flex items-center justify-center font-bold text-sm mb-3">
              1
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Verifique o Python
            </h3>
            <p className="text-xs text-[#8b949e] leading-relaxed mb-4">
              Abra o Prompt de Comando (CMD) ou Terminal e verifique se o Python está instalado:
            </p>
          </div>
          <div className="p-3 bg-[#0c1017] rounded-xl border border-[#21262d] flex items-center justify-between font-mono text-xs text-[#7ee787]">
            <span>python --version</span>
            <button
              onClick={() => copyCommand('python --version')}
              className="text-[#8b949e] hover:text-white transition-colors"
            >
              {copiedCmd === 'python --version' ? (
                <Check className="w-3.5 h-3.5 text-[#238636]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#238636]/20 text-[#2ea043] border border-[#238636]/30 flex items-center justify-center font-bold text-sm mb-3">
              2
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Baixe o Arquivo .py
            </h3>
            <p className="text-xs text-[#8b949e] leading-relaxed mb-4">
              Clique no botão verde superior ou na aba <strong className="text-white">Códigos Fonte</strong> e baixe o script para uma pasta conhecida (ex: Documentos ou Downloads).
            </p>
          </div>
          <div className="p-3 bg-[#0c1017] rounded-xl border border-[#21262d] text-xs text-[#8b949e]">
            Arquivo: <span className="font-mono text-[#58a6ff]">calculadora_terminal.py</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#f5b731]/20 text-[#f5b731] border border-[#f5b731]/30 flex items-center justify-center font-bold text-sm mb-3">
              3
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Execute no Terminal
            </h3>
            <p className="text-xs text-[#8b949e] leading-relaxed mb-4">
              Navegue até a pasta onde salvou o arquivo e execute o comando:
            </p>
          </div>
          <div className="p-3 bg-[#0c1017] rounded-xl border border-[#21262d] flex items-center justify-between font-mono text-xs text-[#7ee787]">
            <span>python calculadora_terminal.py</span>
            <button
              onClick={() => copyCommand('python calculadora_terminal.py')}
              className="text-[#8b949e] hover:text-white transition-colors"
            >
              {copiedCmd === 'python calculadora_terminal.py' ? (
                <Check className="w-3.5 h-3.5 text-[#238636]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Python Operators Cheat Sheet Table */}
      <div className="mt-10 bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#58a6ff]" />
            <h2 className="text-base font-bold text-white">
              Tabela de Operadores Matemáticos em Python
            </h2>
          </div>
          <span className="text-xs text-[#8b949e]">Python 3 Built-in</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#21262d] bg-[#0c1017]/50 text-[#8b949e]">
                <th className="py-3 px-4 font-semibold">Operador</th>
                <th className="py-3 px-4 font-semibold">Nome</th>
                <th className="py-3 px-4 font-semibold">Exemplo em Python</th>
                <th className="py-3 px-4 font-semibold text-right">Resultado</th>
                <th className="py-3 px-4 font-semibold">Comportamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
              {operators.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#21262d]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#f5b731]">
                    {item.op}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#58a6ff]">
                    {item.example}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#7ee787] font-semibold text-right tabular-nums">
                    {item.result}
                  </td>
                  <td className="py-3 px-4 text-[#8b949e]">
                    {item.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Practices & Common Errors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {/* Exception Handling */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#d29922]" />
            <h3 className="text-sm font-bold text-white">
              Tratamento de Exceções Essencial
            </h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed mb-3">
            Ao construir uma calculadora em Python, os dois erros mais comuns que quebram a execução são:
          </p>
          <ul className="text-xs text-[#c9d1d9] space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-mono text-[#f85149] shrink-0">ZeroDivisionError</span>
              <span>Ocorre quando o usuário tenta dividir qualquer número por 0. Capture com <code className="text-[#58a6ff]">try...except ZeroDivisionError</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-[#f85149] shrink-0">ValueError</span>
              <span>Ocorre quando o usuário digita letras ou símbolos onde um número float era esperado na função <code className="text-[#58a6ff]">float(input())</code>.</span>
            </li>
          </ul>
        </div>

        {/* Quick Tips */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[#2ea043]" />
            <h3 className="text-sm font-bold text-white">
              Dica: Biblioteca Nativa math
            </h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed mb-3">
            Para operações avançadas, você não precisa instalar nenhuma biblioteca externa com pip. A biblioteca <code className="text-[#58a6ff]">math</code> já vem embutida no Python:
          </p>
          <div className="p-3 bg-[#0c1017] rounded-xl border border-[#21262d] font-mono text-xs text-[#e6edf3]">
            <span className="text-[#f5b731]">import</span> math<br />
            raiz = math.sqrt(<span className="text-[#79c0ff]">144</span>) <span className="text-[#8b949e]"># 12.0</span><br />
            seno = math.sin(math.pi / <span className="text-[#79c0ff]">2</span>) <span className="text-[#8b949e]"># 1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
