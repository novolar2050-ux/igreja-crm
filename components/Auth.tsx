import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Spinner } from './Spinner';

interface AuthProps {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onNotify }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const getErrorMessage = (err: any) => {
    if (typeof err === 'string') return err;
    return err?.message || err?.error_description || 'Erro desconhecido.';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        onNotify('success', 'Cadastro iniciado! Se o login automático não ocorrer, verifique seu e-mail.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Login successful, App.tsx handles redirect
      }
    } catch (error: any) {
      onNotify('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
          <Lock className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Ecclesia</h2>
        <p className="text-slate-400">
          {isSignUp ? 'Crie sua conta administrativa' : 'Acesse o painel da igreja'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Endereço de E-mail</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              placeholder="admin@igreja.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner /> : (
            <>
              {isSignUp ? 'Criar Conta' : 'Entrar'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
          {isSignUp ? 'Já tem uma conta?' : "Ainda não tem acesso?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors focus:outline-none underline decoration-emerald-400/30 underline-offset-4"
          >
            {isSignUp ? 'Fazer Login' : 'Cadastrar Igreja'}
          </button>
        </p>
      </div>
    </div>
  );
};