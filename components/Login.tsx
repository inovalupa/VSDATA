
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciais inválidas. Verifique seu login e senha.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-[9999]">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden border-t-4 border-t-indigo-600">
        {/* Decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex flex-col items-center mb-10">
            <a href="https://vsdata.com.br/" target="_blank" rel="noopener noreferrer" className="mb-6 hover:scale-105 transition-transform flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter text-white uppercase leading-none">VS Data</span>
              <div className="h-1.5 w-20 bg-indigo-600 rounded-full mt-3"></div>
            </a>
            <h1 className="text-2xl font-black text-center text-slate-100 tracking-tight mt-2">GovTech TR Analyzer</h1>
            <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Sistemas de Inteligência em Licitações</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Identificação / E-mail</label>
              <input 
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800 text-white font-medium" 
                placeholder="Seu login de acesso"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Chave de Segurança</label>
              <input 
                type="password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800 text-white font-medium" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-400 text-[11px] font-bold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/30 transform hover:scale-[1.02] uppercase text-xs tracking-widest">
              AUTENTICAR ACESSO
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest leading-loose">
              GovTech Intelligence Platform<br/>
              Protegido por Criptografia AES-256
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
