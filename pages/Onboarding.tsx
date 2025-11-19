import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Church, ArrowRight, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

// Helper to safely extract error message
const getErrorMessage = (error: any): string => {
  if (!error) return 'Erro desconhecido';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  return JSON.stringify(error);
};

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [churchName, setChurchName] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleReset = () => {
    // Força recarregamento na rota de setup
    window.location.href = '/#/setup';
    window.location.reload();
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage('Autenticando...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirou. Faça login novamente.");

      let churchData = null;
      const maxAttempts = 15; 
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setStatusMessage(attempt === 1 
            ? 'Criando sua igreja...' 
            : `Sincronizando banco de dados (${attempt}/${maxAttempts})...`
          );
          
          // Tenta inserir
          const { data, error: insertError } = await supabase
            .from('igrejas')
            .insert([{ 
              nome: churchName,
              created_by: user.id 
            }])
            .select()
            .single();

          if (insertError) {
            const isSchemaIssue = 
              insertError.code === '42P01' || 
              insertError.code === '42703' || 
              insertError.code === 'PGRST200' ||
              insertError.message.includes('schema cache');

            if (isSchemaIssue) {
               if (attempt < maxAttempts) {
                 await sleep(3000);
                 continue;
               } else {
                 throw new Error(`Banco de dados inacessível. Código: ${insertError.code}. Detalhe: ${insertError.message}`);
               }
            }
            throw insertError;
          }
          
          churchData = data;
          break; 

        } catch (loopErr: any) {
          // Se for a última tentativa, relança o erro
          if (attempt === maxAttempts) throw loopErr;
          
          // Se for erro desconhecido, relança imediatamente (exceto se for schema)
          if (!loopErr.code || (loopErr.code !== '42P01' && loopErr.code !== '42703')) {
             throw loopErr;
          }
          await sleep(3000);
        }
      }

      if (!churchData) throw new Error("Falha crítica ao criar igreja.");

      setStatusMessage('Configurando perfil...');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          igreja_id: churchData.id,
          full_name: fullName,
          role: 'super_admin'
        }]);

      if (profileError) throw profileError;

      setStatusMessage('Concluído!');
      await sleep(1000);
      onComplete();

    } catch (err: any) {
      console.error('Erro Onboarding:', err);
      const msg = getErrorMessage(err);
      
      if (msg.includes('row-level security')) {
        setError("Erro de Permissão (RLS). O script SQL precisa ser executado novamente.");
      } else if (msg.includes('42703')) {
        setError("Erro de Estrutura: Coluna 'created_by' ausente. Execute o script SQL novamente.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4">
            <Church className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo ao Ecclesia</h2>
          <p className="text-slate-400">Para começar, vamos registrar sua igreja.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
             <div className="flex items-start gap-3">
               <div className="mt-1 text-red-400"><AlertTriangle size={16} /></div>
               <div>
                 <h4 className="text-red-400 font-semibold text-sm">Ocorreu um erro</h4>
                 <p className="text-red-300 text-sm mt-1 mb-3">{error}</p>
                 <button 
                   onClick={handleReset}
                   className="text-xs bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-2 rounded transition-colors flex items-center gap-2"
                 >
                   <RefreshCw size={12} /> Reconfigurar Banco de Dados
                 </button>
               </div>
             </div>
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Seu Nome Completo</label>
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
              placeholder="Ex: Pr. João Silva"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome da Igreja</label>
            <input
              required
              type="text"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
              placeholder="Ex: Comunidade Vida Nova"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {statusMessage}
              </>
            ) : (
              <>
                Criar Igreja e Entrar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};