class QuizGame {
    constructor() {
        this.currentLevel = 1;
        this.apiKey = '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';
        this.model = 'deepseek/deepseek-chat-v3-0324:free';
        this.questionElement = document.getElementById('question-text');
        this.optionsButtons = document.querySelectorAll('.option-btn');
        this.levelDisplay = document.getElementById('current-level');
        this.levelAnimation = document.getElementById('level-animation');
        this.currentQuestion = null;
        this.currentCorrect = null;
        this.isLoading = false;

        this.setupEventListeners();
        this.loadNewQuestion();
    }

    setupEventListeners() {
        this.optionsButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleAnswer(e));
        });
    }

    async fetchQuestion(level) {
        const prompt = `Gere uma questão de múltipla escolha para o ${level}º ano do ensino fundamental brasileiro, com 4 alternativas e apenas uma correta. Responda exatamente neste formato:\nPergunta: ...\nA) ...\nB) ...\nC) ...\nD) ...\nResposta correta: ...\nNão repita o enunciado na resposta correta. Não explique, apenas siga o formato.`;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar questão da IA.');
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }

    parseQuestion(raw) {
        // Limpar qualquer texto antes de 'Pergunta:' e depois de 'Resposta correta:'
        const perguntaMatch = raw.match(/Pergunta:(.*?)(A\)|A\))/is);
        let pergunta = '';
        let opcoes = [];
        let resposta = '';
        const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
        for (let line of lines) {
            if (line.toLowerCase().startsWith('pergunta:')) {
                pergunta = line.replace(/pergunta:/i, '').trim();
            } else if (/^[A-D]\)/i.test(line)) {
                opcoes.push(line.replace(/^[A-D]\)\s*/i, ''));
            } else if (line.toLowerCase().startsWith('resposta correta:')) {
                resposta = line.replace(/resposta correta:/i, '').trim();
            }
        }
        // Tornar resposta robusta: aceitar 'Letra C', 'Alternativa B', 'Opção D', 'C', 'c', etc.
        let idx = -1;
        let letra = resposta.match(/[A-Da-d]/);
        if (letra) {
            idx = letra[0].toUpperCase().charCodeAt(0) - 65;
        } else {
            // Procurar pelo texto da alternativa
            for (let i = 0; i < opcoes.length; i++) {
                if (opcoes[i].toLowerCase().trim() === resposta.toLowerCase().trim()) {
                    idx = i;
                    break;
                }
            }
            // fallback: se não achou, tenta por similaridade
            if (idx === -1) {
                idx = opcoes.findIndex(opt => opt.toLowerCase().includes(resposta.toLowerCase()));
            }
        }
        return {
            pergunta,
            opcoes,
            correta: idx
        };
    }

    async loadNewQuestion() {
        this.isLoading = true;
        this.questionElement.textContent = "Carregando pergunta...";
        this.optionsButtons.forEach(btn => {
            btn.textContent = "...";
            btn.disabled = true;
            btn.classList.remove('correct', 'incorrect');
        });
        try {
            const raw = await this.fetchQuestion(this.currentLevel);
            const parsed = this.parseQuestion(raw);
            if (!parsed.pergunta || parsed.opcoes.length !== 4 || parsed.correta === -1) {
                throw new Error('Pergunta inválida gerada pela IA.');
            }
            this.currentQuestion = parsed;
            this.currentCorrect = parsed.correta;
            this.displayQuestion();
        } catch (error) {
            this.questionElement.textContent = `Erro ao carregar pergunta: ${error.message}`;
            this.currentQuestion = null;
            this.currentCorrect = null;
        }
        this.isLoading = false;
    }

    displayQuestion() {
        this.levelDisplay.textContent = this.currentLevel;
        this.questionElement.textContent = this.currentQuestion.pergunta;
        this.optionsButtons.forEach((button, idx) => {
            button.textContent = this.currentQuestion.opcoes[idx] || '---';
            button.disabled = false;
            button.classList.remove('correct', 'incorrect');
        });
    }

    handleAnswer(event) {
        if (this.isLoading || !this.currentQuestion) return;
        const selectedButton = event.target;
        const idx = Array.from(this.optionsButtons).indexOf(selectedButton);
        this.optionsButtons.forEach(btn => btn.disabled = true);
        if (idx === this.currentCorrect) {
            selectedButton.classList.add('correct');
            this.updateLevel(true);
        } else {
            selectedButton.classList.add('incorrect');
            this.optionsButtons[this.currentCorrect].classList.add('correct');
            this.updateLevel(false);
        }
        setTimeout(() => {
            this.optionsButtons.forEach(btn => btn.classList.remove('correct', 'incorrect'));
            this.loadNewQuestion();
        }, 1800);
    }

    updateLevel(acertou) {
        const oldLevel = this.currentLevel;
        if (acertou && this.currentLevel < 10) {
            this.currentLevel++;
        } else if (!acertou && this.currentLevel > 1) {
            this.currentLevel--;
        }
        if (oldLevel !== this.currentLevel) {
            this.showLevelAnimation(acertou);
        }
        this.levelDisplay.textContent = this.currentLevel;
    }

    showLevelAnimation(subiu) {
        const levelText = this.levelAnimation.querySelector('.level-text');
        levelText.textContent = subiu ? '⬆️ Subiu de Nível!' : '⬇️ Desceu de Nível!';
        this.levelAnimation.classList.add('show');
        setTimeout(() => {
            this.levelAnimation.classList.remove('show');
        }, 1500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuizGame();
}); 