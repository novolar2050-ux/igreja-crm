import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Communication as ComType, UserProfile } from '../types';
import { MessageSquare, Send, Mail, Smartphone, Clock, CheckCircle2, User, Trash2 } from 'lucide-react';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Communication: React.FC<Props> = ({ onNotify }) => {
  const [history, setHistory] = useState<ComType[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState({ type: 'email' as 'email'|'sms', subject: '', content: '', recipient_group: 'All Members' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase.from('comunicados').select('*').order('sent_at', { ascending: false });
    setHistory(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    setSending(true);
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      const { error } = await supabase.from('comunicados').insert([{ ...msg, igreja_id: profile.igreja_id }]);
      if (error) throw error;

      onNotify('success', `Mensagem enviada para ${msg.recipient_group}!`);
      setMsg({ type: 'email', subject: '', content: '', recipient_group: 'All Members' });
      fetchHistory();
    } catch (error) {
      onNotify('error', 'Erro ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja remover esta mensagem do histórico?")) return;
    try {
      const { error } = await supabase.from('comunicados').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Mensagem removida.');
      fetchHistory();
    } catch (error) {
      onNotify('error', 'Erro ao remover mensagem.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white mb-1">Comunicação</h2>
        <p className="text-slate-400 text-sm">Central de mensagens para membros e liderança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compose Area */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-800/60 pb-4">
             <div className="bg-blue-600/10 p-2 rounded-lg text-blue-500"><Send size={20} /></div>
             <div>
               <h3 className="text-lg font-semibold text-white">Nova Transmissão</h3>
               <p className="text-xs text-slate-500">Envie notificações em massa.</p>
             </div>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
             {/* Channel Toggle */}
             <div className="p-1 bg-slate-950 rounded-xl inline-flex border border-slate-800">
               <button type="button" onClick={() => setMsg({...msg, type: 'email'})} className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${msg.type === 'email' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
                 <Mail size={16} /> E-mail
               </button>
               <button type="button" onClick={() => setMsg({...msg, type: 'sms'})} className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${msg.type === 'sms' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
                 <Smartphone size={16} /> SMS
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Destinatários</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all" value={msg.recipient_group} onChange={e => setMsg({...msg, recipient_group: e.target.value})}>
                      <option value="All Members">Todos os Membros</option>
                      <option value="Leaders Only">Apenas Líderes</option>
                      <option value="Worship Team">Equipe de Louvor</option>
                      <option value="Youth Group">Rede de Jovens</option>
                    </select>
                  </div>
                </div>
                
                {msg.type === 'email' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assunto</label>
                    <input required placeholder="Título da mensagem" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={msg.subject} onChange={e => setMsg({...msg, subject: e.target.value})} />
                  </div>
                )}
             </div>

             <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Conteúdo</label>
               <div className="relative">
                 <textarea required placeholder="Escreva sua mensagem aqui..." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-white h-48 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed" value={msg.content} onChange={e => setMsg({...msg, content: e.target.value})} />
                 <div className="absolute bottom-3 right-3 text-xs text-slate-600">
                   {msg.content.length} caracteres
                 </div>
               </div>
             </div>

             <div className="pt-4 border-t border-slate-800/60 flex justify-end">
               <button disabled={sending} type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                 {sending ? <Spinner className="w-4 h-4" /> : <><Send size={18} /> Enviar Mensagem</>}
               </button>
             </div>
          </form>
        </div>

        {/* History Area */}
        <div className="flex flex-col h-[600px]">
           <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 flex-1 overflow-hidden flex flex-col backdrop-blur-sm">
             <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
               <Clock size={18} /> Histórico de Envios
             </h3>
             
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
               {loading ? (
                 <div className="flex justify-center py-8"><Spinner /></div>
               ) : history.length === 0 ? (
                 <p className="text-center text-slate-500 py-8 text-sm">Nenhuma mensagem enviada.</p>
               ) : (
                 history.map(h => (
                   <div key={h.id} className="group p-4 bg-slate-950 border border-slate-800/60 hover:border-blue-500/30 rounded-xl transition-all relative">
                     <button 
                       onClick={() => handleDelete(h.id)}
                       className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                     >
                       <Trash2 size={14} />
                     </button>
                     <div className="flex items-center justify-between mb-2 pr-6">
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-md border ${h.type === 'email' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {h.type === 'email' ? <Mail size={10} /> : <Smartphone size={10} />}
                          {h.type}
                        </div>
                        <span className="text-xs text-slate-500">{new Date(h.sent_at).toLocaleDateString('pt-BR')}</span>
                     </div>
                     <p className="text-white font-medium text-sm truncate mb-1">{h.subject || h.content}</p>
                     <div className="flex items-center justify-between mt-2">
                       <p className="text-slate-500 text-xs flex items-center gap-1">
                         <User size={10} /> {h.recipient_group}
                       </p>
                       <span className="text-emerald-500 flex items-center gap-1 text-[10px]">
                         <CheckCircle2 size={10} /> Enviado
                       </span>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};