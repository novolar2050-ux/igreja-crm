
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Church, CheckCircle, User, AlertCircle } from 'lucide-react';
import { Spinner } from '../components/Spinner';

export const PublicRegistration: React.FC = () => {
  const { churchId } = useParams();
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', birth_date: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) {
      setError("Link inválido: ID da igreja ausente.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Tenta inserir como visitante anônimo
      const { error: err } = await supabase.from('membros').insert([{
        ...formData,
        igreja_id: churchId,
        role_type: 'Visitor',
        status: 'Active',
        address: 'Cadastro Online'
      }]);

      if (err) {
        console.error("Supabase Error:", err);
        if (err.code === '42501') {
           throw new Error("Erro de Permissão. O administrador da igreja precisa executar o script de configuração (SQL) para habilitar cadastros públicos.");
        }
        if (err.code === '42703') {
           throw new Error("Banco de dados desatualizado. Colunas ausentes.");
        }
        throw err;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Não foi possível realizar o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
           <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <CheckCircle size={32} className="text-emerald-500" />
           </div>
           <h2 className="text-2xl font-bold text-white mb-2">Cadastro Realizado!</h2>
           <p className="text-slate-400">Seus dados foram enviados para a secretaria da igreja. Obrigado!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
         <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 mb-4 shadow-lg shadow-indigo-600/30">
              <Church className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Bem-vindo(a)</h1>
            <p className="text-slate-400 text-sm mt-1">Preencha seus dados para se conectar conosco.</p>
         </div>

         {error && (
           <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6 flex items-start gap-3">
             <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
             <p className="text-red-400 text-sm">{error}</p>
           </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="Seu nome" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Celular / WhatsApp</label>
              <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">E-mail (Opcional)</label>
              <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="exemplo@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Data de Nascimento</label>
              <input type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
            </div>

            <button disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
               {loading ? <Spinner className="w-5 h-5" /> : 'Enviar Cadastro'}
            </button>
         </form>
      </div>
    </div>
  );
};
