
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { PrayerRequest, UserProfile } from '../types';
import { Heart, Plus, CheckCircle2, Lock, Globe, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Prayer: React.FC<Props> = ({ onNotify }) => {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({ requester_name: '', request: '', is_public: false });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
    });
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('pedidos_oracao').select('*').order('created_at', { ascending: false });
    if (error) onNotify('error', 'Erro ao carregar pedidos.');
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    try {
      await supabase.from('pedidos_oracao').insert([{ ...formData, igreja_id: profile.igreja_id, status: 'Pending' }]);
      onNotify('success', 'Pedido registrado!');
      setIsModalOpen(false);
      setFormData({ requester_name: '', request: '', is_public: false });
      fetchRequests();
    } catch (err) {
      onNotify('error', 'Erro ao salvar.');
    }
  };

  const toggleStatus = async (req: PrayerRequest) => {
    const newStatus = req.status === 'Pending' ? 'Prayed' : 'Pending';
    await supabase.from('pedidos_oracao').update({ status: newStatus }).eq('id', req.id);
    fetchRequests();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este pedido?")) return;
    await supabase.from('pedidos_oracao').delete().eq('id', id);
    fetchRequests();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Mural de Oração</h2>
          <p className="text-slate-400">Intercessão pelos membros e causas.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg">
          <Plus size={18} /> Novo Pedido
        </button>
      </div>

      {loading ? <Spinner /> : requests.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
           <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
           <p className="text-slate-400">Nenhum pedido de oração ativo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map(req => (
            <div key={req.id} className={`bg-slate-900/50 border p-5 rounded-xl transition-all relative group ${req.status === 'Prayed' ? 'border-emerald-500/30 bg-emerald-900/10 opacity-75' : 'border-slate-800 hover:border-pink-500/30'}`}>
              <div className="absolute top-4 right-4 flex gap-2">
                 <button onClick={() => toggleStatus(req)} className={`p-1.5 rounded-lg transition-colors ${req.status === 'Prayed' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-emerald-400'}`}>
                    <CheckCircle2 size={16} />
                 </button>
                 <button onClick={() => handleDelete(req.id)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                 </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                 {req.is_public ? <Globe size={14} className="text-blue-400"/> : <Lock size={14} className="text-amber-400"/>}
                 <span className="text-xs text-slate-500 uppercase font-bold">{req.is_public ? 'Público' : 'Confidencial'}</span>
              </div>
              
              <h3 className="font-bold text-white text-lg mb-2">{req.requester_name}</h3>
              <p className="text-slate-300 italic">"{req.request}"</p>
              <p className="text-xs text-slate-600 mt-4">{new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Pedido de Oração">
        <form onSubmit={handleSave} className="space-y-4">
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Nome (Quem pede)</label>
              <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Irmã Maria" value={formData.requester_name} onChange={e => setFormData({...formData, requester_name: e.target.value})} />
           </div>
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Pedido</label>
              <textarea required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-32" placeholder="Descreva a causa..." value={formData.request} onChange={e => setFormData({...formData, request: e.target.value})} />
           </div>
           <div className="flex items-center gap-2">
              <input type="checkbox" id="isPublic" className="w-4 h-4 rounded bg-slate-950 border-slate-800" checked={formData.is_public} onChange={e => setFormData({...formData, is_public: e.target.checked})} />
              <label htmlFor="isPublic" className="text-sm text-slate-300">Este pedido pode ser divulgado publicamente?</label>
           </div>
           <div className="flex justify-end gap-3 pt-2">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
             <button type="submit" className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg">Salvar</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
