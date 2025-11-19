
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { DiscipleshipGroup, UserProfile } from '../types';
import { HeartHandshake, Plus, MapPin, Pencil, Trash2, FileCheck } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Discipleship: React.FC<Props> = ({ onNotify }) => {
  const [groups, setGroups] = useState<DiscipleshipGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [formData, setFormData] = useState({ name: '', description: '', leader_name: '', meeting_day: 'Quarta-feira' });
  const [reportData, setReportData] = useState({ date: new Date().toISOString().split('T')[0], topic: '', attendance_count: 0, observations: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('discipulados').select('*').order('name');
    if (error) onNotify('error', 'Erro ao carregar grupos.');
    setGroups(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    
    const payload = { ...formData, igreja_id: profile.igreja_id };

    try {
      if (editingId) {
        const { error } = await supabase.from('discipulados').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Grupo atualizado!');
      } else {
        const { error } = await supabase.from('discipulados').insert([payload]);
        if (error) throw error;
        onNotify('success', 'Grupo criado com sucesso!');
      }
      
      closeModal();
      fetchGroups();
    } catch (error: any) {
      onNotify('error', 'Erro ao salvar grupo.');
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id || !selectedGroupId) return;
    try {
       await supabase.from('reunioes_grupo').insert([{
          igreja_id: profile.igreja_id,
          group_id: selectedGroupId,
          ...reportData
       }]);
       onNotify('success', 'Relatório enviado!');
       setIsReportModalOpen(false);
       setReportData({ date: new Date().toISOString().split('T')[0], topic: '', attendance_count: 0, observations: '' });
    } catch (error) {
       onNotify('error', 'Erro ao enviar relatório.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja excluir este grupo?")) return;
    try {
      const { error } = await supabase.from('discipulados').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Grupo excluído.');
      fetchGroups();
    } catch (error) {
      onNotify('error', 'Falha ao excluir.');
    }
  };

  const openEditModal = (g: DiscipleshipGroup) => {
    setEditingId(g.id);
    setFormData({
      name: g.name,
      description: g.description || '',
      leader_name: g.leader_name || '',
      meeting_day: g.meeting_day || 'Quarta-feira'
    });
    setIsModalOpen(true);
  };

  const openReportModal = (g: DiscipleshipGroup) => {
    setSelectedGroupId(g.id);
    setIsReportModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', leader_name: '', meeting_day: 'Quarta-feira' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Discipulado</h2>
          <p className="text-slate-400">Pequenos grupos e células</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20">
          <Plus size={18} /> Novo Grupo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <Spinner /> : groups.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">Nenhum grupo cadastrado.</div>
        ) : groups.map(group => (
          <div key={group.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:border-emerald-500/30 transition-colors relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => openEditModal(group)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><Pencil size={16} /></button>
               <button onClick={() => handleDelete(group.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><HeartHandshake size={20} /></div>
              <h3 className="text-lg font-bold text-white">{group.name}</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-400 mb-6">
              <p><strong className="text-slate-300">Líder:</strong> {group.leader_name || 'Não atribuído'}</p>
              <p><strong className="text-slate-300">Encontro:</strong> {group.meeting_day}</p>
              <p className="italic opacity-70 mt-3 line-clamp-3">{group.description}</p>
            </div>

            <button onClick={() => openReportModal(group)} className="w-full py-2 bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
              <FileCheck size={16} /> Enviar Relatório
            </button>
          </div>
        ))}
      </div>

      {/* EDIT/CREATE MODAL */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Grupo" : "Novo Grupo"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Nome do Grupo</label>
            <input required placeholder="Ex: Célula Jovem" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          
          <div>
            <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Nome do Líder</label>
            <input placeholder="Ex: João Silva" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.leader_name} onChange={e => setFormData({...formData, leader_name: e.target.value})} />
          </div>
          
          <div>
            <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Dia de Encontro</label>
            <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.meeting_day} onChange={e => setFormData({...formData, meeting_day: e.target.value})}>
               {['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Descrição</label>
            <textarea placeholder="Breve descrição do grupo..." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">{editingId ? 'Salvar Alterações' : 'Criar Grupo'}</button>
          </div>
        </form>
      </Modal>

      {/* REPORT MODAL */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Relatório de Reunião">
         <form onSubmit={handleSaveReport} className="space-y-4">
            <div className="bg-slate-800/50 p-3 rounded-lg mb-4 border border-slate-700 text-sm text-slate-300">
              Preencha os dados do último encontro realizado.
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Data da Reunião</label>
              <input type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={reportData.date} onChange={e => setReportData({...reportData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Tema / Estudo</label>
              <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: A Fé de Abraão" value={reportData.topic} onChange={e => setReportData({...reportData, topic: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Nº Presentes</label>
              <input type="number" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={reportData.attendance_count} onChange={e => setReportData({...reportData, attendance_count: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Observações / Testemunhos</label>
              <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-24 resize-none" value={reportData.observations} onChange={e => setReportData({...reportData, observations: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 mt-4">
               <button type="button" onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
               <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Enviar Relatório</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};
