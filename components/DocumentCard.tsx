
import React from 'react';
import { DocumentMetadata } from '../types';

interface DocumentCardProps {
  doc: DocumentMetadata;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ doc, isSelected, onSelect, onDelete }) => {
  return (
    <div 
      className={`p-4 rounded-xl transition-all cursor-pointer border ${
        isSelected 
          ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
      onClick={() => onSelect(doc.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="overflow-hidden">
            <h3 className="font-semibold text-sm truncate text-slate-100">{doc.name}</h3>
            <p className="text-xs text-slate-500">{(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadDate).toLocaleDateString()}</p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
      
      {doc.classification && (
        <div className="mt-3 flex flex-wrap gap-1">
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] uppercase tracking-wider font-bold">
            {doc.classification}
          </span>
        </div>
      )}
    </div>
  );
};
