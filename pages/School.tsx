
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { EbdClass, UserProfile } from '../types';
import { GraduationCap, Plus, Users, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const School: React.FC<Props> = ({ onNotify }) => {
  const [classes, setClasses] = useState<EbdClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', teacher_name: '', topic: '', students_count: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('ebd_classes').select('*').order('name');
    if (error) onNotify('error', 'Erro ao carregar turmas.');
    setClasses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    
    try {
      const payload = { ...formData, igreja_id: profile.igreja_id };
      if (editingId) {
        await supabase.from('ebd_classes').update(payload).eq('id', editingId);
        onNotify('success', 'Turma atualizada!');
      } else {
        await supabase.from('ebd_classes').insert([payload]);
        onNotify('success', 'Turma criada!');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', teacher_name: '', topic: '', students_count: 0 });
      fetchClasses();
    } catch (err) {
      onNotify('error', 'Erro ao salvar turma.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta turma?")) return;
    await supabase.from('ebd_classes').delete().eq('id', id);
    onNotify('success', 'Turma excluída.');
    fetchClasses();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">EBD & Ensino</h2>
          <p className="text-slate-400">Gestão de Escola Bíblica e Cursos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
          <Plus size={18} /> Nova Turma
        </button>
      </div>

      {loading ? <Spinner /> : classes.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
           <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
           <p className="text-slate-400">Nenhuma turma cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(cls => (
            <div key={cls.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:border-indigo-500/30 group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => {setEditingId(cls.id); setFormData(cls as any); setIsModalOpen(true)}} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Pencil size={16}/></button>
                <button onClick={() => handleDelete(cls.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={16}/></button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><BookOpen size={20}/></div>
                <h3 className="font-bold text-white text-lg">{cls.name}</h3>
              </div>
              <div className="space-y-2 text-sm text-slate-400">
                 <p><strong className="text-slate-300">Professor:</strong> {cls.teacher_name || 'Não definido'}</p>
                 <p><strong className="text-slate-300">Tema Atual:</strong> {cls.topic || 'Geral'}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                 <span className="text-xs text-slate-500 flex items-center gap-1"><Users size={12}/> Alunos Matriculados</span>
                 <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{cls.students_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Turma" : "Nova Turma"}>
        <form onSubmit={handleSave} className="space-y-4">
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Nome da Turma</label>
              <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Jovens, Casais" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Professor Responsável</label>
              <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Pb. Carlos" value={formData.teacher_name} onChange={e => setFormData({...formData, teacher_name: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Tema / Revista</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Livro de Romanos" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
             </div>
             <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Qtd. Alunos</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.students_count} onChange={e => setFormData({...formData, students_count: parseInt(e.target.value) || 0})} />
             </div>
           </div>
           <div className="flex justify-end gap-3 pt-2">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
             <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Salvar</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
