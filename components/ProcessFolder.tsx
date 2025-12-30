
import React, { useState } from 'react';
import { DocumentMetadata, AuditEntry } from '../types';

interface ProcessFolderProps {
  doc: DocumentMetadata;
}

export const ProcessFolder: React.FC<ProcessFolderProps> = ({ doc }) => {
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PROPOSTA': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
      case 'CHAT_LOG': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
      default: return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
    }
  };

  return (
    <div className="flex h-full gap-6 animate-fadeIn">
      {/* Lista de Arquivos/Eventos */}
      <div className="w-1/3 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-800/20">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-tighter">Timeline do Processo</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {doc.history && doc.history.length > 0 ? (
            [...doc.history].reverse().map(entry => (
              <div 
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedEntry?.id === entry.id 
                    ? 'bg-indigo-600/20 border-indigo-500/50' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  {getTypeIcon(entry.type)}
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.type.replace('_', ' ')}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 truncate">{entry.title}</h4>
                <p className="text-[10px] text-slate-600 mt-1 font-mono">
                  {new Date(entry.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 opacity-30 text-center p-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              <p className="text-xs">Nenhum artefato gerado para este edital ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Visualizador de Conteúdo */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        {selectedEntry ? (
          <>
            <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-200">{selectedEntry.title}</h3>
                <p className="text-[10px] text-indigo-500 font-bold uppercase">Registro de Auditoria #{selectedEntry.id.split('-')[0]}</p>
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(selectedEntry.content)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 transition-all"
              >
                COPIAR TEXTO
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/50">
              <div className="max-w-3xl mx-auto">
                <div className={`whitespace-pre-wrap text-sm leading-relaxed ${selectedEntry.type === 'PROPOSTA' ? 'font-serif bg-white text-slate-900 p-12 shadow-2xl' : 'font-sans text-slate-300'}`}>
                  {selectedEntry.content}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p className="font-bold">Selecione um registro para revisão</p>
          </div>
        )}
      </div>
    </div>
  );
};
