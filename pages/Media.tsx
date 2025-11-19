
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { MediaItem, UserProfile } from '../types';
import { Image, PlayCircle, File, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Media: React.FC<Props> = ({ onNotify }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'Photo' | 'Video' | 'File'>('Photo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', url: '', category: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
    });
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    const { data } = await supabase.from('midias').select('*').eq('type', activeTab).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMedia(); }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    try {
      await supabase.from('midias').insert([{ ...formData, type: activeTab, igreja_id: profile.igreja_id }]);
      onNotify('success', 'Arquivo salvo!');
      setIsModalOpen(false);
      setFormData({ title: '', url: '', category: '' });
      fetchMedia();
    } catch (err) {
      onNotify('error', 'Erro ao salvar.');
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Excluir este item?")) return;
    await supabase.from('midias').delete().eq('id', id);
    fetchMedia();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Mídia & Arquivos</h2>
          <p className="text-slate-400">Galeria de fotos, vídeos e documentos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
          <Plus size={18} /> Adicionar
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-800">
        <button onClick={() => setActiveTab('Photo')} className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'Photo' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}><Image size={16}/> Fotos</button>
        <button onClick={() => setActiveTab('Video')} className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'Video' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}><PlayCircle size={16}/> Vídeos</button>
        <button onClick={() => setActiveTab('File')} className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'File' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}><File size={16}/> Documentos</button>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed text-slate-500">
           Nenhum item encontrado nesta categoria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(item => (
             <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden group relative">
                <div className="aspect-video bg-slate-950 flex items-center justify-center relative">
                   {activeTab === 'Photo' ? (
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" onError={(e: any) => {e.target.src='https://via.placeholder.com/300?text=Erro+Imagem'}} />
                   ) : activeTab === 'Video' ? (
                      <PlayCircle size={48} className="text-slate-600" />
                   ) : (
                      <File size={48} className="text-slate-600" />
                   )}
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <a href={item.url} target="_blank" rel="noreferrer" className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white"><ExternalLink size={20}/></a>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/20 hover:bg-red-500/50 rounded-full text-red-400"><Trash2 size={20}/></button>
                   </div>
                </div>
                <div className="p-4">
                   <h3 className="font-bold text-white truncate">{item.title}</h3>
                   {item.category && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{item.category}</span>}
                </div>
             </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adicionar ${activeTab === 'Photo' ? 'Foto' : activeTab === 'Video' ? 'Vídeo' : 'Documento'}`}>
         <form onSubmit={handleSave} className="space-y-4">
            <div>
               <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Título</label>
               <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
               <label className="block text-xs text-slate-400 uppercase font-bold mb-1">URL / Link</label>
               <input required placeholder="https://..." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
               <p className="text-[10px] text-slate-500 mt-1">Cole o link do Google Drive, YouTube ou URL da imagem.</p>
            </div>
            <div>
               <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Categoria / Álbum</label>
               <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder="Ex: Culto Domingo, Retiro" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Salvar</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};
