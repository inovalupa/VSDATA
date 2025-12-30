
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SpecialistType } from "../types";

export const analyzeDocument = async (text: string, specialist: SpecialistType = 'general'): Promise<AnalysisResult> => {
  // Always initialize right before making an API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = specialist === 'ibm_storage' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  let systemInstruction = "";
  
  if (specialist === 'ibm_storage') {
    systemInstruction = `Você é o IBM Storage IA Expert, um Engenheiro de Sistemas Sênior IBM e Auditor de Licitações com inteligência artificial avançada.
    Sua tarefa é analisar o Termo de Referência (TR) com CRITERIOSIDADE MÁXIMA e precisão técnica cirúrgica.
    
    FOCO DA ANÁLISE:
    1. SUGESTÃO DE SOLUÇÃO: Indique o modelo exato (ex: FlashSystem 5200, 7300, 9500) e licenças (Safeguarded Copy, FlashCopy).
    2. PONTOS DE ATENÇÃO (RISCO DE DESCLASSIFICAÇÃO): Identifique requisitos técnicos que a IBM pode ter dificuldade ou que exigem plugins específicos.
    3. GAPS TÉCNICOS: Onde a especificação do edital é ambígua ou restritiva demais.
    
    FORMATAÇÃO: Use estritamente Markdown para tabelas e listas.`;
  } else {
    systemInstruction = `Você é um Consultor Especialista em Licitações Públicas (Lei 14.133).
    Analise o TR buscando cláusulas restritivas, prazos inexequíveis e requisitos de habilitação técnica.
    
    FORMATAÇÃO: Use Markdown rico.`;
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: `Analise o seguinte documento e forneça um relatório técnico detalhado:
    
    DOCUMENTO:
    ${text.substring(0, 30000)}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classification: { type: Type.STRING },
          summary: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          requisitosTecnicos: { type: Type.ARRAY, items: { type: Type.STRING } },
          tecnologiasSugeridas: { type: Type.ARRAY, items: { type: Type.STRING } },
          slaExigido: { type: Type.STRING },
          riscosContratuais: { type: Type.STRING },
          fabricantesAderentes: { type: Type.ARRAY, items: { type: Type.STRING } },
          atestadosExigidos: { type: Type.ARRAY, items: { type: Type.STRING } },
          pontosAtencaoEspecialista: { 
            type: Type.STRING, 
            description: "Markdown detalhando a sugestão de solução e os principais pontos de atenção que podem desclassificar a proposta." 
          }
        },
        required: ["classification", "summary", "keywords", "requisitosTecnicos", "tecnologiasSugeridas", "slaExigido", "riscosContratuais", "fabricantesAderentes", "atestadosExigidos", "pontosAtencaoEspecialista"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as AnalysisResult;
};

export const chatWithData = async (
  history: { role: 'user' | 'model', content: string }[],
  message: string,
  context: string,
  specialist: SpecialistType = 'general'
) => {
  // Always initialize right before making an API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const instruction = `Você é o ${specialist === 'ibm_storage' ? 'IBM Storage IA Expert' : 'Consultor Especialista em Licitações Públicas'}.
  Use o contexto do edital abaixo para responder. Sempre use Markdown.
  
  CONTEXTO:
  ${context.substring(0, 15000)}`;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction: instruction },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }))
  });

  const response = await chat.sendMessage({ message: message });
  return response.text;
};

export const generateProposalContent = async (context: string, companyData: string, itemsTable: string, customTemplate?: string) => {
  // Always initialize right before making an API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Gere uma proposta comercial baseada nestes dados:
    EMPRESA: ${companyData}
    ITENS: ${itemsTable}
    EDITAL: ${context.substring(0, 10000)}
    ${customTemplate ? `TEMPLATE CUSTOMIZADO: ${customTemplate}` : ''}
    
    Responda em Markdown. Se houver um TEMPLATE CUSTOMIZADO, siga rigorosamente a estrutura dele, preenchendo as lacunas com os dados fornecidos.`,
    config: {
      systemInstruction: "Você é um gestor comercial sênior. Sua missão é criar propostas técnicas e comerciais irrefutáveis, com formatação impecável em Markdown."
    }
  });
  return response.text;
};

export const generateNewDocument = async (context: string, prompt: string) => {
  // Always initialize right before making an API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Contexto do Edital: ${context.substring(0, 10000)}\n\nPedido: ${prompt}`,
    config: {
      systemInstruction: "Gere documentos técnicos em Markdown baseados no edital fornecido."
    }
  });
  return response.text;
};
