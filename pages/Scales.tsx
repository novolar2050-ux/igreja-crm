
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { VolunteerScale, UserProfile } from '../types';
import { ListChecks, Plus, Calendar, User, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Scales: React.FC<Props> = ({ onNotify }) => {
  const [scales, setScales] = useState<VolunteerScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', date: '', ministry_name: '', volunteers: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
    });
  }, []);

  const fetchScales = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('escalas').select('*').order('date', { ascending: true });
    if (error) onNotify('error', 'Erro ao carregar escalas.');
    setScales(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchScales(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    try {
      const payload = { ...formData, igreja_id: profile.igreja_id };
      if (editingId) {
        await supabase.from('escalas').update(payload).eq('id', editingId);
        onNotify('success', 'Escala atualizada!');
      } else {
        await supabase.from('escalas').insert([payload]);
        onNotify('success', 'Escala criada!');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ title: '', date: '', ministry_name: '', volunteers: '' });
      fetchScales();
    } catch (err) {
      onNotify('error', 'Erro ao salvar escala.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta escala?")) return;
    await supabase.from('escalas').delete().eq('id', id);
    onNotify('success', 'Escala removida.');
    fetchScales();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Escalas</h2>
          <p className="text-slate-400">Organização de voluntários para os cultos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg">
          <Plus size={18} /> Nova Escala
        </button>
      </div>

      {loading ? <Spinner /> : scales.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
           <ListChecks className="w-12 h-12 text-slate-600 mx-auto mb-3" />
           <p className="text-slate-400">Nenhuma escala criada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scales.map(scale => (
            <div key={scale.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl hover:border-amber-500/30 flex flex-col md:flex-row items-start md:items-center gap-6 group relative">
               <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {setEditingId(scale.id); setFormData(scale as any); setIsModalOpen(true)}} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Pencil size={16}/></button>
                  <button onClick={() => handleDelete(scale.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={16}/></button>
               </div>
               
               <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-lg p-3 min-w-[80px]">
                  <span className="text-xl font-bold text-white">{new Date(scale.date).getDate()}</span>
                  <span className="text-xs text-slate-500 uppercase">{new Date(scale.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
               </div>

               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                     <h3 className="font-bold text-white text-lg">{scale.title}</h3>
                     <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">{scale.ministry_name}</span>
                  </div>
                  <div className="flex items-start gap-2 mt-2 text-sm text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                     <User size={14} className="mt-0.5 text-slate-500"/>
                     <p className="whitespace-pre-wrap">{scale.volunteers}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Escala" : "Nova Escala"}>
        <form onSubmit={handleSave} className="space-y-4">
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Título do Evento</label>
              <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Culto da Família" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Data</label>
                 <input type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                 <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Departamento</label>
                 <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Louvor" value={formData.ministry_name} onChange={e => setFormData({...formData, ministry_name: e.target.value})} />
              </div>
           </div>
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Voluntários (Lista)</label>
              <textarea required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-32" placeholder="Ex: Bateria: João&#10;Baixo: Pedro" value={formData.volunteers} onChange={e => setFormData({...formData, volunteers: e.target.value})} />
           </div>
           <div className="flex justify-end gap-3 pt-2">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
             <button type="submit" className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg">Salvar</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
