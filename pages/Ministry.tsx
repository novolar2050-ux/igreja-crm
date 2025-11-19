import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Ministry as MinistryType, UserProfile, Member } from '../types';
import { BookOpen, Plus, Users, ExternalLink, Crown, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface MinistryWithLeader extends MinistryType {
  membros?: {
    full_name: string;
  } | null;
}

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Ministry: React.FC<Props> = ({ onNotify }) => {
  const [ministries, setMinistries] = useState<MinistryWithLeader[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    leader_id: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: minData, error } = await supabase
        .from('ministerios')
        .select('*, membros(full_name)')
        .order('name');
      
      if (error) throw error;
      setMinistries(minData as MinistryWithLeader[] || []);

      const { data: memData } = await supabase
        .from('membros')
        .select('id, full_name')
        .eq('status', 'Active')
        .order('full_name');
        
      setMembers(memData || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      onNotify('error', 'Falha ao carregar ministérios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    setSubmitting(true);
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        leader_id: formData.leader_id || null,
        igreja_id: profile.igreja_id
      };

      if (editingId) {
        const { error } = await supabase.from('ministerios').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Ministério atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('ministerios').insert([payload]);
        if (error) throw error;
        onNotify('success', 'Ministério criado com sucesso!');
      }

      closeModal();
      fetchData();
    } catch (err: any) {
      console.error(err);
      onNotify('error', 'Erro ao salvar ministério.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este ministério?')) return;
    try {
      const { error } = await supabase.from('ministerios').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Ministério removido.');
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Erro ao excluir.');
    }
  };

  const openEditModal = (min: MinistryWithLeader) => {
    setEditingId(min.id);
    setFormData({
      name: min.name,
      description: min.description || '',
      leader_id: min.leader_id || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', leader_id: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Ministérios</h2>
          <p className="text-slate-400 text-sm">Departamentos e grupos de serviço.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium text-sm">
          <Plus size={18} /> Novo Ministério
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="text-purple-500" /></div>
      ) : ministries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl text-center">
           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
             <BookOpen className="text-slate-600" size={32} />
           </div>
           <h3 className="text-white font-medium text-lg">Nenhum ministério cadastrado</h3>
           <p className="text-slate-500 max-w-sm mt-1">Comece criando áreas de serviço para organizar os voluntários da igreja.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministries.map(min => (
            <div key={min.id} className="group relative bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl hover:border-purple-500/30 hover:bg-slate-800/60 transition-all backdrop-blur-sm flex flex-col h-full">
              
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(min)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(min.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                   <BookOpen size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white leading-tight">{min.name}</h3>
                   <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Departamento</span>
                </div>
              </div>
              
              <p className="text-slate-400 text-sm mb-6 line-clamp-3 flex-1">
                {min.description || 'Nenhuma descrição fornecida para este ministério.'}
              </p>
              
              <div className="pt-4 border-t border-slate-800/60 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Crown size={14} className="text-purple-400" /> Líder
                  </span>
                  <span className={`font-medium ${min.membros ? 'text-white' : 'text-slate-500 italic'}`}>
                    {min.membros ? min.membros.full_name : 'Não definido'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 flex items-center gap-2">
                    <Users size={14} className="text-slate-400" /> Membros
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">0 ativos</span>
                </div>
              </div>

              <button className="mt-5 w-full py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-purple-500/50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                Gerenciar Equipe <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Ministério" : "Novo Ministério"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome</label>
            <input required placeholder="Ex: Louvor, Infantil, Recepção" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Líder Responsável</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none appearance-none transition-all"
                value={formData.leader_id}
                onChange={e => setFormData({...formData, leader_id: e.target.value})}
              >
                <option value="">Selecione um líder...</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                <Users size={16} />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Apenas membros com status "Ativo" são listados.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Descrição</label>
            <textarea placeholder="Objetivos e responsabilidades..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white h-32 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
             <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancelar</button>
             <button type="submit" disabled={submitting} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2">
               {submitting && <Spinner className="w-4 h-4" />} {editingId ? 'Atualizar' : 'Criar'}
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};