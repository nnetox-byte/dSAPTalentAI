
import { GoogleGenAI, Type } from "@google/genai";
import { SAPModule, Seniority, Industry, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAssessmentQuestions = async (
  module: SAPModule,
  seniority: Seniority,
  industry: Industry,
  context?: string
): Promise<Question[]> => {
  const prompt = `
    ATUE COMO UM ARQUITETO SAP SENIOR E RECRUTADOR TÉCNICO.
    Gere 10 questões de alta precisão para avaliar um consultor ${module} nível ${seniority} na indústria ${industry}.
    
    DIRETRIZES DE SENIORIDADE:
    - JUNIOR: Foco em transações básicas, navegação, conceitos fundamentais e execução de tarefas guiadas.
    - PLENO: Foco em configuração (IMG), solução de problemas, entendimento de processos integrados e autonomia funcional/técnica.
    - SENIOR: Foco em arquitetura de solução, Clean Core, BTP extensions, impactos cross-module, liderança técnica e melhores práticas (ACTIVATE).

    CONTEXTO ADICIONAL (SHAREPOINT/INTERNO): ${context || 'Nenhum contexto extra fornecido.'}

    REQUISITOS:
    - 4 Técnicas (específicas de ${module}).
    - 4 Processos de Negócio (${industry}).
    - 2 Soft Skills (comportamento em projetos críticos).
    
    Retorne um JSON seguindo o schema fornecido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['TECHNICAL', 'BUSINESS', 'SOFT_SKILL'] },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              isMultipleChoice: { type: Type.BOOLEAN },
              logicExplanation: { type: Type.STRING, description: 'Explique por que esta questão valida o nível ' + seniority }
            },
            required: ["id", "type", "text", "isMultipleChoice"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro na geração de questões:", error);
    throw error;
  }
};

export const evaluateAssessment = async (session: any): Promise<{ score: number, analysis: string }> => {
  const prompt = `
    AVALIE AS RESPOSTAS DO CANDIDATO SAP.
    Perfil: ${session.role} ${session.seniority} na Indústria ${session.industry}.
    
    Respostas do Candidato:
    ${JSON.stringify(session.answers, null, 2)}
    
    Critérios:
    1. Precisão técnica dos termos SAP.
    2. Entendimento do fluxo de negócio ${session.industry}.
    3. Maturidade na resposta (Soft Skills).
    
    Forneça um Score (0-100) e uma análise crítica detalhada (Analysis) separada por pontos fortes e pontos de atenção.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            analysis: { type: Type.STRING }
          },
          required: ["score", "analysis"]
        }
      }
    });
    return JSON.parse(response.text || '{"score": 0, "analysis": "Erro na avaliação"}');
  } catch (error) {
    return { score: 0, analysis: "Não foi possível processar a avaliação automática." };
  }
};
