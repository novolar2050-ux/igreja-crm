
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Asset, UserProfile } from '../types';
import { Box, Plus, MapPin, DollarSign, Pencil, Trash2, Tag } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Inventory: React.FC<Props> = ({ onNotify }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', value: '', location: '', condition: 'Good' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
    });
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('patrimonio').select('*').order('name');
    if (error) onNotify('error', 'Erro ao carregar patrimônio.');
    setAssets(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    try {
      const payload = { ...formData, value: parseFloat(formData.value) || 0, igreja_id: profile.igreja_id };
      if (editingId) {
        await supabase.from('patrimonio').update(payload).eq('id', editingId);
        onNotify('success', 'Item atualizado!');
      } else {
        await supabase.from('patrimonio').insert([payload]);
        onNotify('success', 'Item adicionado!');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', description: '', value: '', location: '', condition: 'Good' });
      fetchAssets();
    } catch (err) {
      onNotify('error', 'Erro ao salvar item.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este item?")) return;
    await supabase.from('patrimonio').delete().eq('id', id);
    onNotify('success', 'Item removido.');
    fetchAssets();
  };

  const totalValue = assets.reduce((acc, item) => acc + (item.value || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Patrimônio</h2>
          <p className="text-slate-400">Inventário de bens e equipamentos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
          <Plus size={18} /> Novo Item
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl inline-flex items-center gap-4 mb-4">
         <div className="p-2 bg-emerald-500/10 rounded text-emerald-400"><DollarSign size={20}/></div>
         <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Valor Total Estimado</p>
            <p className="text-xl font-bold text-white">R$ {totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
         </div>
      </div>

      {loading ? <Spinner /> : assets.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
           <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
           <p className="text-slate-400">Nenhum item cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map(item => (
            <div key={item.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:border-emerald-500/30 group relative flex flex-col">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => {setEditingId(item.id); setFormData({...item, value: item.value?.toString() || ''} as any); setIsModalOpen(true)}} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Pencil size={16}/></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={16}/></button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-slate-800 rounded-lg text-slate-300"><Tag size={20}/></div>
                 <h3 className="font-bold text-white text-lg">{item.name}</h3>
              </div>
              <div className="space-y-2 text-sm text-slate-400 flex-1">
                 {item.description && <p className="line-clamp-2">{item.description}</p>}
                 {item.location && <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-500"/> {item.location}</p>}
                 <p className="flex items-center gap-2"><DollarSign size={14} className="text-emerald-500"/> R$ {item.value?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800">
                 <span className={`text-xs px-2 py-1 rounded border ${item.condition === 'New' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    Condição: {item.condition === 'New' ? 'Novo' : item.condition === 'Good' ? 'Bom' : 'Ruim'}
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Item" : "Novo Item"}>
        <form onSubmit={handleSave} className="space-y-4">
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Nome do Item</label>
              <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Mesa de Som Yamaha" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Valor Estimado (R$)</label>
                <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
              </div>
              <div>
                 <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Condição</label>
                 <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                   <option value="New">Novo</option>
                   <option value="Good">Bom</option>
                   <option value="Fair">Regular</option>
                   <option value="Poor">Ruim</option>
                 </select>
              </div>
           </div>
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Localização</label>
              <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Salão Principal" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
           </div>
           <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Descrição</label>
              <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
           </div>
           <div className="flex justify-end gap-3 pt-2">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
             <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">Salvar</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
