
export enum UserRole {
  ADMIN = 'ADMIN',
  RH = 'RH',
  DELIVERY = 'DELIVERY'
}

export enum Seniority {
  JUNIOR = 'Junior',
  PLENO = 'Pleno',
  SENIOR = 'Sênior'
}

export type SAPModule = 
  | 'ABAP' | 'CPI' | 'PI' | 'BTP' 
  | 'FI' | 'CO' | 'PS' | 'SD' | 'MM' | 'EWM' | 'PP' | 'PM' | 'QM'
  | 'PROJECT_MANAGEMENT';

export type Industry = 
  | 'Pharma' | 'Retail' | 'Fashion' | 'Professional Services' 
  | 'Food & Beverage' | 'Automotive' | 'General';

export interface Question {
  id: string;
  type: 'TECHNICAL' | 'BUSINESS' | 'SOFT_SKILL';
  text: string;
  options?: string[];
  correctAnswer?: string;
  isMultipleChoice: boolean;
  industry?: Industry;
  seniority: Seniority;
  logicExplanation?: string; // Por que esta questão avalia este nível?
}

export interface AssessmentSession {
  id: string;
  candidateName: string;
  candidateEmail: string;
  role: SAPModule;
  seniority: Seniority;
  industry: Industry;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  questions: Question[];
  answers: Record<string, string>;
  score?: number;
  analysis?: string; // Análise detalhada da IA
  knowledgeSourceContext?: string; // Simulação de dados do Sharepoint/Docs
  createdAt: number;
  completedAt?: number;
  consentLGPD: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}
