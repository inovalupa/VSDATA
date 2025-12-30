
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisProject, ChatMessage, AuditEntry, User, ProjectFile, DocumentMetadata, SpecialistType } from './types';
import { extractTextFromPdf } from './services/pdfService';
import { analyzeDocument, chatWithData } from './services/geminiService';
import { AnalysisView } from './components/AnalysisView';
import { ProposalGenerator } from './components/ProposalGenerator';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { marked } from 'marked';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<AnalysisProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat' | 'proposal' | 'admin'>('analysis');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistType>('general');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Carregamento inicial
  useEffect(() => {
    const savedUsers = localStorage.getItem('govtech_users');
    const savedProjects = localStorage.getItem('govtech_projects');

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const initialUsers: User[] = [{ id: 'admin-1', name: 'Administrador Master', email: 'admin', password: '123456', role: 'admin' }];
      setUsers(initialUsers);
      localStorage.setItem('govtech_users', JSON.stringify(initialUsers));
    }

    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed.map((p: any) => ({
          ...p,
          createDate: new Date(p.createDate),
          history: p.history.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) }))
        })));
      } catch (e) {
        console.error("Erro ao carregar projetos", e);
      }
    }
  }, []);

  // Persistência
  useEffect(() => {
    localStorage.setItem('govtech_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('govtech_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin');
      setSelectedProjectId(null); 
    } else {
      setActiveTab('analysis');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('analysis');
    setSelectedProjectId(null);
  };

  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    const exists = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (exists) {
      throw new Error("Este login/e-mail já está em uso no sistema.");
    }

    const userWithId: User = {
      ...newUser,
      id: crypto.randomUUID()
    };

    setUsers(prev => [...prev, userWithId]);
  };

  const handleDeleteUser = (id: string) => {
    if (id === 'admin-1') {
      alert("Não é possível remover a conta master do sistema.");
      return;
    }
    
    if (confirm("Deseja realmente remover este acesso? Esta ação é irreversível.")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !currentUser) return;

    const newProject: AnalysisProject = {
      id: crypto.randomUUID(),
      ownerId: currentUser.id,
      ownerEmail: currentUser.email,
      name: newProjectName,
      createDate: new Date(),
      files: [],
      history: [],
      specialist: selectedSpecialist
    };

    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
    setNewProjectName('');
    setShowCreateModal(false);
    setActiveTab('analysis');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf' || !currentUser || !selectedProjectId) return;

    setIsProcessing(true);
    try {
      const text = await extractTextFromPdf(file);
      
      const project = projects.find(p => p.id === selectedProjectId);
      if (!project) return;

      const analysis = await analyzeDocument(text, project.specialist);
      
      const newFile: ProjectFile = { 
        id: crypto.randomUUID(), 
        name: file.name, 
        size: file.size, 
        type: file.type, 
        uploadDate: new Date(), 
        text 
      };

      const auditEntry: AuditEntry = {
        id: crypto.randomUUID(),
        type: 'DOCUMENTO_APOIO',
        title: `Análise Inicial: ${file.name}`,
        content: analysis.pontosAtencaoEspecialista || 'Relatório gerado com sucesso.',
        timestamp: new Date()
      };

      setProjects(prev => prev.map(p => p.id === selectedProjectId ? { 
        ...p, 
        ...analysis, 
        files: [...p.files, newFile], 
        fullText: (p.fullText || '') + '\n\n' + text, 
        history: [...p.history, auditEntry] 
      } : p));

      setActiveTab('analysis');

    } catch (error) {
      console.error("Erro na análise:", error);
      alert("Falha ao processar análise técnica. Verifique sua conexão.");
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !selectedProject || isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithData(
        history,
        userMessage.content,
        selectedProject.fullText || '',
        selectedProject.specialist
      );

      const modelMessage: ChatMessage = {
        role: 'model',
        content: response || 'Sem resposta do assistente.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const filteredProjects = currentUser?.role === 'admin' ? projects : projects.filter(p => p.ownerId === currentUser?.id);

  if (!currentUser) return <Login onLogin={handleLogin} users={users} />;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-inter">
      <aside className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/30">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <a href="https://vsdata.com.br/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all">
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter text-white uppercase group-hover:text-indigo-400 transition-colors">VS Data</span>
                <p className="text-[6px] font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5 ml-0.5">GovTech TR Analyzer</p>
              </div>
            </a>
            <button onClick={handleLogout} className="text-slate-600 hover:text-red-400 transition-colors p-2 hover:bg-slate-800 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>

          <button onClick={() => setShowCreateModal(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 mb-8 transition-all shadow-xl shadow-indigo-600/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            NOVA ANÁLISE
          </button>

          <div className="flex flex-col gap-1 mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">Seu Perfil</span>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${currentUser.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                 {currentUser.name.substring(0,2).toUpperCase()}
               </div>
               <div className="overflow-hidden">
                 <p className="text-xs font-bold truncate text-slate-200">{currentUser.name}</p>
                 <p className="text-[9px] font-black text-slate-500 uppercase">{currentUser.role === 'admin' ? 'Gestor Master' : 'Consultor'}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-3 custom-scrollbar">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 block mb-2">Pastas Ativas</span>
          {filteredProjects.map(p => (
            <div key={p.id} onClick={() => { setSelectedProjectId(p.id); setActiveTab('analysis'); }} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedProjectId === p.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>
              <h3 className={`text-sm font-bold truncate ${selectedProjectId === p.id ? 'text-slate-100' : 'text-slate-400'}`}>{p.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${p.specialist === 'ibm_storage' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                 <p className="text-[9px] text-slate-500 font-black uppercase">{p.specialist === 'ibm_storage' ? 'IBM Storage IA Expert' : 'Geral'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-800 mt-auto">
          <a 
            href="https://github.com/inovalupa/GOVTECH_Analyzer_VSDATA" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 group-hover:text-white transition-colors">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
              <path d="M9 18c-4.51 2-4.51-2-7-2"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Código Fonte</span>
              <span className="text-[8px] text-slate-600 font-mono truncate max-w-[150px]">inovalupa/GOVTECH_Analyzer...</span>
            </div>
          </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!selectedProject && activeTab !== 'admin' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <div className="mb-8 flex flex-col items-center animate-fadeIn">
               <span className="text-6xl font-black tracking-tighter text-white uppercase mb-2">VS Data</span>
               <div className="h-1.5 w-24 bg-indigo-600 rounded-full"></div>
             </div>
             <h2 className="text-3xl font-black mb-4 tracking-tighter text-white">GovTech TR Analyzer</h2>
             <p className="text-slate-500 max-w-sm mx-auto">Selecione uma análise ativa no menu lateral ou inicie um novo projeto de auditoria técnica para conformidade de editais.</p>
          </div>
        ) : (
          <>
            <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-sm shrink-0">
              <div className="flex gap-8 h-full">
                {selectedProject && (
                  <>
                    <button onClick={() => setActiveTab('analysis')} className={`h-full text-xs font-black uppercase border-b-2 transition-all ${activeTab === 'analysis' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}>INTELIGÊNCIA</button>
                    <button onClick={() => setActiveTab('chat')} className={`h-full text-xs font-black uppercase border-b-2 transition-all ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}>CONSULTOR IA</button>
                    <button onClick={() => setActiveTab('proposal')} className={`h-full text-xs font-black uppercase border-b-2 transition-all ${activeTab === 'proposal' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}>PROPOSTA</button>
                  </>
                )}
                {currentUser.role === 'admin' && (
                  <button onClick={() => { setActiveTab('admin'); setSelectedProjectId(null); }} className={`h-full text-xs font-black uppercase border-b-2 transition-all ${activeTab === 'admin' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}>GESTÃO DE ACESSOS</button>
                )}
              </div>
              {selectedProject && (
                <div className="text-right">
                  <p className="text-sm font-black text-slate-200">{selectedProject.name}</p>
                  <p className="text-[10px] text-indigo-500 font-black uppercase">{selectedProject.specialist === 'ibm_storage' ? 'IBM Storage IA Expert' : 'Consultor Geral'}</p>
                </div>
              )}
            </header>

            <div className="flex-1 overflow-y-auto bg-slate-950/20 custom-scrollbar">
              {activeTab === 'admin' && currentUser.role === 'admin' ? (
                <div className="p-8">
                  <UserManagement 
                    users={users} 
                    onAddUser={handleAddUser} 
                    onDeleteUser={handleDeleteUser} 
                  />
                </div>
              ) : selectedProject?.files.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                   <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                      <div className="flex flex-col items-center mb-4">
                        <span className="text-3xl font-black tracking-tighter text-white uppercase">VS Data</span>
                        <div className="h-1 w-12 bg-indigo-600 rounded-full mt-1"></div>
                      </div>
                      <h3 className="text-2xl font-black text-white">Auditoria Técnica Especializada</h3>
                      <p className="text-slate-500 text-sm">Realize o upload do Termo de Referência em PDF para análise automatizada pela IA de conformidade e riscos de mercado.</p>
                      
                      <label className={`block cursor-pointer transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                         <div className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3">
                           {isProcessing ? (
                             <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> PROCESSANDO DOCUMENTO...</>
                           ) : "INICIAR IMPORTAÇÃO PDF"}
                         </div>
                         <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                      </label>
                   </div>
                </div>
              ) : (
                <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
                   {activeTab === 'analysis' && selectedProject && (
                     <AnalysisView 
                       doc={selectedProject as any} 
                       onSaveDocument={(t, c) => {
                         setProjects(prev => prev.map(p => p.id === selectedProjectId ? { 
                           ...p, history: [...p.history, { id: crypto.randomUUID(), timestamp: new Date(), title: t, content: c, type: 'DOCUMENTO_APOIO' }] 
                         } : p));
                       }} 
                     />
                   )}
                   {activeTab === 'chat' && (
                     <div className="flex flex-col h-[calc(100vh-200px)]">
                        <div className="flex-1 overflow-y-auto space-y-4 p-4 custom-scrollbar">
                          {chatMessages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-lg ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }} />
                              </div>
                            </div>
                          ))}
                          {isChatLoading && <div className="text-xs text-indigo-400 animate-pulse">Consultor IA está analisando...</div>}
                          <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex gap-3">
                          <input 
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm" 
                            placeholder="Tire suas dúvidas técnicas sobre o documento..." 
                            value={currentInput} 
                            onChange={e => setCurrentInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button onClick={handleSendMessage} className="bg-indigo-600 px-6 py-2 rounded-xl text-xs font-black">ENVIAR</button>
                        </div>
                     </div>
                   )}
                   {activeTab === 'proposal' && selectedProject && (
                     <ProposalGenerator 
                       doc={selectedProject as any}
                       onUpdateDoc={(up) => setProjects(prev => prev.map(p => p.id === up.id ? { ...p, proposalTemplate: up.proposalTemplate } : p))}
                       onSaveProposal={(t, c) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { 
                         ...p, history: [...p.history, { id: crypto.randomUUID(), timestamp: new Date(), title: t, content: c, type: 'PROPOSTA' }] 
                       } : p))}
                     />
                   )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[40px] p-10 space-y-8 animate-slideUp shadow-2xl border-t-4 border-t-indigo-500">
              <div className="flex flex-col items-center mb-2">
                 <span className="text-3xl font-black tracking-tighter text-white uppercase">VS Data</span>
                 <div className="h-1 w-12 bg-indigo-600 rounded-full mt-1"></div>
              </div>
              <h2 className="text-xl font-black text-center text-white">Criar Nova Auditoria</h2>
              <div className="space-y-4">
                 <input 
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                   placeholder="Referência do Cliente / Número do Edital"
                   value={newProjectName} 
                   onChange={e => setNewProjectName(e.target.value)} 
                 />
                 <div className="flex gap-2">
                    <button onClick={() => setSelectedSpecialist('general')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedSpecialist === 'general' ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>Padrão Geral</button>
                    <button onClick={() => setSelectedSpecialist('ibm_storage')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedSpecialist === 'ibm_storage' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>IBM Storage IA Expert</button>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setShowCreateModal(false)} className="flex-1 py-4 text-xs font-black text-slate-500 uppercase">Cancelar</button>
                 <button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-20 uppercase text-xs">Confirmar Projeto</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
