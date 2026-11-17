# Python Calculator Studio

Aplicação web full-stack para cálculo em Python, execução de scripts no navegador via WebAssembly, biblioteca de código-fonte `.py` pronta para download e estúdio integrado com modelos Gemini (Chat multi-turno, Google Search Grounding, Google Maps Grounding, Transcrição de Áudio e Conversa por Voz em Tempo Real via Live API).

---

## Funcionalidades

### 1. Calculadora Interativa (Sintaxe Python 3)
- **Modos Padrão e Científica**: suporte a operadores nativos do Python (`+`, `-`, `*`, `/`, `**` potência, `//` divisão inteira, `%` módulo) e funções da biblioteca `math` (`math.sqrt`, `math.sin`, `math.cos`, `math.tan`, `math.log`, `math.log10`, `math.pi`, `math.e`).
- **Memória e Histórico**: controles `MC`, `MR`, `M+`, `M-`, histórico de expressões com reaproveitamento de resultados e visualização instantânea do código Python equivalente.
- **Atalhos de Teclado**: suporte completo a teclas numéricas, operadores, `Enter`, `Backspace` e `Esc`.

### 2. Terminal REPL Python
- Editor e terminal interativo no navegador alimentado pelo **Pyodide (CPython WebAssembly)** com fallback matemático rápido.
- Exemplos prontos incluídos: **Fórmula de Bhaskara**, **Juros Compostos**, **Estatística de Dados** (`statistics`) e **Trigonometria** (`math`).

### 3. Biblioteca de Códigos-Fonte (`.py`)
Scripts completos, comentados e prontos para copiar ou baixar:
- `calculadora_terminal.py` — Calculadora CLI interativa com `type hints` e tratamento de `ZeroDivisionError` e `ValueError`.
- `calculadora_oop.py` — Arquitetura orientada a objetos com classe `Calculadora`, histórico interno e memória acumuladora.
- `calculadora_gui.py` — Interface gráfica desktop nativa em **Tkinter** (sem dependências externas).
- `calculadora_ast.py` — Avaliador seguro de expressões matemáticas com o módulo nativo `ast`.

### 4. Assistente IA & Voz (Gemini SDK `@google/genai`)
Todas as chamadas aos modelos Gemini ocorrem exclusivamente no backend (`server.ts`):
- **Chatbot Multi-Turno**:
  - Mantém histórico da conversa, interface em thread rolável e seleção de papéis (`systemInstruction`) personalizáveis.
  - Seleção de modelo por tarefa:
    - `gemini-4-hydrogen` — Tarefas gerais e tutoria Python.
    - `gemini-3.1-flash-lite` — Respostas rápidas de baixa latência.
    - `gemini-4-carbon` — Raciocínio profundo, provas matemáticas e arquitetura *(requer chave com faturamento ativo)*.
    - `gemini-4-argon` — Tarefas interativas complexas e geração avançada *(requer chave com faturamento ativo)*.
- **Google Search Grounding**: ativa a ferramenta `googleSearch` com `gemini-4-hydrogen` e exibe links das fontes web encontradas.
- **Google Maps Grounding**: ativa a ferramenta `googleMaps` com `gemini-4-hydrogen` (com suporte opcional a geolocalização via navegador) e exibe links diretos do Google Maps e trechos de avaliações.
- **Transcrição de Áudio (`gemini-3.5-transcribe`)**:
  - Gravação direta pelo microfone (no compositor do chat ou na aba dedicada) e upload de arquivos de áudio (`.mp3`, `.wav`, `.webm`, `.ogg`, `.m4a`).
- **Conversa por Voz em Tempo Real (`gemini-3.8-live` / Live API)**:
  - Sessão bidirecional de áudio em tempo real via WebSocket (`/ws/live`), capturando microfone em **PCM 16kHz** e reproduzindo áudio contínuo em **PCM 24kHz**, com suporte a interrupções, seleção de voz (`Zephyr`, `Puck`, `Charon`, `Kore`, `Fenrir`) e transcrição simultânea.

---

## Arquitetura do Projeto

```text
├── server.ts                        # Servidor Express + WebSocket Bridge (/ws/live) + Rotas Gemini (/api/gemini/*)
├── index.html                       # Ponto de entrada HTML e fontes
├── package.json                     # Dependências e scripts npm
├── vite.config.ts                   # Configuração Vite + Tailwind CSS
└── src/
    ├── App.tsx                      # Navegação principal entre os módulos
    ├── data/
    │   └── pythonSnippets.ts        # Scripts Python (.py) e exemplos do REPL
    ├── services/
    │   └── pythonRunner.ts          # Executor Pyodide WASM + avaliador matemático seguro
    └── components/
        ├── Header.tsx               # Barra superior de navegação e download rápido
        ├── Calculator.tsx           # Calculadora interativa padrão e científica
        ├── PythonRepl.tsx           # Editor e terminal REPL Python
        ├── CodeLibrary.tsx          # Visualizador e download dos arquivos .py
        ├── GuideSection.tsx         # Guia de execução local e tabela de operadores
        ├── AIStudio.tsx             # Contêiner do estúdio de IA
        ├── GeminiChatbot.tsx        # Chat multi-turno com Search/Maps Grounding e ditado
        ├── AudioTranscriber.tsx     # Gravador de microfone e transcritor de áudio
        └── LiveVoiceStudio.tsx      # Conversa por voz em tempo real (Live API)
```

---

## Como Executar Localmente

### Pré-requisitos
- **Node.js 20+** (ou superior)
- **npm**
- Uma chave de API Gemini configurada na variável de ambiente `GEMINI_API_KEY` (para os recursos de IA).

### Passo a passo

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
   ```env
   GEMINI_API_KEY="SUA_CHAVE_GEMINI"
   APP_URL="http://localhost:3000"
   ```

3. **Inicie o servidor em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.

4. **Build e execução em produção:**
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

5. **Verificação de tipos:**
   ```bash
   npm run lint
   ```

---

## Executando os Scripts `.py` Baixados

Para rodar qualquer script baixado pela aba **Códigos .py** diretamente no terminal do seu computador (requer Python 3.8+):

```bash
python calculadora_terminal.py
```

Para abrir a calculadora desktop gráfica com Tkinter:

```bash
python calculadora_gui.py
```
