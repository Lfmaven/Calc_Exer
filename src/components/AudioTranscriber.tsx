/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  FileAudio,
  Copy,
  Check,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AudioTranscriberProps {
  onSendToChat?: (transcribedText: string) => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      resolve(res.includes(',') ? res.split(',')[1] : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({ onSendToChat }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [audioName, setAudioName] = useState<string>('gravacao_microfone.webm');
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Transcreva este áudio fielmente em português. Preserve termos de Python, nomes de funções e expressões matemáticas.'
  );
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioMimeType(mimeType);
        setAudioName(`microfone_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`);
        setAudioUrl(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioBlob(file);
    setAudioMimeType(file.type || 'audio/mp3');
    setAudioName(file.name);
    setAudioUrl(url);
  };

  const handleTranscribe = async () => {
    if (!audioBlob || isTranscribing) return;
    setError(null);
    setIsTranscribing(true);

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioMimeType,
          prompt: customPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao transcrever o áudio.');
      }
      setTranscription(data.text || '(Nenhuma fala detectada no áudio)');
    } catch (err: any) {
      setError(err.message || 'Falha na requisição de transcrição.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscription('');
    setError(null);
    setRecordingSeconds(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Capture & Upload Controls */}
      <div className="lg:col-span-5 bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white">Captura & Envio de Áudio</h2>
          <p className="text-xs text-[#8b949e] mt-1">
            Grave diretamente pelo microfone ou envie um ficheiro de áudio para transcrição com{' '}
            <code className="text-[#58a6ff] font-mono">gemini-3.5-transcribe</code>.
          </p>
        </div>

        {/* Mic & Upload Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
              isRecording
                ? 'bg-[#f85149] text-white border-[#f85149]'
                : 'bg-[#1f6feb] hover:bg-[#388bfd] text-white border-[#388bfd]'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span className="tabular-nums">Parar ({formatDuration(recordingSeconds)})</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Gravar Microfone</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording}
            className="py-3 px-4 rounded-xl text-xs font-semibold text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>Carregar Ficheiro</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Audio Preview */}
        {audioUrl && (
          <div className="p-3.5 rounded-xl bg-[#0c1017] border border-[#21262d] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#c9d1d9] truncate">
                <FileAudio className="w-4 h-4 text-[#f5b731] shrink-0" />
                <span className="font-mono truncate">{audioName}</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[#8b949e] hover:text-[#f85149] transition-colors"
                title="Remover áudio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <audio src={audioUrl} controls className="w-full h-9" />
          </div>
        )}

        {/* Instruction prompt */}
        <div>
          <label className="block text-xs font-semibold text-[#c9d1d9] mb-1.5">
            Instrução de Transcrição
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="w-full p-3 text-xs bg-[#0c1017] border border-[#30363d] rounded-xl text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] resize-none"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#f85149]/10 border border-[#f85149]/30 flex items-center gap-2 text-xs text-[#f85149]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleTranscribe}
          disabled={!audioBlob || isTranscribing || isRecording}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transcrevendo com gemini-3.5-transcribe...</span>
            </>
          ) : (
            <span>Transcrever Áudio</span>
          )}
        </button>
      </div>

      {/* Right: Output Box */}
      <div className="lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden flex flex-col min-h-[420px]">
        <div className="px-5 py-3.5 bg-[#0c1017] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            <span className="font-semibold text-white">Texto Transcrito</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">gemini-3.5-transcribe</span>
          </div>
          <div className="flex items-center gap-2">
            {transcription && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#238636]" />
                      <span className="text-[#238636]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                {onSendToChat && (
                  <button
                    type="button"
                    onClick={() => onSendToChat(transcription)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-[#1f6feb] hover:bg-[#388bfd] rounded-md transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar ao Chat</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 bg-[#0c1017]/50">
          {transcription ? (
            <div className="text-sm text-[#e6edf3] whitespace-pre-wrap leading-relaxed font-sans">
              {transcription}
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-xs text-[#8b949e] px-6">
              <FileAudio className="w-8 h-8 text-[#30363d] mb-3" />
              <p className="font-medium text-[#c9d1d9] mb-1">Nenhuma transcrição gerada ainda</p>
              <p>
                Grave uma pergunta matemática ou código Python pelo microfone, ou carregue um arquivo de áudio e clique em &ldquo;Transcrever Áudio&rdquo;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
