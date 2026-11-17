/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Send,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';

interface LiveTranscriptItem {
  id: string;
  speaker: 'user' | 'model';
  text: string;
  timestamp: string;
}

const VOICES = [
  { id: 'Zephyr', label: 'Zephyr (Natural)' },
  { id: 'Puck', label: 'Puck (Expressiva)' },
  { id: 'Charon', label: 'Charon (Grave)' },
  { id: 'Kore', label: 'Kore (Clara)' },
  { id: 'Fenrir', label: 'Fenrir (Firme)' },
];

const LIVE_ROLES = [
  {
    id: 'tutor-voz',
    label: 'Tutor Python por Voz',
    instruction:
      'Você é um tutor de programação Python e matemática conversando em tempo real por voz. Seja direto, didático, amigável e fale em português.',
  },
  {
    id: 'calculadora-voz',
    label: 'Calculadora Falada',
    instruction:
      'Você é uma calculadora inteligente por voz. Quando o usuário ditar contas, equações ou conversões de unidades, calcule mentalmente com precisão e responda o resultado de forma breve e clara em português.',
  },
  {
    id: 'entrevista',
    label: 'Entrevistador Técnico Python',
    instruction:
      'Você é um entrevistador técnico simulando perguntas práticas de Python (estruturas de dados, funções, tratamento de erros) por voz. Dê feedback construtivo em português.',
  },
];

