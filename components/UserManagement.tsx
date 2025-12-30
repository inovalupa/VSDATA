
import React, { useState } from 'react';
import { User } from '../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email || !password || !name) {
      setError("Todos os campos são obrigatórios para habilitar um novo perfil.");
      return;
    }

    if (password.length < 6) {
      setError("Por segurança, a senha deve conter no mínimo 6 caracteres.");
      return;
    }

    try {
      onAddUser({ email, password, name, role });
      setEmail('');
      setPassword('');
      setName('');
      setRole('user');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Falha ao registrar novo perfil técnico.");
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    consultants: users.filter(u => u.role === 'user').length
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-24">
      {/* Cabeçalho de Segurança */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">CENTRAL DE ACESSOS E PERMISSÕES</h1>
          <p className="text-slate-500 text-sm mt-1 uppercase font-black tracking-widest">Painel de Controle de Identidades GovTech</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-3xl flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 font-black">
              {stats.admins}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase">Gestores</p>
              <p className="text-xs font-black text-white">Full Access</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-3xl flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-black">
              {stats.consultants}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase">Consultores</p>
              <p className="text-xs font-black text-white">Project Access</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário de provisionamento */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            
            <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </div>
              Provisionar Acesso
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nível de Autoridade</label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setRole('user')}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'user' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    Consultor
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-amber-600 text-white shadow-xl shadow-amber-600/20' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    Gestor Master
                  </button>
                </div>
                <p className="text-[9px] text-slate-600 font-bold px-2 italic">
                  {role === 'admin' 
                    ? "* Gestores possuem acesso total a auditorias, gestão de usuários e dossiers." 
                    : "* Consultores acessam apenas projetos criados por eles mesmos."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Identificação Nominal</label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800" 
                  value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Engenheiro Carlos Silva" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ID de Acesso (E-mail)</label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800" 
                  value={email} onChange={e => setEmail(e.target.value)} placeholder="carlos.silva@govtech.io" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Chave de Segurança</label>
                <input 
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800" 
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" 
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-tight flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-[10px] font-black text-green-500 uppercase tracking-tight flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Acesso provisionado com sucesso!
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 uppercase text-xs tracking-[0.2em]">
                HABILITAR ACESSO
              </button>
            </form>
          </div>
        </div>

        {/* Listagem de identidades ativas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl border-t-indigo-500/20 border-t-4">
            <div className="p-8 border-b border-slate-800 bg-slate-800/10 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest">Contas Registradas</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Monitoramento de Segurança Ativo</p>
              </div>
              <div className="flex -space-x-2">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-indigo-400">
                    {u.name.charAt(0)}
                  </div>
                ))}
                {users.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                    +{users.length - 5}
                  </div>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {users.map(u => (
                <div key={u.id} className="p-6 flex items-center justify-between group hover:bg-slate-800/10 transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black relative ${
                      u.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'
                    }`}>
                      {u.name.substring(0,2).toUpperCase()}
                      {u.role === 'admin' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-900"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 flex items-center gap-2">
                        {u.name}
                        {u.id === 'admin-1' && (
                          <span className="text-[8px] bg-slate-100 text-slate-900 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">MASTER</span>
                        )}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                        <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
                        <span className={`text-[9px] font-black tracking-widest uppercase ${u.role === 'admin' ? 'text-amber-500/80' : 'text-indigo-500/80'}`}>
                          {u.role === 'admin' ? 'Gestor Master' : 'Consultor Técnico'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {u.id !== 'admin-1' ? (
                      <button 
                        onClick={() => onDeleteUser(u.id)} 
                        className="p-3 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
                        title="Revogar Credencial"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">Revogar</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    ) : (
                      <div className="p-3 text-slate-800 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Protegido</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-indigo-600/5 border border-indigo-500/20 p-6 rounded-[32px] flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              <strong className="text-indigo-400">Dica de Segurança:</strong> As senhas são armazenadas localmente neste navegador. Para ambientes produtivos, recomenda-se a integração com SSO ou sistemas de autenticação centralizados (Active Directory/LDAP).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
