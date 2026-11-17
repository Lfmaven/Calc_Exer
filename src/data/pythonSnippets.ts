/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PythonSnippet {
  id: string;
  title: string;
  category: 'CLI / Terminal' | 'Orientada a Objetos' | 'Interface Gráfica' | 'Expressões AST';
  filename: string;
  summary: string;
  features: string[];
  code: string;
  explanation: {
    title: string;
    description: string;
    steps: { lineRange: string; concept: string; detail: string }[];
  };
}

export const PYTHON_SCRIPTS: PythonSnippet[] = [
  {
    id: 'cli-basica',
    title: 'Calculadora Terminal (CLI)',
    category: 'CLI / Terminal',
    filename: 'calculadora_terminal.py',
    summary: 'Calculadora interativa completa para rodar no terminal com menu intuitivo, funções modulares e tratamento robusto de erros.',
    features: [
      'Operações básicas (+, -, *, /)',
      'Potência (**), Raiz Quadrada e Módulo (%)',
      'Tratamento de ZeroDivisionError e ValueError',
      'Laço contínuo com opção de sair',
    ],
    code: `"""
Calculadora Interativa em Python (CLI)
Autor: Python Calculator Studio
Descrição: Calculadora completa de linha de comando com funções e tratamento de exceções.
"""
import math

def somar(a: float, b: float) -> float:
    """Retorna a soma de dois números."""
    return a + b

def subtrair(a: float, b: float) -> float:
    """Retorna a subtração de b em relação a a."""
    return a - b

def multiplicar(a: float, b: float) -> float:
    """Retorna o produto de dois números."""
    return a * b

def dividir(a: float, b: float) -> float:
    """Retorna a divisão de a por b. Trata divisão por zero."""
    if b == 0:
        raise ZeroDivisionError("Erro: Não é possível dividir por zero!")
    return a / b

def potencia(base: float, expoente: float) -> float:
    """Retorna a base elevada ao expoente."""
    return base ** expoente

def raiz_quadrada(numero: float) -> float:
    """Retorna a raiz quadrada de um número não-negativo."""
    if numero < 0:
        raise ValueError("Erro: Não existe raiz real de número negativo!")
    return math.sqrt(numero)

def obter_numero(mensagem: str) -> float:
    """Lê um número com validação de entrada."""
    while True:
        try:
            return float(input(mensagem))
        except ValueError:
            print("❌ Entrada inválida! Por favor, digite um número válido.")

def exibir_menu():
    print("\\n" + "=" * 36)
    print("      CALCULADORA EM PYTHON")
    print("=" * 36)
    print(" 1. Adição (+)")
    print(" 2. Subtração (-)")
    print(" 3. Multiplicação (*)")
    print(" 4. Divisão (/)")
    print(" 5. Potenciação (^)")
    print(" 6. Raiz Quadrada (√)")
    print(" 0. Sair")
    print("=" * 36)

def main():
    while True:
        exibir_menu()
        opcao = input("Escolha uma opção (0-6): ").strip()

        if opcao == "0":
            print("\\nObrigado por usar a calculadora! Até logo.")
            break

        try:
            if opcao == "6":
                num = obter_numero("Digite o número para a raiz: ")
                resultado = raiz_quadrada(num)
                print(f"\\n✅ Resultado: √{num} = {resultado}")
            elif opcao in ("1", "2", "3", "4", "5"):
                num1 = obter_numero("Digite o primeiro número: ")
                num2 = obter_numero("Digite o segundo número: ")

                if opcao == "1":
                    res = somar(num1, num2)
                    print(f"\\n✅ Resultado: {num1} + {num2} = {res}")
                elif opcao == "2":
                    res = subtrair(num1, num2)
                    print(f"\\n✅ Resultado: {num1} - {num2} = {res}")
                elif opcao == "3":
                    res = multiplicar(num1, num2)
                    print(f"\\n✅ Resultado: {num1} * {num2} = {res}")
                elif opcao == "4":
                    res = dividir(num1, num2)
                    print(f"\\n✅ Resultado: {num1} / {num2} = {res}")
                elif opcao == "5":
                    res = potencia(num1, num2)
                    print(f"\\n✅ Resultado: {num1} ^ {num2} = {res}")
            else:
                print("❌ Opção inválida! Escolha entre 0 e 6.")

        except ZeroDivisionError as e:
            print(f"\\n⚠️  {e}")
        except ValueError as e:
            print(f"\\n⚠️  {e}")
        except Exception as e:
            print(f"\\n⚠️  Ocorreu um erro inesperado: {e}")

        input("\\nPressione ENTER para continuar...")

if __name__ == "__main__":
    main()
`,
    explanation: {
      title: 'Estrutura e Conceitos Chave do Script Terminal',
      description: 'Este script ensina as melhores práticas de programação em Python: tipagem com type hints, funções puras, separação de responsabilidades e tratamento de exceções.',
      steps: [
        {
          lineRange: 'Linhas 7-34',
          concept: 'Funções Puras com Type Hints',
          detail: 'Cada operação matemática é isolada em sua própria função com anotações de tipo `float` e docstrings legíveis.',
        },
        {
          lineRange: 'Linhas 36-43',
          concept: 'Validação com try/except',
          detail: 'A função `obter_numero` repete a solicitação até que o usuário informe um número válido, evitando que o programa feche por erro de digitação.',
        },
        {
          lineRange: 'Linhas 56-107',
          concept: 'Loop Principal e Tratamento de Erros',
          detail: 'O `while True` mantém o programa vivo até a escolha de saída. Os blocos `except ZeroDivisionError` garantem feedback amigável sem quebrar o fluxo.',
        },
      ],
    },
  },
  {
    id: 'oop-avancada',
    title: 'Calculadora Orientada a Objetos (OOP)',
    category: 'Orientada a Objetos',
    filename: 'calculadora_oop.py',
    summary: 'Arquitetura modular em classe Python com histórico de cálculos gravado, memória persistente (M+, MR, MC) e método de desfazer.',
    features: [
      'Encapsulamento com a classe `Calculadora`',
      'Histórico completo de cálculos em lista de dicionários',
      'Memória acumuladora (M+, M-, MR, MC)',
      'Função de desfazer última operação',
    ],
    code: `"""
Calculadora Orientada a Objetos em Python
Autor: Python Calculator Studio
Descrição: Arquitetura com histórico, memória e métodos encadeados.
"""
from typing import List, Dict, Any
import math

class Calculadora:
    """Classe que encapsula a lógica e o estado de uma calculadora."""

    def __init__(self):
        self._resultado_atual: float = 0.0
        self._memoria: float = 0.0
        self._historico: List[Dict[str, Any]] = []

    @property
    def resultado(self) -> float:
        """Obtém o resultado do último cálculo realizado."""
        return self._resultado_atual

    @property
    def memoria(self) -> float:
        """Retorna o valor armazenado na memória."""
        return self._memoria

    def _registrar_historico(self, operacao: str, a: float, b: float, resultado: float):
        self._historico.append({
            "operacao": operacao,
            "termo_a": a,
            "termo_b": b,
            "resultado": resultado
        })
        self._resultado_atual = resultado

    def somar(self, a: float, b: float) -> float:
        res = a + b
        self._registrar_historico("+", a, b, res)
        return res

    def subtrair(self, a: float, b: float) -> float:
        res = a - b
        self._registrar_historico("-", a, b, res)
        return res

    def multiplicar(self, a: float, b: float) -> float:
        res = a * b
        self._registrar_historico("*", a, b, res)
        return res

    def dividir(self, a: float, b: float) -> float:
        if b == 0:
            raise ZeroDivisionError("Divisão por zero não é permitida.")
        res = a / b
        self._registrar_historico("/", a, b, res)
        return res

    def potencia(self, base: float, exp: float) -> float:
        res = base ** exp
        self._registrar_historico("^", base, exp, res)
        return res

    def raiz(self, n: float) -> float:
        if n < 0:
            raise ValueError("Raiz de número negativo não suportada no conjunto dos reais.")
        res = math.sqrt(n)
        self._registrar_historico("√", n, 0, res)
        return res

    # Gerenciamento de Memória
    def memoria_adicionar(self, valor: float):
        self._memoria += valor

    def memoria_subtrair(self, valor: float):
        self._memoria -= valor

    def memoria_limpar(self):
        self._memoria = 0.0

    def obter_historico(self) -> List[Dict[str, Any]]:
        return list(self._historico)

    def imprimir_historico(self):
        if not self._historico:
            print("Histórico vazio.")
            return
        print("\\n=== HISTÓRICO DE CÁLCULOS ===")
        for i, item in enumerate(self._historico, 1):
            if item["operacao"] == "√":
                print(f"{i}. √{item['termo_a']} = {item['resultado']}")
            else:
                print(f"{i}. {item['termo_a']} {item['operacao']} {item['termo_b']} = {item['resultado']}")

# Exemplo de Utilização
if __name__ == "__main__":
    calc = Calculadora()
    
    print("--- Testando Operações ---")
    print("10 + 5 =", calc.somar(10, 5))
    print("50 / 4 =", calc.dividir(50, 4))
    print("2 ** 8 =", calc.potencia(2, 8))
    print("√144   =", calc.raiz(144))
    
    # Memória
    calc.memoria_adicionar(calc.resultado)
    print("Memória guardada:", calc.memoria)
    
    # Histórico
    calc.imprimir_historico()
`,
    explanation: {
      title: 'Vantagens do Paradigma Orientado a Objetos',
      description: 'A modelagem em classe permite criar instâncias independentes da calculadora, guardar o histórico de operações em memória interna e proteger os dados através de propriedades `@property`.',
      steps: [
        {
          lineRange: 'Linhas 12-16',
          concept: 'Construtor e Estado Interno',
          detail: 'O `__init__` inicializa atributos protegidos (`_resultado_atual`, `_memoria`, `_historico`) que pertencem a cada instância da calculadora.',
        },
        {
          lineRange: 'Linhas 18-26',
          concept: 'Propriedades (@property)',
          detail: 'Permite leitura limpa dos valores sem permitir que o usuário altere o estado da calculadora de forma descontrolada.',
        },
        {
          lineRange: 'Linhas 28-36',
          concept: 'Registro Automático de Histórico',
          detail: 'Cada método de operação aciona internamente `_registrar_historico`, mantendo uma auditoria completa de tudo que foi computado.',
        },
      ],
    },
  },
  {
    id: 'gui-tkinter',
    title: 'Calculadora Gráfica Desktop (Tkinter)',
    category: 'Interface Gráfica',
    filename: 'calculadora_gui.py',
    summary: 'Interface gráfica visual completa usando a biblioteca padrão Tkinter (nativa do Python, sem precisar instalar nada). Possui teclado na tela e suporte a atalhos do teclado.',
    features: [
      '100% nativa em Python (usa tkinter padrão)',
      'Visor digital moderno com cores estilizadas',
      'Teclado completo (números, operadores, parênteses)',
      'Suporte a atalhos do teclado físico (Enter, Backspace, Esc)',
    ],
    code: `"""
Calculadora Gráfica com Python e Tkinter
Autor: Python Calculator Studio
Como executar: python calculadora_gui.py (não requer instalação de pacotes externos)
"""
import tkinter as tk
from tkinter import font
import math

class CalculadoraGUI:
    def __init__(self, master):
        self.master = master
        self.master.title("Calculadora Python")
        self.master.geometry("340x480")
        self.master.resizable(False, False)
        self.master.configure(bg="#0c1017")

        self.expressao = ""

        # Fonte personalizada
        self.fonte_display = font.Font(family="Consolas", size=24, weight="bold")
        self.fonte_botoes = font.Font(family="Segoe UI", size=13, weight="bold")

        # Visor
        self.visor = tk.Entry(
            master,
            font=self.fonte_display,
            bg="#161b22",
            fg="#e6edf3",
            bd=0,
            justify="right",
            insertbackground="#e6edf3"
        )
        self.visor.pack(fill="x", padx=16, pady=(20, 10), ipady=12)
        self.visor.insert(0, "0")

        # Container dos Botões
        grade = tk.Frame(master, bg="#0c1017")
        grade.pack(fill="both", expand=True, padx=14, pady=10)

        # Matriz de Botões: (texto, linha, coluna, cor_fundo, cor_texto)
        botoes = [
            ("C", 0, 0, "#30363d", "#f85149"),
            ("(", 0, 1, "#21262d", "#58a6ff"),
            (")", 0, 2, "#21262d", "#58a6ff"),
            ("/", 0, 3, "#1f6feb", "#ffffff"),

            ("7", 1, 0, "#21262d", "#f0f6fc"),
            ("8", 1, 1, "#21262d", "#f0f6fc"),
            ("9", 1, 2, "#21262d", "#f0f6fc"),
            ("*", 1, 3, "#1f6feb", "#ffffff"),

            ("4", 2, 0, "#21262d", "#f0f6fc"),
            ("5", 2, 1, "#21262d", "#f0f6fc"),
            ("6", 2, 2, "#21262d", "#f0f6fc"),
            ("-", 2, 3, "#1f6feb", "#ffffff"),

            ("1", 3, 0, "#21262d", "#f0f6fc"),
            ("2", 3, 1, "#21262d", "#f0f6fc"),
            ("3", 3, 2, "#21262d", "#f0f6fc"),
            ("+", 3, 3, "#1f6feb", "#ffffff"),

            ("0", 4, 0, "#21262d", "#f0f6fc"),
            (".", 4, 1, "#21262d", "#f0f6fc"),
            ("⌫", 4, 2, "#30363d", "#d29922"),
            ("=", 4, 3, "#238636", "#ffffff"),
        ]

        # Configurar proporção das colunas
        for c in range(4):
            grade.columnconfigure(c, weight=1)
        for r in range(5):
            grade.rowconfigure(r, weight=1)

        for texto, r, c, bg_cor, fg_cor in botoes:
            btn = tk.Button(
                grade,
                text=texto,
                font=self.fonte_botoes,
                bg=bg_cor,
                fg=fg_cor,
                activebackground="#388bfd",
                activeforeground="#ffffff",
                bd=0,
                cursor="hand2",
                command=lambda t=texto: self.ao_clicar(t)
            )
            btn.grid(row=r, column=c, padx=3, pady=3, sticky="nsew")

        # Atalhos do Teclado Físico
        self.master.bind("<Return>", lambda e: self.calcular())
        self.master.bind("<Escape>", lambda e: self.limpar())
        self.master.bind("<BackSpace>", lambda e: self.apagar())

    def ao_clicar(self, tecla: str):
        if tecla == "C":
            self.limpar()
        elif tecla == "⌫":
            self.apagar()
        elif tecla == "=":
            self.calcular()
        else:
            if self.visor.get() == "0" and tecla not in ("+", "-", "*", "/", "."):
                self.expressao = tecla
            else:
                self.expressao = self.visor.get() + tecla
            self.atualizar_visor(self.expressao)

    def limpar(self):
        self.expressao = ""
        self.atualizar_visor("0")

    def apagar(self):
        conteudo = self.visor.get()
        if len(conteudo) > 1 and conteudo != "0":
            self.expressao = conteudo[:-1]
        else:
            self.expressao = ""
        self.atualizar_visor(self.expressao if self.expressao else "0")

    def calcular(self):
        try:
            expr = self.visor.get()
            # Substituir símbolos visuais se houver
            expr = expr.replace("×", "*").replace("÷", "/")
            # Avaliação segura com escopo restrito de funções matemáticas
            resultado = eval(expr, {"__builtins__": None, "math": math}, {})
            # Formatação
            if isinstance(resultado, float) and resultado.is_integer():
                resultado = int(resultado)
            self.expressao = str(resultado)
            self.atualizar_visor(self.expressao)
        except ZeroDivisionError:
            self.atualizar_visor("Divisão por zero!")
            self.expressao = ""
        except Exception:
            self.atualizar_visor("Erro de Sintaxe")
            self.expressao = ""

    def atualizar_visor(self, texto: str):
        self.visor.delete(0, tk.END)
        self.visor.insert(0, texto)

if __name__ == "__main__":
    raiz = tk.Tk()
    app = CalculadoraGUI(raiz)
    raiz.mainloop()
`,
    explanation: {
      title: 'Como Funciona a Calculadora Gráfica Tkinter',
      description: 'O módulo Tkinter é a biblioteca padrão de interface gráfica do Python. Qualquer computador com Python pode executar este código sem precisar rodar pip install.',
      steps: [
        {
          lineRange: 'Linhas 9-18',
          concept: 'Criação da Janela e Visor',
          detail: 'Configura o tamanho fixo da janela, cores de fundo escuras e o widget `Entry` para exibir os números digitados.',
        },
        {
          lineRange: 'Linhas 28-56',
          concept: 'Grid Layout com Matriz de Botões',
          detail: 'Usa `grid()` e loops para instanciar e posicionar dinamicamente todos os 20 botões com suas cores e comandos.',
        },
        {
          lineRange: 'Linhas 83-98',
          concept: 'Event Binding e Atalhos de Teclado',
          detail: 'O método `master.bind("<Return>", ...)` permite que a tecla ENTER do teclado físico calcule o resultado automaticamente.',
        },
      ],
    },
  },
  {
    id: 'segura-ast',
    title: 'Calculadora de Expressões Seguras (AST)',
    category: 'Expressões AST',
    filename: 'calculadora_ast.py',
    summary: 'Avaliador de expressões matemáticas via Árvore Sintática Abstrata (AST) do Python. Executa contas complexas sem a brecha de segurança do eval() comum.',
    features: [
      'Usa o módulo nativo `ast` do Python',
      'Suporte a parênteses, precedência matemática e funções',
      'Bloqueia qualquer execução de código malicioso ou comandos do sistema',
      'Extremamente didático para aprender como interpretadores funcionam',
    ],
    code: `"""
Calculadora de Expressões Matemáticas com AST (Segurança Total)
Autor: Python Calculator Studio
Descrição: Avaliador sintático que percorre a árvore matemática sem perigo de injeção de código.
"""
import ast
import operator
import math
from typing import Union

# Mapeamento seguro de operadores
OPERADORES = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

# Funções matemáticas permitidas
FUNCOES_PERMITIDAS = {
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log,
    "log10": math.log10,
    "exp": math.exp,
    "abs": abs,
    "round": round,
}

# Constantes matemáticas
CONSTANTES = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
}

def avaliar_nodo(nodo: ast.AST) -> Union[int, float]:
    """Avalia recursivamente os nós da árvore sintática."""
    if isinstance(nodo, ast.Expression):
        return avaliar_nodo(nodo.body)

    # Números literais (ex: 42, 3.14)
    elif isinstance(nodo, ast.Constant):
        if isinstance(nodo.value, (int, float)):
            return nodo.value
        raise TypeError(f"Tipo constante não suportado: {type(nodo.value)}")

    # Nomes de constantes (ex: pi, e)
    elif isinstance(nodo, ast.Name):
        if nodo.id in CONSTANTES:
            return CONSTANTES[nodo.id]
        raise ValueError(f"Identificador não reconhecido: {nodo.id}")

    # Operações binárias (ex: 2 + 3, 5 * 8)
    elif isinstance(nodo, ast.BinOp):
        tipo_op = type(nodo.op)
        if tipo_op in OPERADORES:
            esquerda = avaliar_nodo(nodo.left)
            direita = avaliar_nodo(nodo.right)
            return OPERADORES[tipo_op](esquerda, direita)
        raise ValueError(f"Operador binário não suportado: {tipo_op.__name__}")

    # Operações unárias (ex: -5, +3)
    elif isinstance(nodo, ast.UnaryOp):
        tipo_op = type(nodo.op)
        if tipo_op in OPERADORES:
            operando = avaliar_nodo(nodo.operand)
            return OPERADORES[tipo_op](operando)
        raise ValueError(f"Operador unário não suportado: {tipo_op.__name__}")

    # Chamadas de função (ex: sqrt(16), sin(pi/2))
    elif isinstance(nodo, ast.Call):
        if isinstance(nodo.func, ast.Name) and nodo.func.id in FUNCOES_PERMITIDAS:
            argumentos = [avaliar_nodo(arg) for arg in nodo.args]
            return FUNCOES_PERMITIDAS[nodo.func.id](*argumentos)
        raise ValueError(f"Função não autorizada ou desconhecida")

    raise TypeError(f"Expressão sintática inválida: {type(nodo).__name__}")

def calcular(expressao: str) -> Union[int, float]:
    """Calcula com segurança uma expressão matemática em texto."""
    arvore = ast.parse(expressao.strip(), mode="eval")
    return avaliar_nodo(arvore)

if __name__ == "__main__":
    exemplos = [
        "2 + 3 * 4",
        "(10 - 2) ** 2",
        "sqrt(144) + 5",
        "sin(pi / 2)",
        "100 // 3 + 100 % 3"
    ]
    
    print("=== TESTE DO PARSER AST SEGURO ===")
    for exp in exemplos:
        res = calcular(exp)
        print(f"{exp:25} = {res}")
`,
    explanation: {
      title: 'Por que usar AST em vez de eval()?',
      description: 'A função nativa `eval()` do Python pode executar comandos destrutivos se o usuário digitar algo malicioso (como `__import__("os").remove(...)`). O módulo `ast` transforma a expressão em nós estruturados e permite que apenas operações matemáticas sejam aceitas.',
      steps: [
        {
          lineRange: 'Linhas 12-40',
          concept: 'Tabelas de Operadores e Funções Permitidas',
          detail: 'Criamos dicionários estritos que mapeiam nós sintáticos (`ast.Add`, `ast.Mult`) para funções do módulo `operator`.',
        },
        {
          lineRange: 'Linhas 42-84',
          concept: 'Função Recursiva `avaliar_nodo`',
          detail: 'Percorre a árvore de baixo para cima respeitando a precedência da matemática sem riscos.',
        },
      ],
    },
  },
];

