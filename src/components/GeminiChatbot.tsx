/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Square,
  Globe,
  MapPin,
  Bot,
  User,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

export interface GroundingSource {
  type: 'web' | 'maps';
  title: string;
  uri: string;
  reviewSnippets?: Array<{ uri?: string; text?: string; author?: string }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  groundingMode?: 'none' | 'search' | 'maps';
  sources?: GroundingSource[];
  timestamp: string;
}

interface GeminiChatbotProps {
  initialPrompt?: string | null;
  onConsumeInitialPrompt?: () => void;
}

const CHAT_MODELS = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Geral · gemini-4-hydrogen',
    description: 'Uso geral, tutoria Python e suporte a Search/Maps',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Rápido · gemini-3.1-flash-lite',
    description: 'Baixa latência para respostas rápidas',
  },
  {
    id: 'gemini-4-carbon',
    label: 'Raciocínio Profundo · gemini-4-carbon',
    description: 'Provas matemáticas, depuração profunda e arquitetura',
  },
  {
    id: 'gemini-4-argon',
    label: 'Interativo Complexo · gemini-4-argon',
    description: 'Tarefas STEM complexas e geração avançada de código',
  },
] as const;

const ROLE_PRESETS = [
  {
    id: 'tutor',
    label: 'Tutor Python & Matemática',
    instruction:
      'Você é um tutor especialista em Python e matemática aplicada no Python Calculator Studio. Explique conceitos com clareza, passo a passo, e forneça exemplos executáveis em Python 3 sempre que ajudar.',
  },
  {
    id: 'engineer',
    label: 'Engenheiro Python Sênior',
    instruction:
      'Você é um engenheiro de software sênior especialista em Python. Analise algoritmos, complexidade, tipagem (type hints), tratamento de exceções e boas práticas PEP8 com objetividade.',
  },
  {
    id: 'researcher',
    label: 'Pesquisador Web & Docs',
    instruction:
      'Você é um pesquisador técnico que responde usando informações atualizadas da web, documentações oficiais de bibliotecas Python e dados recentes com referências verificáveis.',
  },
  {
    id: 'places',
    label: 'Guia de Locais & Campus',
    instruction:
      'Você é um guia geográfico especializado em localizar universidades, bibliotecas, livrarias técnicas, espaços de coworking e pontos de interesse usando dados reais do Google Maps.',
  },
];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const FormattedMessageContent: React.FC<{ text: string }> = ({ text }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const parts = text.split(/(```[\s\S]*?```)/g);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  return (
    <div className="space-y-2.5 text-sm leading-relaxed break-words">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const lang = lines[0]?.trim() || 'python';
          const codeBody = (lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines.slice(1) : lines).join('\n').trim();

          return (
            <div
              key={idx}
              className="rounded-xl overflow-hidden border border-[#30363d] bg-[#05080c] my-2"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0c1017] border-b border-[#21262d] text-xs font-mono text-[#8b949e]">
                <span>{lang}</span>
                <button
                  onClick={() => handleCopyCode(codeBody, idx)}
                  className="inline-flex items-center gap-1 text-[#8b949e] hover:text-white transition-colors"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-[#238636]" />
                      <span className="text-[#238636]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto font-mono text-xs text-[#e6edf3]">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        return (
          <div key={idx} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      })}
    </div>
  );
};

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  initialPrompt,
  onConsumeInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Olá! Sou o assistente do Python Calculator Studio. Posso explicar fórmulas matemáticas, gerar scripts Python, pesquisar documentação atualizada no Google Search ou localizar livrarias, universidades e espaços de estudo no Google Maps.',
      modelUsed: 'gemini-4-hydrogen',
      groundingMode: 'none',
      timestamp: 'Agora',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-4-hydrogen');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('tutor');
  const [systemInstruction, setSystemInstruction] = useState<string>(ROLE_PRESETS[0].instruction);
  const [showSystemEditor, setShowSystemEditor] = useState<boolean>(false);
  const [groundingMode, setGroundingMode] = useState<'none' | 'search' | 'maps'>('none');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Audio dictation state (gemini-3.5-transcribe)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInput(initialPrompt);
      onConsumeInitialPrompt?.();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const preset = ROLE_PRESETS.find((r) => r.id === roleId);
    if (preset) {
      setSystemInstruction(preset.instruction);
    }
    if (roleId === 'researcher') {
      setGroundingMode('search');
    } else if (roleId === 'places') {
      enableMapsGrounding();
    }
  };

  const enableMapsGrounding = () => {
    setGroundingMode('maps');
    if (navigator.geolocation) {
      setLocationStatus('Obtendo localização...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLocationStatus('Localização ativa');
        },
        () => {
          setLocationStatus('Sem GPS (busca por texto)');
        },
        { timeout: 6000 }
      );
    } else {
      setLocationStatus('Geolocalização indisponível');
    }
  };

  const handleToggleGrounding = (mode: 'none' | 'search' | 'maps') => {
    setError(null);
    if (mode === 'maps') {
      if (groundingMode === 'maps') {
        setGroundingMode('none');
        setLocationStatus('');
      } else {
        enableMapsGrounding();
      }
      return;
    }
    if (mode === 'search') {
      setGroundingMode(groundingMode === 'search' ? 'none' : 'search');
      return;
    }
    setGroundingMode('none');
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: now,
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          systemInstruction,
          history: historyPayload,
          message: trimmed,
          groundingMode,
          location: groundingMode === 'maps' ? userLocation ?? undefined : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao obter resposta do Gemini.');
      }

      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.text || '(Sem texto retornado)',
        modelUsed: data.modelUsed,
        groundingMode: data.groundingMode,
        sources: Array.isArray(data.sources) ? data.sources : [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setError(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = async () => {
    setError(null);
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(audioBlob);
          const res = await fetch('/api/gemini/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64,
              mimeType,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Erro ao transcrever áudio.');
          }
          if (data.text) {
            setInput((prev) => (prev ? `${prev.trim()} ${data.text.trim()}` : data.text.trim()));
          }
        } catch (err: any) {
          setError(err.message || 'Falha na transcrição de áudio.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError('Permissão de microfone negada ou dispositivo indisponível.');
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: 'Histórico limpo. Inicie uma nova conversa sobre Python, cálculos, pesquisas na web ou locais no Google Maps.',
        modelUsed: groundingMode === 'none' ? selectedModel : 'gemini-4-hydrogen',
        groundingMode: 'none',
        timestamp: 'Agora',
      },
    ]);
    setError(null);
  };

  const effectiveModelLabel =
    groundingMode !== 'none'
      ? 'gemini-4-hydrogen (Grounding ativo)'
      : selectedModel;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Config Panel */}
      <aside className="lg:col-span-4 bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Configuração do Chat</h2>
          <p className="text-xs text-[#8b949e]">
            Escolha o modelo por complexidade, o papel do assistente e fontes em tempo real.
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-[#c9d1d9] mb-2">
            Modelo por Tipo de Tarefa
          </label>
          <div className="space-y-1.5">
            {CHAT_MODELS.map((m) => {
              const active = selectedModel === m.id && groundingMode === 'none';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedModel(m.id);
                    if (groundingMode !== 'none') setGroundingMode('none');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                    active
                      ? 'bg-[#21262d] border-[#58a6ff] text-white'
                      : 'bg-[#0c1017] border-[#21262d] text-[#8b949e] hover:border-[#30363d] hover:text-[#e6edf3]'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold">{m.label}</div>
                  <div className="text-[11px] text-[#8b949e] mt-0.5">{m.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grounding Tools */}
        <div className="pt-4 border-t border-[#21262d]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#c9d1d9]">
              Dados em Tempo Real (gemini-4-hydrogen)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleToggleGrounding('search')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                groundingMode === 'search'
                  ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                  : 'bg-[#0c1017] text-[#8b949e] border-[#30363d] hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Search</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleGrounding('maps')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                groundingMode === 'maps'
                  ? 'bg-[#238636] text-white border-[#2ea043]'
                  : 'bg-[#0c1017] text-[#8b949e] border-[#30363d] hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>
          </div>
          {groundingMode === 'maps' && locationStatus && (
            <p className="text-[11px] text-[#7ee787] mt-2 font-mono">{locationStatus}</p>
          )}
        </div>

        {/* System Instruction / Role */}
        <div className="pt-4 border-t border-[#21262d]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#c9d1d9]">Papel (System Instruction)</span>
            <button
              type="button"
              onClick={() => setShowSystemEditor((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] text-[#58a6ff] hover:underline"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{showSystemEditor ? 'Ocultar' : 'Editar'}</span>
            </button>
          </div>

          <select
            value={selectedRoleId}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#0c1017] border border-[#30363d] rounded-xl text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
          >
            {ROLE_PRESETS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          {showSystemEditor && (
            <textarea
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              rows={4}
              className="mt-2.5 w-full p-2.5 text-xs bg-[#0c1017] border border-[#30363d] rounded-xl text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] resize-none"
            />
          )}
        </div>

        {/* Quick Prompts */}
        <div className="pt-4 border-t border-[#21262d]">
          <span className="block text-xs font-semibold text-[#c9d1d9] mb-2">
            Sugestões Rápidas
          </span>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setGroundingMode('none');
                setInput('Crie uma função Python que calcula juros compostos e gera uma tabela mês a mês.');
              }}
              className="w-full text-left px-3 py-2 text-xs text-[#8b949e] hover:text-white bg-[#0c1017] hover:bg-[#21262d] border border-[#21262d] rounded-lg transition-colors"
            >
              Gerar função Python de juros compostos
            </button>
            <button
              type="button"
              onClick={() => {
                setGroundingMode('search');
                setInput('Quais são as novidades mais recentes do Python 3.13?');
              }}
              className="w-full text-left px-3 py-2 text-xs text-[#8b949e] hover:text-white bg-[#0c1017] hover:bg-[#21262d] border border-[#21262d] rounded-lg transition-colors"
            >
              Pesquisar novidades do Python (Google Search)
            </button>
            <button
              type="button"
              onClick={() => {
                enableMapsGrounding();
                setInput('Quais livrarias técnicas ou bibliotecas universitárias existem perto de Lisboa ou na minha região?');
              }}
              className="w-full text-left px-3 py-2 text-xs text-[#8b949e] hover:text-white bg-[#0c1017] hover:bg-[#21262d] border border-[#21262d] rounded-lg transition-colors"
            >
              Encontrar bibliotecas/livrarias (Google Maps)
            </button>
          </div>
        </div>
      </aside>

      {/* Right Scrollable Multi-Turn Thread */}
      <section className="lg:col-span-8 bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden flex flex-col h-[640px] shadow-lg">
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-[#0c1017] border-b border-[#30363d] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#8b949e] truncate">
            <Bot className="w-4 h-4 text-[#58a6ff] shrink-0" />
            <span className="font-semibold text-white">Chat Multi-Turno</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono truncate">{effectiveModelLabel}</span>
          </div>
          <button
            type="button"
            onClick={clearConversation}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded-md transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#0c1017]/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-lg bg-[#1f6feb]/20 border border-[#1f6feb]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-[#58a6ff]" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                  msg.role === 'user'
                    ? 'bg-[#1f6feb]/20 border-[#388bfd]/40 text-white'
                    : 'bg-[#161b22] border-[#30363d] text-[#e6edf3]'
                }`}
              >
                <div className="flex items-center gap-2 text-[11px] text-[#8b949e] mb-1.5">
                  <span className="font-semibold text-[#c9d1d9]">
                    {msg.role === 'user' ? 'Você' : 'Assistente Gemini'}
                  </span>
                  {msg.modelUsed && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{msg.modelUsed}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{msg.timestamp}</span>
                </div>

                <FormattedMessageContent text={msg.text} />

                {/* Grounding Sources (Google Search & Google Maps URLs) */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#21262d] space-y-2">
                    <div className="text-[11px] font-semibold text-[#8b949e]">
                      {msg.groundingMode === 'maps'
                        ? 'Locais no Google Maps:'
                        : 'Fontes encontradas no Google Search:'}
                    </div>
                    <div className="space-y-1.5">
                      {msg.sources.map((src, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-[#0c1017] border border-[#21262d]"
                        >
                          <a
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#58a6ff] hover:underline"
                          >
                            {src.type === 'maps' ? (
                              <MapPin className="w-3.5 h-3.5 text-[#2ea043] shrink-0" />
                            ) : (
                              <Globe className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
                            )}
                            <span>{src.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>

                          {src.reviewSnippets && src.reviewSnippets.length > 0 && (
                            <div className="mt-1.5 space-y-1 pl-5">
                              {src.reviewSnippets.map((rev, rIdx) => (
                                <div key={rIdx} className="text-[11px] text-[#8b949e]">
                                  {rev.text && <p className="italic">"{rev.text}"</p>}
                                  {rev.uri && (
                                    <a
                                      href={rev.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#58a6ff] hover:underline inline-flex items-center gap-1 mt-0.5"
                                    >
                                      <span>Ver avaliação{rev.author ? ` (${rev.author})` : ''}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-[#e6edf3]" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-[#8b949e]">
              <div className="w-8 h-8 rounded-lg bg-[#1f6feb]/20 border border-[#1f6feb]/30 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-[#58a6ff] animate-spin" />
              </div>
              <span>Gerando resposta com {effectiveModelLabel}...</span>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-4 py-2.5 bg-[#f85149]/10 border-t border-[#f85149]/30 flex items-center gap-2 text-xs text-[#f85149]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={handleSend}
          className="p-3.5 bg-[#0c1017] border-t border-[#30363d] flex items-end gap-2.5"
        >
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isTranscribing || isLoading}
            className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
              isRecording
                ? 'bg-[#f85149] text-white border-[#f85149]'
                : 'bg-[#161b22] text-[#8b949e] hover:text-white border-[#30363d]'
            }`}
            title={
              isRecording
                ? 'Parar gravação e transcrever (gemini-3.5-transcribe)'
                : 'Ditar mensagem pelo microfone (gemini-3.5-transcribe)'
            }
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />
            ) : isRecording ? (
              <Square className="w-4 h-4 fill-white" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder={
              isRecording
                ? 'Gravando áudio... Clique no botão vermelho para transcrever.'
                : isTranscribing
                ? 'Transcrevendo áudio com gemini-3.5-transcribe...'
                : 'Pergunte sobre Python, peça um cálculo, pesquise na web ou busque locais no Maps...'
            }
            className="flex-1 px-3.5 py-2 text-sm bg-[#161b22] border border-[#30363d] rounded-xl text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff] resize-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </section>
    </div>
  );
};
