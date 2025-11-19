import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ChurchDocument, UserProfile } from '../types';
import { FileText, Award, Plus, Printer, Trash2, Eye, FileSignature, Pencil } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Documents: React.FC<Props> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'minutes' | 'certificates'>('minutes');
  const [documents, setDocuments] = useState<ChurchDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', document_date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const typeMap = activeTab === 'minutes' ? 'minute' : 'certificate';
    const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('type', typeMap)
        .order('document_date', { ascending: false });
        
    if (error) onNotify('error', 'Erro ao carregar documentos.');
    setDocuments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    setSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        type: activeTab === 'minutes' ? 'minute' : 'certificate',
        igreja_id: profile.igreja_id
      };

      if (editingId) {
        const { error } = await supabase.from('documentos').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Documento atualizado!');
      } else {
        const { error } = await supabase.from('documentos').insert([payload]);
        if (error) throw error;
        onNotify('success', 'Documento salvo!');
      }
      
      closeModal();
      fetchDocs();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Erro ao salvar documento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      const { error } = await supabase.from('documentos').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Documento excluído.');
      fetchDocs();
    } catch (error) {
      onNotify('error', 'Erro ao excluir.');
    }
  };

  const openEditModal = (doc: ChurchDocument) => {
    setEditingId(doc.id);
    setFormData({
      title: doc.title,
      content: doc.content,
      document_date: doc.document_date
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', content: '', document_date: new Date().toISOString().split('T')[0] });
  };

  const handlePrint = (doc: ChurchDocument) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${doc.title}</title>
            <style>
              body { font-family: 'Georgia', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { text-align: center; margin-bottom: 10px; }
              .date { text-align: center; color: #666; margin-bottom: 40px; }
              .content { line-height: 1.6; white-space: pre-wrap; }
              .footer { margin-top: 60px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; }
              ${activeTab === 'certificates' ? `
                .cert-border { border: 10px double #444; padding: 40px; text-align: center; }
                h1 { font-size: 40px; font-family: 'Helvetica', sans-serif; text-transform: uppercase; }
                .recipient { font-size: 30px; font-weight: bold; margin: 20px 0; border-bottom: 1px solid #000; display: inline-block; padding: 0 20px;}
              ` : ''}
            </style>
          </head>
          <body>
            ${activeTab === 'certificates' ? '<div class="cert-border">' : ''}
            <h1>${doc.title}</h1>
            <p class="date">${new Date(doc.document_date).toLocaleDateString('pt-BR')}</p>
            <div class="content">${doc.content}</div>
            
            <div class="footer">
              <p>______________________________</p>
              <p>Assinatura do Responsável</p>
            </div>
            ${activeTab === 'certificates' ? '</div>' : ''}
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Documentos</h2>
          <p className="text-slate-400">Atas de reunião e emissão de certificados.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
          <Plus size={18} /> Novo Documento
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('minutes')} 
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'minutes' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <FileText size={16} /> Atas de Reunião
        </button>
        <button 
          onClick={() => setActiveTab('certificates')} 
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'certificates' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Award size={16} /> Certificados
        </button>
      </div>

      {loading ? <Spinner /> : documents.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
           <FileSignature className="w-12 h-12 text-slate-600 mx-auto mb-3" />
           <p className="text-slate-400">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(doc => (
            <div key={doc.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:border-indigo-500/30 transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                 <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                   {activeTab === 'minutes' ? <FileText size={24} className="text-slate-400" /> : <Award size={24} className="text-amber-400" />}
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => openEditModal(doc)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100">
                      <Pencil size={16} />
                    </button>
                    <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-center">
                        {new Date(doc.document_date).toLocaleDateString('pt-BR')}
                    </span>
                 </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 truncate">{doc.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">{doc.content}</p>
              
              <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                <button onClick={() => handlePrint(doc)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs transition-colors">
                   <Printer size={14} /> Imprimir
                </button>
                <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                   <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? (activeTab === 'minutes' ? "Editar Ata" : "Editar Certificado") : (activeTab === 'minutes' ? "Nova Ata" : "Novo Certificado")}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Título</label>
            <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" placeholder={activeTab === 'minutes' ? "Reunião de Obreiros" : "Certificado de Batismo - João Silva"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data</label>
            <input type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={formData.document_date} onChange={e => setFormData({...formData, document_date: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Conteúdo</label>
            <textarea required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-64" placeholder={activeTab === 'minutes' ? "Descreva os pontos discutidos..." : "Texto do certificado (ex: Certificamos que...)"} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2">
              {submitting && <Spinner className="w-4 h-4" />} {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};