export interface ReplSample {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const REPL_SAMPLES: ReplSample[] = [
  {
    id: 'bhaskara',
    name: 'Fórmula de Bhaskara',
    description: 'Calcula as raízes de uma equação quadrática ax² + bx + c = 0',
    code: `import math

def resolver_equacao_segundo_grau(a, b, c):
    print(f"Resolvendo: {a}x² + {b}x + {c} = 0")
    delta = b**2 - 4*a*c
    print(f"Delta (Δ) = {delta}")
    
    if delta < 0:
        return "Sem raízes reais (Delta < 0)"
    elif delta == 0:
        x = -b / (2 * a)
        return f"Raiz única: x = {x}"
    else:
        x1 = (-b + math.sqrt(delta)) / (2 * a)
        x2 = (-b - math.sqrt(delta)) / (2 * a)
        return f"Duas raízes: x1 = {x1:.3f}, x2 = {x2:.3f}"

# Teste com a=1, b=-5, c=6  (raízes esperadas: 3 e 2)
resultado = resolver_equacao_segundo_grau(1, -5, 6)
print("Resultado:", resultado)
`,
  },
  {
    id: 'juros',
    name: 'Juros Compostos',
    description: 'Calcula montante final, juros acumulados e evolução mês a mês',
    code: `def calcular_juros_compostos(capital_inicial, taxa_mensal_pct, meses):
    taxa = taxa_mensal_pct / 100
    montante = capital_inicial * ((1 + taxa) ** meses)
    juros_totais = montante - capital_inicial
    
    print(f"Capital Inicial: R$ {capital_inicial:,.2f}")
    print(f"Taxa Mensal: {taxa_mensal_pct}%")
    print(f"Prazo: {meses} meses\\n")
    print("--- Simulação de Crescimento ---")
    
    for mes in range(1, meses + 1):
        saldo = capital_inicial * ((1 + taxa) ** mes)
        if mes % 3 == 0 or mes == meses:
            print(f"Mês {mes:2d}: R$ {saldo:,.2f}")
            
    print(f"\\nMontante Final: R$ {montante:,.2f}")
    print(f"Lucro em Juros: R$ {juros_totais:,.2f}")
    return montante

# R$ 5.000 a 1.2% ao mês durante 12 meses
calcular_juros_compostos(5000, 1.2, 12)
`,
  },
  {
    id: 'estatistica',
    name: 'Estatística de Dados',
    description: 'Média, mediana, desvio padrão e variância de uma lista de valores',
    code: `import statistics

notas_turma = [7.5, 8.2, 6.0, 9.5, 10.0, 5.5, 8.0, 7.8, 9.0, 4.5]

media = statistics.mean(notas_turma)
mediana = statistics.median(notas_turma)
desvio = statistics.stdev(notas_turma)
variancia = statistics.variance(notas_turma)

print(f"Dados analisados ({len(notas_turma)} amostras): {notas_turma}")
print(f"Média Aritmética: {media:.2f}")
print(f"Mediana:          {mediana:.2f}")
print(f"Nota Mínima:      {min(notas_turma)}")
print(f"Nota Máxima:      {max(notas_turma)}")
print(f"Desvio Padrão:    {desvio:.2f}")
print(f"Variância:        {variancia:.2f}")
`,
  },
  {
    id: 'trigonometria',
    name: 'Trigonometria e Geometria',
    description: 'Seno, cosseno, tangente, conversão de graus para radianos e hipotenusa',
    code: `import math

angulo_graus = 45
angulo_rad = math.radians(angulo_graus)

seno = math.sin(angulo_rad)
cosseno = math.cos(angulo_rad)
tangente = math.tan(angulo_rad)

cateto_oposto = 3
cateto_adjacente = 4
hipotenusa = math.hypot(cateto_oposto, cateto_adjacente)

print(f"Ângulo: {angulo_graus}° ({angulo_rad:.4f} radianos)")
print(f"Seno:     {seno:.4f}")
print(f"Cosseno:  {cosseno:.4f}")
print(f"Tangente: {tangente:.4f}")
print(f"\\nTriângulo Retângulo (3, 4):")
print(f"Hipotenusa (math.hypot): {hipotenusa}")
`,
  },
];
