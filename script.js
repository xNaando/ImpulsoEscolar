class QuizGame {
    constructor() {
        this.currentLevel = 1;
        this.questionElement = document.getElementById('question-text');
        this.optionsButtons = document.querySelectorAll('.option-btn');
        this.levelDisplay = document.getElementById('current-level');
        this.levelAnimation = document.getElementById('level-animation');
        this.currentQuestion = null;

        this.setupEventListeners();
        this.loadNewQuestion();
    }

    setupEventListeners() {
        this.optionsButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleAnswer(e));
        });
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateMathQuestion(level) {
        let num1, num2, operation, result, question, options;

        switch (level) {
            case 1: // Soma simples (1-10)
                num1 = this.getRandomInt(1, 10);
                num2 = this.getRandomInt(1, 10);
                question = `Quanto é ${num1} + ${num2}?`;
                result = num1 + num2;
                options = this.generateOptions(result, 20, 5);
                break;

            case 2: // Subtração simples (1-20)
                num1 = this.getRandomInt(10, 20);
                num2 = this.getRandomInt(1, num1);
                question = `Quanto é ${num1} - ${num2}?`;
                result = num1 - num2;
                options = this.generateOptions(result, 20, 5);
                break;

            case 3: // Multiplicação simples (1-5)
                num1 = this.getRandomInt(1, 5);
                num2 = this.getRandomInt(1, 5);
                question = `Quanto é ${num1} × ${num2}?`;
                result = num1 * num2;
                options = this.generateOptions(result, 25, 5);
                break;

            case 4: // Multiplicação (6-10)
                num1 = this.getRandomInt(6, 10);
                num2 = this.getRandomInt(2, 5);
                question = `Quanto é ${num1} × ${num2}?`;
                result = num1 * num2;
                options = this.generateOptions(result, 50, 10);
                break;

            case 5: // Divisão simples
                num2 = this.getRandomInt(1, 5);
                result = this.getRandomInt(1, 10);
                num1 = num2 * result;
                question = `Quanto é ${num1} ÷ ${num2}?`;
                options = this.generateOptions(result, 10, 2);
                break;

            case 6: // Expressões simples
                num1 = this.getRandomInt(1, 10);
                num2 = this.getRandomInt(1, 10);
                const num3 = this.getRandomInt(1, 10);
                question = `Quanto é ${num1} + ${num2} × ${num3}?`;
                result = num1 + (num2 * num3);
                options = this.generateOptions(result, 100, 20);
                break;

            case 7: // Porcentagem simples
                num1 = this.getRandomInt(1, 10) * 10;
                num2 = this.getRandomInt(1, 10) * 10;
                question = `Quanto é ${num2}% de ${num1}?`;
                result = (num1 * num2) / 100;
                options = this.generateOptions(result, num1, num1 / 10);
                break;

            case 8: // Equação do primeiro grau
                num1 = this.getRandomInt(1, 10);
                num2 = this.getRandomInt(1, 20);
                question = `Qual é o valor de x na equação: ${num1}x + ${num2} = ${num1 * result + num2}?`;
                result = this.getRandomInt(1, 10);
                options = this.generateOptions(result, 20, 3);
                break;

            case 9: // Geometria
                num1 = this.getRandomInt(2, 10);
                result = num1 * num1;
                question = `Qual é a área de um quadrado com lado ${num1}?`;
                options = this.generateOptions(result, result * 2, result / 2);
                break;

            case 10: // Trigonometria básica
                const angulos = [30, 45, 60];
                const senos = [0.5, 0.71, 0.87];
                const index = this.getRandomInt(0, 2);
                question = `Qual é aproximadamente o seno de ${angulos[index]}°?`;
                result = senos[index];
                options = this.generateOptions(result, 1, 0.1, 2);
                break;
        }

        return {
            question,
            correct_answer: result.toString(),
            incorrect_answers: options.filter(opt => opt !== result.toString())
        };
    }

    generateOptions(correctAnswer, maxRange, variance, decimals = 0) {
        const options = new Set();
        options.add(correctAnswer.toFixed(decimals));

        while (options.size < 4) {
            let option;
            if (decimals === 0) {
                option = this.getRandomInt(
                    Math.max(correctAnswer - variance, 0),
                    correctAnswer + variance
                ).toString();
            } else {
                option = (correctAnswer + (Math.random() * variance * 2 - variance)).toFixed(decimals);
            }
            if (option !== correctAnswer.toFixed(decimals)) {
                options.add(option);
            }
        }

        return Array.from(options);
    }

    async loadNewQuestion() {
        try {
            this.currentQuestion = this.generateMathQuestion(this.currentLevel);
            this.displayQuestion();
        } catch (error) {
            console.error('Erro ao gerar pergunta:', error);
            this.questionElement.textContent = 'Erro ao gerar pergunta. Tente novamente.';
        }
    }

    displayQuestion() {
        this.questionElement.textContent = this.currentQuestion.question;

        const answers = [
            this.currentQuestion.correct_answer,
            ...this.currentQuestion.incorrect_answers
        ].sort(() => Math.random() - 0.5);

        this.optionsButtons.forEach((button, index) => {
            button.textContent = answers[index];
            button.className = 'option-btn';
        });
    }

    async handleAnswer(event) {
        const selectedButton = event.target;
        const selectedAnswer = selectedButton.textContent;
        const correctAnswer = this.currentQuestion.correct_answer;

        this.optionsButtons.forEach(btn => btn.disabled = true);

        this.optionsButtons.forEach(button => {
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            } else if (button === selectedButton) {
                button.classList.add('incorrect');
            }
        });

        const isCorrect = selectedAnswer === correctAnswer;
        await this.updateLevel(isCorrect);

        setTimeout(() => {
            this.optionsButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('correct', 'incorrect');
            });
            this.loadNewQuestion();
        }, 2000);
    }

    async updateLevel(isCorrect) {
        const oldLevel = this.currentLevel;

        if (isCorrect && this.currentLevel < 10) {
            this.currentLevel++;
        } else if (!isCorrect && this.currentLevel > 1) {
            this.currentLevel--;
        }

        if (oldLevel !== this.currentLevel) {
            this.showLevelAnimation(isCorrect);
        }

        this.levelDisplay.textContent = this.currentLevel;
    }

    showLevelAnimation(isUp) {
        const levelText = this.levelAnimation.querySelector('.level-text');
        levelText.textContent = isUp ? '⬆️ Subiu de Nível!' : '⬇️ Desceu de Nível!';

        this.levelAnimation.classList.add('show');

        setTimeout(() => {
            this.levelAnimation.classList.remove('show');
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuizGame();
}); 