
import React, { useState } from 'react';
import { DocumentMetadata, AuditEntry } from '../types';
import { generateNewDocument } from '../services/geminiService';
import { marked } from 'marked';

interface AnalysisViewProps {
  doc: DocumentMetadata;
  onSaveDocument: (title: string, content: string) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ doc, onSaveDocument }) => {
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<AuditEntry | null>(null);

  const handleGenerate = async () => {
    if (!genPrompt) return;
    setIsGenerating(true);
    try {
      const result = await generateNewDocument(doc.fullText || '', genPrompt);
      onSaveDocument(`Gerado: ${genPrompt.substring(0, 30)}...`, result || '');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMarkdown = (content: string) => {
    return { __html: marked.parse(content || '') };
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            Análise de Viabilidade e Risco
          </h2>
          <span className={`px-4 py-1.5 border rounded-full text-xs font-black uppercase tracking-widest ${
            doc.specialist === 'ibm_storage' 
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          }`}>
            {doc.specialist === 'ibm_storage' ? 'IBM Storage IA Expert' : 'CONSULTORIA GERAL'}
          </span>
        </div>

        {/* ALERTA CRÍTICO DE DESCLASSIFICAÇÃO */}
        {doc.pontosAtencaoEspecialista && (
          <div className="bg-red-500/10 border-2 border-red-500/30 p-8 rounded-3xl mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-red-500/10"></div>
            <h3 className="text-red-500 font-black text-sm uppercase mb-4 flex items-center gap-3">
               <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
               </div>
               RISCOS DE DESCLASSIFICAÇÃO & GAPS TÉCNICOS
            </h3>
            <div 
              className="markdown-content text-slate-200 text-sm leading-relaxed pl-11"
              dangerouslySetInnerHTML={renderMarkdown(doc.pontosAtencaoEspecialista)}
            />
          </div>
        )}

        <div className="bg-slate-800/20 border border-slate-700/50 p-6 rounded-2xl mb-8">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Sumário Executivo do Edital</h3>
          <div className="markdown-content text-slate-300 text-sm" dangerouslySetInnerHTML={renderMarkdown(doc.summary || '')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              SLA & Exigências Temporais
            </h3>
            <div className="markdown-content text-sm text-slate-200 font-bold" dangerouslySetInnerHTML={renderMarkdown(doc.slaExigido || '')} />
          </div>
          <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Impacto Jurídico e Contratual
            </h3>
            <div className="markdown-content text-sm text-red-400/90 font-bold" dangerouslySetInnerHTML={renderMarkdown(doc.riscosContratuais || '')} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          <h3 className="font-black text-slate-100 mb-6 flex items-center gap-3 text-lg uppercase tracking-tighter">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
            </div>
            {doc.specialist === 'ibm_storage' ? 'Soluções IBM Recomendadas' : 'Requisitos de Projeto'}
          </h3>
          <ul className="space-y-4">
            {doc.tecnologiasSugeridas?.map((tech, i) => (
              <li key={i} className="text-sm text-slate-400 flex gap-4 items-center bg-slate-800/20 p-4 rounded-xl border border-slate-700/30">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <div className="markdown-content font-black text-slate-200 uppercase text-xs" dangerouslySetInnerHTML={renderMarkdown(tech)} />
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          <h3 className="font-black text-slate-100 mb-6 flex items-center gap-3 text-lg uppercase tracking-tighter">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            Qualificação Técnica
          </h3>
          <div className="space-y-4">
             {doc.atestadosExigidos?.map((atestado, i) => (
               <div key={i} className="flex items-start gap-4 bg-slate-800/20 p-4 rounded-xl border border-slate-700/30 hover:bg-slate-800/40 transition-colors">
                  <div className="mt-1 text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <div className="markdown-content text-xs text-slate-300 font-bold uppercase" dangerouslySetInnerHTML={renderMarkdown(atestado)} />
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-black mb-6 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Documentação de Apoio à Proposta (Markdown)
        </h2>
        <div className="flex flex-col gap-6">
          <textarea
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[120px] placeholder:text-slate-700"
            placeholder="Ex: Gere uma declaração de conformidade Markdown detalhando o suporte ao protocolo NVMe..."
            value={genPrompt}
            onChange={(e) => setGenPrompt(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !genPrompt}
            className="bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                GERANDO MARKDOWN...
              </>
            ) : "GERAR E ARQUIVAR DOCUMENTO"}
          </button>
        </div>
      </div>
      
      {/* Visualizador de Arquivos do Dossier */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 bg-slate-800/10 flex justify-between items-center">
           <h2 className="text-xl font-black text-slate-100 flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
             DOSSIÊ TÉCNICO (REPOSITÓRIO MARKDOWN)
           </h2>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ID: {doc.id.split('-')[0]}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">
           <div className="border-r border-slate-800 bg-slate-900/30 overflow-y-auto max-h-[700px] custom-scrollbar">
              {doc.history && doc.history.length > 0 ? (
                [...doc.history].reverse().map(entry => (
                  <div key={entry.id} onClick={() => setSelectedArchive(entry)} className={`p-6 border-b border-slate-800/50 cursor-pointer transition-all relative group ${selectedArchive?.id === entry.id ? 'bg-indigo-600/10' : 'hover:bg-slate-800/30'}`}>
                    {selectedArchive?.id === entry.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                    <h4 className={`text-sm font-black uppercase tracking-tighter ${selectedArchive?.id === entry.id ? 'text-indigo-400' : 'text-slate-300'}`}>{entry.title}</h4>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-[8px] font-black text-slate-500 rounded border border-slate-700 uppercase">{entry.type}</span>
                      <p className="text-[10px] text-slate-600 font-mono">{entry.timestamp.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center opacity-20 flex flex-col items-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum artefato gerado</p>
                </div>
              )}
           </div>
           <div className="lg:col-span-2 bg-slate-950/50 p-12 overflow-y-auto">
              {selectedArchive ? (
                <div className="max-w-3xl mx-auto">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                    <h3 className="text-xl font-black text-white uppercase">{selectedArchive.title}</h3>
                    <button onClick={() => navigator.clipboard.writeText(selectedArchive.content)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500" title="Copiar Markdown Original">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                  <div 
                    className="markdown-content text-sm text-slate-300 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={renderMarkdown(selectedArchive.content)}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p className="font-black uppercase tracking-[0.3em] text-sm mt-4">Aguardando Seleção</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
