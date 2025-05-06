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

    async translateText(text) {
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
            const data = await response.json();
            return data[0][0][0];
        } catch (error) {
            return text;
        }
    }

    getWikipediaQuestion(level) {
        // Converte o nível (1-10) para uma query de dificuldade apropriada
        const difficulty = level <= 3 ? 'fácil' : level <= 7 ? 'médio' : 'avançado';

        return fetch(`https://pt.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro&explaintext&generator=random&grnnamespace=0&grnlimit=5&grncontinue=`)
            .then(response => response.json())
            .then(async data => {
                const pages = data.query.pages;
                const page = Object.values(pages)[0];
                const extract = page.extract;
                return this.generateQuestionFromText(extract, level);
            });
    }

    async generateQuestionFromText(text, level) {
        if (!text) return this.getWikipediaQuestion(level);

        text = text.replace(/\n/g, ' ').replace(/\([^)]*\)/g, '');

        // Ajusta o tamanho das frases baseado no nível
        const minLen = Math.max(10, level * 5);  // Nível 1: 10 caracteres, Nível 10: 50 caracteres
        const maxLen = Math.min(50, level * 20); // Nível 1: 50 caracteres, Nível 10: 200 caracteres

        const sentences = text.split('. ')
            .filter(s => s.length >= minLen && s.length <= maxLen)
            .filter(s => !s.includes('?') && !s.includes('!'))
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (sentences.length === 0) {
            return this.getWikipediaQuestion(level);
        }

        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
        const words = randomSentence.split(' ');

        // Filtra palavras baseado no nível
        const minWordLength = Math.max(3, Math.min(level, 5));
        const maxWordLength = Math.min(8, level * 2);

        const importantWords = words.filter(w =>
            w.length >= minWordLength &&
            w.length <= maxWordLength &&
            /^[a-zA-ZÀ-ÿ]+$/.test(w)
        );

        if (importantWords.length < 4) {
            return this.getWikipediaQuestion(level);
        }

        const wordToAsk = importantWords[Math.floor(Math.random() * importantWords.length)];
        const question = randomSentence.replace(wordToAsk, '_____');

        const incorrectOptions = importantWords
            .filter(w => w !== wordToAsk)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        return {
            question: `Complete a frase: ${question}`,
            correct_answer: wordToAsk,
            incorrect_answers: incorrectOptions
        };
    }

    async getTriviaQuestion(level) {
        try {
            // Converte o nível 1-10 para as dificuldades da API
            const difficulty = level <= 3 ? 'easy' : level <= 7 ? 'medium' : 'hard';
            const response = await fetch(`https://opentdb.com/api.php?amount=1&difficulty=${difficulty}&type=multiple`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const question = data.results[0];

                // Simplifica a pergunta para níveis mais baixos
                let translatedQuestion = await this.translateText(question.question);
                if (level <= 3) {
                    translatedQuestion = translatedQuestion
                        .replace(/Qual dos seguintes/i, 'Qual')
                        .replace(/Qual das seguintes/i, 'Qual')
                        .replace(/Qual destas opções/i, 'Qual')
                        .replace(/Qual dessas opções/i, 'Qual');
                }

                const translatedCorrectAnswer = await this.translateText(question.correct_answer);
                const translatedIncorrectAnswers = await Promise.all(
                    question.incorrect_answers.map(answer => this.translateText(answer))
                );

                return {
                    question: translatedQuestion,
                    correct_answer: translatedCorrectAnswer,
                    incorrect_answers: translatedIncorrectAnswers
                };
            }
        } catch (error) {
            console.error('Erro ao buscar pergunta do Trivia:', error);
        }

        return this.getWikipediaQuestion(level);
    }

    async loadNewQuestion() {
        try {
            // Alterna entre as fontes de perguntas
            const sources = [
                () => this.getWikipediaQuestion(this.currentLevel),
                () => this.getTriviaQuestion(this.currentLevel)
            ];
            const randomSource = sources[Math.floor(Math.random() * sources.length)];
            this.currentQuestion = await randomSource();
            this.displayQuestion();
        } catch (error) {
            console.error('Erro ao carregar pergunta:', error);
            this.loadNewQuestion();
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