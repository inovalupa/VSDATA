
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
}

export type SpecialistType = 'general' | 'ibm_storage';

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  brand: string;
  model: string;
  unitPrice: number;
}

export interface CompanyInfo {
  name: string;
  cnpj: string;
  address: string;
  email: string;
  phone: string;
  representative: string;
  bankInfo: string;
}

export type AuditEntryType = 'PROPOSTA' | 'DOCUMENTO_APOIO' | 'CHAT_LOG';

export interface AuditEntry {
  id: string;
  type: AuditEntryType;
  title: string;
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  text: string;
}

export interface AnalysisResult {
  classification: string;
  summary: string;
  keywords: string[];
  requisitosTecnicos: string[];
  tecnologiasSugeridas: string[];
  slaExigido: string;
  riscosContratuais: string;
  fabricantesAderentes: string[];
  atestadosExigidos: string[];
  pontosAtencaoEspecialista?: string; // Novo campo para gaps específicos
}

export interface DocumentMetadata extends Partial<AnalysisResult> {
  id: string;
  name: string;
  size: number;
  uploadDate: Date | string;
  fullText?: string;
  proposalTemplate?: string;
  history: AuditEntry[];
  specialist?: SpecialistType;
}

export interface AnalysisProject extends Partial<AnalysisResult> {
  id: string;
  ownerId: string;
  ownerEmail: string;
  name: string;
  createDate: Date;
  files: ProjectFile[];
  fullText?: string;
  proposalTemplate?: string;
  history: AuditEntry[];
  specialist: SpecialistType; // Obrigatório no projeto
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
