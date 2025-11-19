import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Church, UserProfile } from '../types';
import { Settings as SettingsIcon, Save, User, Building, Key } from 'lucide-react';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Settings: React.FC<Props> = ({ onNotify }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ churchName: '', fullName: '' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        
        if (prof?.igreja_id) {
          const { data: ch } = await supabase.from('igrejas').select('*').eq('id', prof.igreja_id).single();
          setChurch(ch);
          setFormData({ churchName: ch?.nome || '', fullName: prof.full_name || '' });
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
       if (profile) {
         const { error: pErr } = await supabase.from('profiles').update({ full_name: formData.fullName }).eq('id', profile.id);
         if (pErr) throw pErr;
       }
       if (church && profile?.igreja_id) {
         const { error: cErr } = await supabase.from('igrejas').update({ nome: formData.churchName }).eq('id', profile.igreja_id);
         if (cErr) throw cErr;
       }
       onNotify('success', 'Configurações salvas com sucesso!');
    } catch (error) {
      onNotify('error', 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
       <div className="flex items-center gap-3 mb-6">
         <div className="bg-slate-800 p-3 rounded-xl"><SettingsIcon size={24} className="text-slate-400" /></div>
         <div>
            <h2 className="text-2xl font-bold text-white">Configurações</h2>
            <p className="text-slate-400 text-sm">Gerencie dados da igreja e seu perfil.</p>
         </div>
       </div>

       <form onSubmit={handleSave} className="space-y-8">
         <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building size={18} className="text-indigo-500" /> Dados da Igreja
            </h3>
            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome da Instituição</label>
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.churchName} onChange={e => setFormData({...formData, churchName: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">ID do Sistema (Técnico)</label>
                 <input disabled className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 cursor-not-allowed font-mono text-xs" value={church?.id || ''} />
               </div>
            </div>
         </div>

         <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-emerald-500" /> Seu Perfil
            </h3>
            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome de Exibição</label>
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">E-mail (Login)</label>
                 <input disabled className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 cursor-not-allowed" value={profile?.email || '...'} />
               </div>
            </div>
         </div>

         <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all">
               {saving ? <Spinner className="w-5 h-5" /> : <Save size={20} />} Salvar Alterações
            </button>
         </div>
       </form>
    </div>
  );
};