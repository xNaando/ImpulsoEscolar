class QuizGame {
    constructor() {
        this.currentLevel = 1;
        this.questionElement = document.getElementById('question-text');
        this.optionsButtons = document.querySelectorAll('.option-btn');
        this.levelDisplay = document.getElementById('current-level');
        this.loadingOverlay = document.getElementById('loading-overlay');
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

    async fetchQuestionFromBackend(prompt) {
        const response = await fetch('https://impulso-escolar.vercel.app/api/pergunta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('Resposta inválida da IA.');
        }
        return data.choices[0].message.content;
    }

    parseQuestion(raw) {
        // Espera o formato:
        // Pergunta: ...\nA) ...\nB) ...\nC) ...\nD) ...\nResposta correta: ...
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

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.add('active');
        } else {
            this.loadingOverlay.classList.remove('active');
        }
    }

    async loadNewQuestion() {
        this.isLoading = true;
        this.showLoading(true);
        this.questionElement.textContent = "Carregando pergunta...";
        this.optionsButtons.forEach(btn => {
            btn.textContent = "...";
            btn.disabled = true;
            btn.classList.remove('correct', 'incorrect');
        });
        try {
            const prompt = `Gere uma questão de múltipla escolha para o ${this.currentLevel}º ano do ensino fundamental brasileiro, com 4 alternativas e apenas uma correta. Responda neste formato: Pergunta: ... A) ... B) ... C) ... D) ... Resposta correta: ...`;
            const raw = await this.fetchQuestionFromBackend(prompt);
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
        this.showLoading(false);
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
        if (acertou && this.currentLevel < 10) {
            this.currentLevel++;
        } else if (!acertou && this.currentLevel > 1) {
            this.currentLevel--;
        }
        this.levelDisplay.textContent = this.currentLevel;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuizGame();
}); 