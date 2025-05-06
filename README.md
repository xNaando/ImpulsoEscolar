# Impulso Escolar - Quiz Educacional

Um aplicativo de quiz educacional que gera perguntas de múltipla escolha usando IA (Claude 3.5 Haiku via OpenRouter).

## Funcionalidades

- Interface de usuário intuitiva e responsiva
- Geração de perguntas baseadas em temas escolhidos pelo usuário
- Sistema de níveis progressivos (1-100)
- Feedback imediato sobre respostas
- Adaptação da dificuldade conforme o desempenho do usuário

## Estrutura do Projeto

- `index.html` - Interface principal do aplicativo
- `styles.css` - Estilos e layout
- `script.js` - Lógica do jogo e interação com o backend
- `api/generate-question.js` - Backend para geração de perguntas via OpenRouter
- `vercel.json` - Configuração para deploy na Vercel

## Configuração

Para executar o projeto, você precisa:

1. Criar uma conta na Vercel e fazer deploy do projeto
2. Configurar a variável de ambiente `API_KEY` na Vercel com sua chave de API do OpenRouter
3. Atualizar o domínio de referência no arquivo `api/generate-question.js` para o seu domínio na Vercel

## Como Jogar

1. Digite um tema para o quiz
2. Clique em "Iniciar Quiz"
3. Responda às perguntas clicando nas opções
4. Acerte para avançar de nível, erre para voltar um nível
