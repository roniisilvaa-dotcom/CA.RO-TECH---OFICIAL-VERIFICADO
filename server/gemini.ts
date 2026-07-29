import { GoogleGenAI } from '@google/genai';
import { ConfiguracaoIA } from '../src/types.js';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY || 'MOCK_KEY';
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'caro-tech-painel' } },
    });
  }
  return genAIInstance;
}

export async function gerarRespostaIA(
  config: ConfiguracaoIA,
  mensagemUsuario: string,
  historicoMensagens: { enviadoPor: string; conteudo: string }[] = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = `Você é ${config.nomeAssistente}, a secretária/atendente virtual de inteligência artificial do WhatsApp oficial da empresa.

Tom de Voz e Estilo de Comunicação:
${config.tomDeVoz}

Base de Conhecimento Oficial da Empresa (Responda estritamente com base nestas informações):
${config.baseConhecimento}

Regras Cruciais do WhatsApp:
1. Responda de forma direta, cortês e adequada para o WhatsApp (máximo de 2-3 parágrafos curtos).
2. Se a dúvida do cliente estiver na base de conhecimento, forneça a resposta com clareza e empatia.
3. Se a pergunta for totalmente fora da base de conhecimento ou solicitar informações confidenciais/inexistentes, explique educadamente que pode verificar com a equipe humana.
4. Mantenha sempre a postura profissional no tom de voz especificado.`;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return `[Simulador IA - ${config.nomeAssistente}]: Olá! Agradeço seu contato. Com base na nossa base de conhecimento, estou à disposição para ajudar. Você perguntou: "${mensagemUsuario}". Como posso prosseguir?`;
  }

  try {
    const ai = getGenAI();
    let contents = '';
    if (historicoMensagens && historicoMensagens.length > 0) {
      const formattedHistory = historicoMensagens
        .slice(-6)
        .map((m) => `${m.enviadoPor === 'contato' ? 'Cliente' : 'Assistente'}: ${m.conteudo}`)
        .join('\n');
      contents = `Histórico recente da conversa:\n${formattedHistory}\n\nCliente: ${mensagemUsuario}\nAssistente:`;
    } else {
      contents = `Cliente: ${mensagemUsuario}\nAssistente:`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: { systemInstruction: systemPrompt, temperature: 0.6 },
    });

    const replyText = response.text?.trim();
    if (replyText) return replyText;
    return `Olá! Sou ${config.nomeAssistente}. Como posso te ajudar hoje?`;
  } catch (error) {
    console.error('Erro ao gerar resposta com Gemini:', error);
    return `Olá! Sou ${config.nomeAssistente}. Recebi sua mensagem: "${mensagemUsuario}". Um momento enquanto verifico os detalhes para você.`;
  }
}