function float32ToBase64Pcm16(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

export const LiveVoiceStudio: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('tutor-voz');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [textInput, setTextInput] = useState<string>('');
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for real-time audio callbacks (avoids stale closures)
  const wsRef = useRef<WebSocket | null>(null);
  const isMutedRef = useRef<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, []);

  const stopAllQueuedPlayback = () => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current.clear();
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  };

  const playPcm24kChunk = (base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    const samples = base64Pcm16ToFloat32(base64Audio);
    if (samples.length === 0) return;

    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.getChannelData(0).set(samples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    activeSourcesRef.current.add(source);
    source.onended = () => {
      activeSourcesRef.current.delete(source);
    };
  };

  const appendTranscript = (speaker: 'user' | 'model', text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          text: `${last.text}${last.text.endsWith(' ') || text.startsWith(' ') ? '' : ' '}${text}`,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          speaker,
          text: text.trim(),
          timestamp: now,
        },
      ];
    });
  };

  const cleanupSession = () => {
    isConnectedRef.current = false;
    stopAllQueuedPlayback();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    setMicLevel(0);
    setStatus('idle');
  };

  const handleStartLive = async () => {
    if (status !== 'idle') return;
    setError(null);
    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const roleObj = LIVE_ROLES.find((r) => r.id === selectedRoleId) || LIVE_ROLES[0];
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams({
        voice: selectedVoice,
        instruction: roleObj.instruction,
      });
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/live?${params.toString()}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            isConnectedRef.current = true;
            setStatus('connected');
          } else if (msg.type === 'audio' && msg.data) {
            playPcm24kChunk(msg.data);
          } else if (msg.type === 'interrupted') {
            stopAllQueuedPlayback();
          } else if (msg.type === 'inputTranscript' && msg.text) {
            appendTranscript('user', msg.text);
          } else if (msg.type === 'outputTranscript' && msg.text) {
            appendTranscript('model', msg.text);
          } else if (msg.type === 'error') {
            setError(msg.message || 'Erro na sessão Live API.');
            cleanupSession();
          } else if (msg.type === 'closed') {
            cleanupSession();
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        setError('Erro na conexão WebSocket com o servidor Live API.');
        cleanupSession();
      };

      ws.onclose = () => {
        cleanupSession();
      };

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      sourceNodeRef.current = source;
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        const channel = e.inputBuffer.getChannelData(0);

        // Compute real RMS mic level for visual feedback
        let sum = 0;
        for (let i = 0; i < channel.length; i++) {
          sum += channel[i] * channel[i];
        }
        const rms = Math.sqrt(sum / channel.length);
        setMicLevel(isMutedRef.current ? 0 : Math.min(100, Math.round(rms * 400)));

        if (
          !isConnectedRef.current ||
          isMutedRef.current ||
          !wsRef.current ||
          wsRef.current.readyState !== WebSocket.OPEN
        ) {
          return;
        }

        const base64 = float32ToBase64Pcm16(channel);
        wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
      };
    } catch (err: any) {
      setError(
        err?.message ||
          'Permissão de microfone necessária para iniciar conversa por voz.'
      );
      cleanupSession();
    }
  };

  const handleSendTextMidCall = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: 'text', text: trimmed }));
    appendTranscript('user', trimmed);
    setTextInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Voice Call Controls */}
      <div className="lg:col-span-5 bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white">Conversa por Voz em Tempo Real</h2>
          <p className="text-xs text-[#8b949e] mt-1">
            Fale diretamente com o modelo{' '}
            <code className="text-[#58a6ff] font-mono">gemini-3.8-live</code> usando áudio bidirecional de baixa latência (16kHz entrada / 24kHz saída).
          </p>
        </div>

        {/* Role & Voice Selectors */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#c9d1d9] mb-1.5">
              Papel do Assistente
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={status !== 'idle'}
              className="w-full px-3 py-2 text-xs bg-[#0c1017] border border-[#30363d] rounded-xl text-[#e6edf3] disabled:opacity-60 focus:outline-none focus:border-[#58a6ff]"
            >
              {LIVE_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c9d1d9] mb-1.5">
              Voz da IA
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={status !== 'idle'}
              className="w-full px-3 py-2 text-xs bg-[#0c1017] border border-[#30363d] rounded-xl text-[#e6edf3] disabled:opacity-60 focus:outline-none focus:border-[#58a6ff]"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Microphone Activity Meter */}
        <div className="p-4 rounded-xl bg-[#0c1017] border border-[#21262d] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b949e] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Nível do Microfone</span>
            </span>
            <span className="font-mono text-[#c9d1d9] tabular-nums">
              {status === 'connected' ? (isMuted ? 'Silenciado' : 'Ativo') : 'Desconectado'}
            </span>
          </div>
          <div className="w-full h-2 bg-[#161b22] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#238636] transition-all duration-75"
              style={{ width: `${micLevel}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#f85149]/10 border border-[#f85149]/30 flex items-center gap-2 text-xs text-[#f85149]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Call Actions */}
        <div className="flex items-center gap-2.5">
          {status === 'idle' ? (
            <button
              type="button"
              onClick={handleStartLive}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#238636] hover:bg-[#2ea043] transition-colors inline-flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Iniciar Conversa por Voz</span>
            </button>
          ) : status === 'connecting' ? (
            <button
              type="button"
              disabled
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#21262d] border border-[#30363d] inline-flex items-center justify-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />
              <span>Conectando ao Live API...</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-colors inline-flex items-center justify-center gap-2 ${
                  isMuted
                    ? 'bg-[#d29922]/20 text-[#d29922] border-[#d29922]/40'
                    : 'bg-[#21262d] text-white border-[#30363d] hover:bg-[#30363d]'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMuted ? 'Ativar Mic' : 'Mutar'}</span>
              </button>

              <button
                type="button"
                onClick={cleanupSession}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#f85149] hover:bg-[#da3633] transition-colors inline-flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Encerrar Chamada</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right: Real-Time Transcript Log */}
      <div className="lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden flex flex-col h-[520px]">
        <div className="px-5 py-3.5 bg-[#0c1017] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            <span className="font-semibold text-white">Transcrição em Tempo Real</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">gemini-3.8-live</span>
          </div>
          {transcripts.length > 0 && (
            <button
              type="button"
              onClick={() => setTranscripts([])}
              className="inline-flex items-center gap-1 text-xs text-[#8b949e] hover:text-[#f85149] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#0c1017]/50">
          {transcripts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#8b949e] px-6">
              <PhoneCall className="w-8 h-8 text-[#30363d] mb-3" />
              <p className="font-medium text-[#c9d1d9] mb-1">Pronto para conversar por voz</p>
              <p>
                Clique em &ldquo;Iniciar Conversa por Voz&rdquo; e fale normalmente. Você pode perguntar cálculos, pedir explicações sobre Python ou interromper a resposta a qualquer momento.
              </p>
            </div>
          ) : (
            transcripts.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  item.speaker === 'user'
                    ? 'bg-[#1f6feb]/15 border-[#388bfd]/30 text-white ml-8'
                    : 'bg-[#161b22] border-[#30363d] text-[#e6edf3] mr-8'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#8b949e] mb-1">
                  <span className="font-semibold text-[#c9d1d9]">
                    {item.speaker === 'user' ? 'Você (voz)' : 'Gemini Live'}
                  </span>
                  <span className="tabular-nums">{item.timestamp}</span>
                </div>
                <p className="whitespace-pre-wrap">{item.text}</p>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        <form
          onSubmit={handleSendTextMidCall}
          className="p-3 bg-[#0c1017] border-t border-[#30363d] flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={status !== 'connected'}
            placeholder={
              status === 'connected'
                ? 'Opcional: envie uma expressão matemática por texto durante a chamada...'
                : 'Inicie a chamada por voz para enviar mensagens em tempo real'
            }
            className="flex-1 px-3 py-2 text-xs bg-[#161b22] border border-[#30363d] rounded-xl text-[#e6edf3] placeholder-[#6e7681] disabled:opacity-50 focus:outline-none focus:border-[#58a6ff]"
          />
          <button
            type="submit"
            disabled={status !== 'connected' || !textInput.trim()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
