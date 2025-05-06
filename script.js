/**
 * Classe principal do Quiz
 */
class QuizGame {
    constructor() {
        // Elementos da interface
        this.topicInput = document.getElementById('topic');
        this.currentLevelElement = document.getElementById('current-level');
        this.startButton = document.getElementById('start-btn');
        this.quizContainer = document.getElementById('quiz-container');
        this.questionText = document.getElementById('question-text');
        this.optionButtons = [
            document.getElementById('option0'),
            document.getElementById('option1'),
            document.getElementById('option2'),
            document.getElementById('option3')
        ];
        this.feedbackElement = document.getElementById('feedback');
        this.loadingElement = document.getElementById('loading');

        // Estado do jogo
        this.currentLevel = 1;
        this.currentQuestion = null;
        this.correctAnswerIndex = null;

        // Inicializar eventos
        this.initEvents();
    }

    /**
     * Inicializa os eventos dos elementos da interface
     */
    initEvents() {
        // Evento do botão de iniciar
        this.startButton.addEventListener('click', () => this.startQuiz());

        // Eventos dos botões de opções
        this.optionButtons.forEach((button, index) => {
            button.addEventListener('click', () => this.checkAnswer(index));
        });
    }

    /**
     * Inicia o quiz
     */
    startQuiz() {
        const topic = this.topicInput.value.trim();
        
        if (!topic) {
            alert('Por favor, digite um tema para o quiz!');
            return;
        }

        // Mostrar o container do quiz
        this.quizContainer.style.display = 'block';
        
        // Buscar uma nova pergunta
        this.fetchNewQuestion();
    }

    /**
     * Busca uma nova pergunta do backend
     */
    async fetchNewQuestion() {
        // Mostrar o indicador de carregamento
        this.loadingElement.style.display = 'block';
        this.feedbackElement.style.display = 'none';
        
        // Resetar o estado dos botões
        this.resetOptionButtons();

        const topic = this.topicInput.value.trim();
        
        try {
            // Buscar pergunta do backend
            const questionData = await this.fetchQuestionFromBackend(topic, this.currentLevel);
            
            // Atualizar a interface com a nova pergunta
            this.updateQuestionUI(questionData);
        } catch (error) {
            console.error('Erro ao buscar pergunta:', error);
            
            // Usar dados de teste em caso de erro
            const testData = this.getTestQuestion(topic, this.currentLevel);
            this.updateQuestionUI(testData);
        } finally {
            this.loadingElement.style.display = 'none';
        }
    }

    /**
     * Busca uma pergunta do backend
     * @param {string} topic - O tema do quiz
     * @param {number} level - O nível atual
     * @returns {Promise<Object>} - Dados da pergunta
     */
    async fetchQuestionFromBackend(topic, level) {
        // Construir o prompt para a API
        const prompt = `
            Crie uma pergunta de múltipla escolha sobre o tema "${topic}" com nível de dificuldade ${level} (em uma escala de 1 a 100, onde 1 é muito fácil e 100 é extremamente difícil).
            
            A pergunta deve ser adequada para estudantes do ensino fundamental.
            
            Forneça a pergunta, 4 opções de resposta (sendo apenas uma correta) e o índice da resposta correta (0, 1, 2 ou 3).
            
            Responda no formato JSON exatamente assim:
            {
              "question": "Texto da pergunta aqui",
              "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
              "correctAnswerIndex": 0
            }
            
            Não inclua nenhum texto adicional, apenas o JSON.
        `;

        // URL do backend
        const backendUrl = 'https://impulso-escolar-backend.vercel.app/api/generate-question';
        
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: topic,
                level: level
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Gera uma pergunta de teste para quando o backend não estiver disponível
     * @param {string} topic - O tema do quiz
     * @param {number} level - O nível atual
     * @returns {Object} - Dados da pergunta de teste
     */
    getTestQuestion(topic, level) {
        // Perguntas de teste para diferentes temas
        const testQuestions = [
            {
                question: `Pergunta de teste sobre ${topic} (Nível ${level}): Qual é a capital do Brasil?`,
                options: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"],
                correctAnswerIndex: 2
            },
            {
                question: `Pergunta de teste sobre ${topic} (Nível ${level}): Quanto é 2 + 2?`,
                options: ["3", "4", "5", "6"],
                correctAnswerIndex: 1
            },
            {
                question: `Pergunta de teste sobre ${topic} (Nível ${level}): Qual é o maior planeta do Sistema Solar?`,
                options: ["Terra", "Marte", "Júpiter", "Saturno"],
                correctAnswerIndex: 2
            }
        ];
        
        // Selecionar uma pergunta aleatória
        const randomIndex = Math.floor(Math.random() * testQuestions.length);
        return testQuestions[randomIndex];
    }

    /**
     * Atualiza a interface com a nova pergunta
     * @param {Object} questionData - Dados da pergunta
     */
    updateQuestionUI(questionData) {
        // Atualizar o texto da pergunta
        this.questionText.textContent = questionData.question;
        
        // Atualizar as opções
        questionData.options.forEach((option, index) => {
            this.optionButtons[index].textContent = option;
        });
        
        // Armazenar a resposta correta
        this.correctAnswerIndex = questionData.correctAnswerIndex;
        
        // Atualizar o nível atual
        this.currentLevelElement.textContent = this.currentLevel;
        
        // Armazenar a pergunta atual
        this.currentQuestion = questionData;
    }

    /**
     * Verifica a resposta selecionada pelo usuário
     * @param {number} selectedIndex - Índice da opção selecionada
     */
    checkAnswer(selectedIndex) {
        // Evitar múltiplos cliques
        if (this.feedbackElement.style.display === 'block') {
            return;
        }

        // Verificar se a resposta está correta
        const isCorrect = selectedIndex === this.correctAnswerIndex;
        
        // Destacar a opção selecionada
        this.optionButtons[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Se a resposta estiver errada, destacar a resposta correta
        if (!isCorrect) {
            this.optionButtons[this.correctAnswerIndex].classList.add('correct');
        }
        
        // Mostrar feedback
        this.showFeedback(isCorrect);
        
        // Atualizar o nível
        if (isCorrect) {
            this.currentLevel++;
        } else {
            this.currentLevel = Math.max(1, this.currentLevel - 1);
        }
        
        // Atualizar o elemento de nível
        this.currentLevelElement.textContent = this.currentLevel;
        
        // Buscar nova pergunta após 2 segundos
        setTimeout(() => this.fetchNewQuestion(), 2000);
    }

    /**
     * Mostra feedback sobre a resposta
     * @param {boolean} isCorrect - Se a resposta está correta
     */
    showFeedback(isCorrect) {
        this.feedbackElement.textContent = isCorrect 
            ? 'Correto! Avançando para o próximo nível.' 
            : 'Incorreto! Voltando um nível.';
        
        this.feedbackElement.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
        this.feedbackElement.style.display = 'block';
    }

    /**
     * Reseta os botões de opções para o estado inicial
     */
    resetOptionButtons() {
        this.optionButtons.forEach(button => {
            button.className = 'option-btn';
        });
    }
}

// Inicializar o jogo quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const game = new QuizGame();
});
