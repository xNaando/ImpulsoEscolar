// API route para gerar perguntas usando OpenRouter (Claude 3.5 Haiku)
import { NextResponse } from 'next/server';

// Configuração CORS para permitir requisições do frontend
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

/**
 * Função principal para gerar perguntas de múltipla escolha
 */
async function generateQuestion(req) {
  try {
    // Obter dados da requisição
    const { topic, level } = await req.json();
    
    if (!topic || !level) {
      return NextResponse.json(
        { error: 'Tema e nível são obrigatórios' },
        { status: 400 }
      );
    }

    // Construir o prompt para a API do OpenRouter
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

    // Fazer requisição para a API do OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'HTTP-Referer': 'https://impulso-escolar-gofemfbmp-fernandos-projects-a1576899.vercel.app', // Domínio de deployment
        'X-Title': 'Impulso Escolar'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-haiku',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na API do OpenRouter:', errorData);
      return NextResponse.json(
        { error: 'Erro ao gerar pergunta' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Extrair o JSON da resposta
    const content = data.choices[0].message.content;
    
    // Tentar fazer parse do JSON
    try {
      const questionData = JSON.parse(content);
      return NextResponse.json(questionData);
    } catch (error) {
      console.error('Erro ao fazer parse do JSON:', error);
      return NextResponse.json(
        { error: 'Formato de resposta inválido' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao gerar pergunta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportar a função com CORS
export const GET = allowCors(generateQuestion);
export const POST = allowCors(generateQuestion);
