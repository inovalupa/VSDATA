
import React, { useState, useRef } from 'react';
import { DocumentMetadata, ProposalItem, CompanyInfo } from '../types';
import { generateProposalContent } from '../services/geminiService';
import { extractTextFromPdf } from '../services/pdfService';
import { marked } from 'marked';

interface ProposalGeneratorProps {
  doc: DocumentMetadata;
  onUpdateDoc: (updated: DocumentMetadata) => void;
  onSaveProposal: (title: string, content: string) => void;
}

const DEFAULT_TEMPLATE = `# PROPOSTA COMERCIAL E TÉCNICA

## 1. IDENTIFICAÇÃO DA PROPONENTE
**Empresa:** {{NOME_EMPRESA}}
**CNPJ:** {{CNPJ}}
**Endereço:** {{ENDERECO}}

## 2. OBJETO
A presente proposta tem por objeto o fornecimento de solução tecnológica conforme especificações contidas no edital.

## 3. ESPECIFICAÇÕES TÉCNICAS E PREÇOS
{{TABELA_ITENS}}

## 4. VALIDADE DA PROPOSTA
60 (sessenta) dias a contar da data de apresentação.

## 5. PRAZO DE ENTREGA E GARANTIA
Conforme exigido em edital: {{SLA}}`;

