/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, PhoneCall, Mic } from 'lucide-react';
import { GeminiChatbot } from './GeminiChatbot';
import { LiveVoiceStudio } from './LiveVoiceStudio';
import { AudioTranscriber } from './AudioTranscriber';

export const AIStudio: React.FC = () => {
  const [subTab, setSubTab] = useState<'chat' | 'live' | 'transcribe'>('chat');
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null);

  const handleSendTranscriptionToChat = (text: string) => {
    setPendingChatPrompt(text);
    setSubTab('chat');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header & Workspace Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#21262d]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Assistente IA & Voz Gemini
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Chat multi-turno, pesquisa atualizada com Google Search, locais no Google Maps, transcrição de áudio e conversas por voz em tempo real.
          </p>
        </div>

        {/* Clean segmented workspace tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#161b22] border border-[#30363d] rounded-xl self-start md:self-center">
          <button
            type="button"
            onClick={() => setSubTab('chat')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'chat'
                ? 'bg-[#21262d] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Grounding</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('live')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'live'
                ? 'bg-[#21262d] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Voz em Tempo Real</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('transcribe')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'transcribe'
                ? 'bg-[#21262d] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Transcrição de Áudio</span>
          </button>
        </div>
      </div>

      <div className="mt-6">
        {subTab === 'chat' && (
          <GeminiChatbot
            initialPrompt={pendingChatPrompt}
            onConsumeInitialPrompt={() => setPendingChatPrompt(null)}
          />
        )}
        {subTab === 'live' && <LiveVoiceStudio />}
        {subTab === 'transcribe' && (
          <AudioTranscriber onSendToChat={handleSendTranscriptionToChat} />
        )}
      </div>
    </div>
  );
};