export const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({ doc, onUpdateDoc, onSaveProposal }) => {
  const [company, setCompany] = useState<CompanyInfo>({
    name: '', cnpj: '', address: '', email: '', phone: '', representative: '', bankInfo: ''
  });
  
  const [items, setItems] = useState<ProposalItem[]>([
    { id: '1', description: 'Item 01 - ' + (doc.classification || 'Solução Tecnológica'), quantity: 1, unit: 'UN', brand: '', model: '', unitPrice: 0 }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [localTemplate, setLocalTemplate] = useState(doc.proposalTemplate || DEFAULT_TEMPLATE);
  
  const mdInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'UN', brand: '', model: '', unitPrice: 0 }]);
  };

  const updateItem = (id: string, field: keyof ProposalItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'pdf' | 'md') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTemplateLoading(true);
    try {
      let content = "";
      if (mode === 'pdf') {
        content = await extractTextFromPdf(file);
      } else {
        content = await file.text();
      }
      
      setLocalTemplate(content);
      onUpdateDoc({ ...doc, proposalTemplate: content });
      alert("Template carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao processar template:", error);
      alert("Falha ao carregar arquivo. Verifique o formato.");
    } finally {
      setIsTemplateLoading(false);
      e.target.value = '';
    }
  };

  const saveTemplate = () => {
    onUpdateDoc({ ...doc, proposalTemplate: localTemplate });
    setShowTemplateEditor(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const companyStr = `Nome: ${company.name}, CNPJ: ${company.cnpj}, Endereço: ${company.address}, E-mail: ${company.email}`;
      const itemsStr = items.map(i => `- ${i.description} | Qtd: ${i.quantity} | Marca/Modelo: ${i.brand} ${i.model} | Preço: R$ ${i.unitPrice}`).join('\n');
      
      const result = await generateProposalContent(
        doc.fullText || '', 
        companyStr, 
        itemsStr, 
        doc.proposalTemplate || localTemplate
      );
      
      setGeneratedProposal(result || '');
      onSaveProposal(`Proposta Final - ${company.name || 'Empresa'}`, result || '');
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar proposta com IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToWord = () => {
    const header = "<html><head><meta charset='utf-8'><style>body{font-family:Arial; line-height:1.5; padding:40px;} table{width:100%; border-collapse:collapse; margin:20px 0;} th,td{border:1px solid #ccc; padding:10px; text-align:left;} h1,h2,h3{color:#1a365d;}</style></head><body>";
    const contentHtml = marked.parse(generatedProposal || '');
    const finalHtml = header + contentHtml + "</body></html>";
    const blob = new Blob(['\ufeff', finalHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Proposta_VSDATA_${company.name.replace(/\s+/g, '_') || 'Final'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasCustomTemplate = doc.proposalTemplate && doc.proposalTemplate !== DEFAULT_TEMPLATE;

  return (
    <div className="space-y-8 animate-fadeIn pb-20 max-w-5xl mx-auto">
      {/* Gerenciador de Templates Aprimorado */}
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-800/10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasCustomTemplate ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Configuração de Template</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${hasCustomTemplate ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {hasCustomTemplate ? 'Modelo Customizado Ativo' : 'Utilizando Modelo Padrão VSDATA'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => mdInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Importar .MD
            </button>
            <button 
              onClick={() => pdfInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              Extrair de PDF
            </button>
            <button 
              onClick={() => setShowTemplateEditor(!showTemplateEditor)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showTemplateEditor ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'}`}
            >
              {showTemplateEditor ? 'Fechar Editor' : 'Editar Manualmente'}
            </button>
          </div>
          
          <input ref={mdInputRef} type="file" accept=".md,.txt" className="hidden" onChange={(e) => handleFileUpload(e, 'md')} />
          <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'pdf')} />
        </div>

        {showTemplateEditor && (
          <div className="p-8 space-y-4 bg-slate-950/50 animate-slideDown border-b border-slate-800">
            <div className="flex justify-between items-center">
              {/* Fix: Wrap variable placeholders in strings to prevent JSX shorthand object property errors */}
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Estrutura Markdown (Variáveis: {'{{TABELA_ITENS}}'}, {'{{SLA}}'})</span>
              <div className="flex gap-2">
                <button onClick={() => setLocalTemplate(DEFAULT_TEMPLATE)} className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors">Resetar Padrão</button>
              </div>
            </div>
            <textarea 
              className="w-full h-64 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs font-mono text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none custom-scrollbar"
              placeholder="Defina aqui a estrutura da sua proposta em Markdown..."
              value={localTemplate}
              onChange={(e) => setLocalTemplate(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTemplateEditor(false)} className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase">Cancelar</button>
              <button onClick={saveTemplate} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20">Salvar Alterações</button>
            </div>
          </div>
        )}
      </div>

      {/* Grid de Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário de Itens */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600/10 rounded-lg flex items-center justify-center text-indigo-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20"/><path d="m17 17-5 5-5-5"/><path d="m7 7 5-5 5 5"/></svg>
                </div>
                Detalhamento de Itens
              </h2>
              <button onClick={addItem} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-600/5 px-4 py-2 rounded-lg hover:bg-indigo-600/10 transition-all">+ Adicionar</button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl group relative hover:border-slate-700 transition-all">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-6 space-y-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Descrição Técnica</label>
                      <input 
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0 placeholder:text-slate-800" 
                        placeholder="Nome do produto ou serviço..." 
                        value={item.description} 
                        onChange={e => updateItem(item.id, 'description', e.target.value)} 
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Marca/Modelo</label>
                      <input 
                        className="w-full bg-transparent border-none p-0 text-xs text-slate-400 focus:ring-0 placeholder:text-slate-800" 
                        placeholder="Ex: Dell / R740" 
                        value={item.brand} 
                        onChange={e => updateItem(item.id, 'brand', e.target.value)} 
                      />
                    </div>
                    <div className="col-span-3 md:col-span-1 space-y-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1 text-center block">Qtd</label>
                      <input 
                        type="number" 
                        className="w-full bg-transparent border-none p-0 text-sm text-center font-black text-white focus:ring-0" 
                        value={item.quantity} 
                        onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} 
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1 text-right block">V. Unitário (R$)</label>
                      <input 
                        type="number" 
                        className="w-full bg-transparent border-none p-0 text-sm text-right font-black text-indigo-400 focus:ring-0" 
                        value={item.unitPrice} 
                        onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} 
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {items.length > 1 && (
                        <button onClick={() => removeItem(item.id)} className="text-slate-700 hover:text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dados da Empresa */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-xl">
             <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                Dados da Proponente
             </h2>
             
             <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Razão Social</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Ex: VS Data Soluções Ltda" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">CNPJ / Identificação</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="00.000.000/0001-00" value={company.cnpj} onChange={e => setCompany({...company, cnpj: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Endereço Operacional</label>
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none h-20 resize-none" placeholder="Rua, Número, Bairro, CEP..." value={company.address} onChange={e => setCompany({...company, address: e.target.value})} />
                </div>
             </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !company.name}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-[24px] shadow-2xl shadow-indigo-600/30 disabled:opacity-20 transition-all uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processando Proposta...
              </>
            ) : "Consolidar Proposta IA"}
          </button>
        </div>
      </div>

      {generatedProposal && (
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
               </div>
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Dossiê Consolidado</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Clique no botão ao lado para baixar o arquivo editável</p>
               </div>
            </div>
            <button onClick={exportToWord} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-all uppercase text-xs tracking-widest flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar Word (.DOC)
            </button>
          </div>
          
          <div className="bg-white rounded-3xl shadow-inner border border-slate-200 overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
             </div>
             <div className="proposta-paper p-16 min-h-[800px] overflow-y-auto">
                <div 
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: marked.parse(generatedProposal) }}
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
