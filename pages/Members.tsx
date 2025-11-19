
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Member, UserProfile, Church } from '../types';
import { Search, Plus, Filter, User, Phone, Mail, AlertTriangle, LayoutGrid, List as ListIcon, MoreHorizontal, Pencil, Trash2, ArrowUpAZ, ArrowDownZA, MapPin, Droplets, Download, CreditCard } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';

export const Members: React.FC<{ onNotify: any }> = ({ onNotify }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbError, setDbError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMemberForCredential, setSelectedMemberForCredential] = useState<Member | null>(null);

  // Filters State
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    baptism_date: '',
    role_type: 'Member',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        if (prof?.igreja_id) {
          const { data: ch } = await supabase.from('igrejas').select('*').eq('id', prof.igreja_id).single();
          setChurch(ch);
        }
      }
    };
    fetchProfile();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membros')
        .select('*');

      if (error) {
        if (error.code === '42P01') setDbError(true);
        throw error;
      }
      setMembers(data || []);
      setDbError(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) {
      onNotify('error', 'Você deve estar vinculado a uma igreja para gerenciar membros.');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        birth_date: formData.birth_date || null,
        baptism_date: formData.baptism_date || null,
        igreja_id: profile.igreja_id
      };

      if (editingId) {
        const { error } = await supabase.from('membros').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Membro atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('membros').insert([payload]);
        if (error) throw error;
        onNotify('success', 'Membro adicionado com sucesso!');
      }
      
      closeModal();
      fetchMembers();
    } catch (error: any) {
      const msg = error?.message || 'Erro ao salvar membro';
      onNotify('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este membro?")) return;
    try {
      const { error } = await supabase.from('membros').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Membro removido.');
      fetchMembers();
    } catch (error: any) {
      onNotify('error', 'Erro ao excluir membro.');
    }
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Email", "Telefone", "Função", "Status", "Data Nasc.", "Batismo", "Endereço"];
    const rows = members.map(m => [
      `"${m.full_name}"`,
      m.email || '',
      m.phone || '',
      m.role_type,
      m.status,
      m.birth_date ? new Date(m.birth_date).toLocaleDateString('pt-BR') : '',
      m.baptism_date ? new Date(m.baptism_date).toLocaleDateString('pt-BR') : '',
      `"${m.address || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "membros_ecclesia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('info', 'Lista de membros exportada.');
  };

  const openEditModal = (member: Member) => {
    setEditingId(member.id);
    setFormData({
      full_name: member.full_name,
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      birth_date: member.birth_date || '',
      baptism_date: member.baptism_date || '',
      role_type: member.role_type,
      status: member.status
    });
    setIsModalOpen(true);
  };

  const openCredentialModal = (member: Member) => {
    setSelectedMemberForCredential(member);
    setIsCredentialModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ full_name: '', email: '', phone: '', address: '', birth_date: '', baptism_date: '', role_type: 'Member', status: 'Active' });
  };

  // Filtering Logic
  const filteredMembers = members
    .filter(m => {
      const matchesSearch = m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || m.role_type === roleFilter;
      const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.full_name.localeCompare(b.full_name);
      else return b.full_name.localeCompare(a.full_name);
    });

  const translateRole = (role: string) => {
    const map: any = { 'Member': 'Membro', 'Leader': 'Líder', 'Pastor': 'Pastor', 'Visitor': 'Visitante' };
    return map[role] || role;
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      status === 'Active' 
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
        : 'bg-slate-700/50 text-slate-400 border-slate-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Active' ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
      {status === 'Active' ? 'Ativo' : 'Inativo'}
    </span>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Membros</h2>
          <p className="text-slate-400 text-sm">Gerencie a comunidade da sua igreja</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all font-medium text-sm"
          >
            <Download size={18} /> Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium text-sm"
          >
            <Plus size={18} /> Adicionar
          </button>
        </div>
      </div>

      {dbError && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-200">
          <AlertTriangle className="shrink-0" />
          <p className="text-sm">Tabela "membros" não encontrada. Por favor, execute a configuração SQL.</p>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 backdrop-blur-sm">
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white w-full focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2">
             <span className="text-xs text-slate-500 uppercase font-bold hidden sm:inline">Função:</span>
             <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
               <option value="All">Todas</option>
               <option value="Member">Membro</option>
               <option value="Leader">Líder</option>
               <option value="Pastor">Pastor</option>
               <option value="Visitor">Visitante</option>
             </select>
          </div>

          <div className="flex items-center gap-2">
             <span className="text-xs text-slate-500 uppercase font-bold hidden sm:inline">Status:</span>
             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
               <option value="All">Todos</option>
               <option value="Active">Ativo</option>
               <option value="Inactive">Inativo</option>
             </select>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm min-w-[120px] justify-center">
            {sortOrder === 'asc' ? <ArrowUpAZ size={16} /> : <ArrowDownZA size={16} />}
            {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}
          </button>

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 ml-auto sm:ml-0">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><ListIcon size={18} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-indigo-500" /></div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div key={member.id} className="bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/30 hover:bg-slate-800/50 rounded-2xl p-5 transition-all duration-300 group flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-white font-bold text-lg">
                        {member.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Gerar Credencial" onClick={() => openCredentialModal(member)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded"><CreditCard size={16} /></button>
                        <button title="Editar" onClick={() => openEditModal(member)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded"><Pencil size={16} /></button>
                        <button title="Excluir" onClick={() => handleDelete(member.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">{member.full_name}</h3>
                      <p className="text-sm text-indigo-400">{translateRole(member.role_type)}</p>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-400 flex-1">
                      {member.email && <div className="flex items-center gap-2.5 truncate"><Mail size={14} className="shrink-0 text-slate-500" /><span className="truncate">{member.email}</span></div>}
                      {member.phone && <div className="flex items-center gap-2.5"><Phone size={14} className="shrink-0 text-slate-500" /><span>{member.phone}</span></div>}
                      {member.address && <div className="flex items-center gap-2.5"><MapPin size={14} className="shrink-0 text-slate-500" /><span className="truncate">{member.address}</span></div>}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/60 flex justify-between items-center">
                      <StatusBadge status={member.status} />
                      {member.baptism_date && <span className="text-xs text-slate-500 flex items-center gap-1"><Droplets size={10} /> Batizado</span>}
                    </div>
                  </div>
                ))
              ) : <EmptyState />}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
                      <th className="p-4 font-medium pl-6">Membro</th>
                      <th className="p-4 font-medium">Contato</th>
                      <th className="p-4 font-medium">Dados Eclesiásticos</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right pr-6">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                              {member.full_name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">{member.full_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">
                          <div className="flex flex-col gap-0.5">
                             <span>{member.email || '-'}</span>
                             <span className="text-xs opacity-60">{member.phone}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">
                          <div className="flex flex-col gap-0.5 text-xs">
                             <span>{translateRole(member.role_type)}</span>
                             {member.baptism_date && <span className="text-slate-500">Batismo: {new Date(member.baptism_date).toLocaleDateString('pt-BR')}</span>}
                          </div>
                        </td>
                        <td className="p-4"><StatusBadge status={member.status} /></td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button title="Credencial" onClick={() => openCredentialModal(member)} className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"><CreditCard size={16} /></button>
                            <button onClick={() => openEditModal(member)} className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors"><Pencil size={16} /></button>
                            <button onClick={() => handleDelete(member.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : <tr><td colSpan={5} className="p-8 text-center"><EmptyState /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* EDIT MEMBER MODAL */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Membro" : "Novo Membro"}>
        <form onSubmit={handleSaveMember} className="space-y-5">
          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
             <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: Maria da Silva" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">E-mail</label>
               <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Telefone</label>
               <input type="tel" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Endereço</label>
             <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Rua, Número, Bairro" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data Nascimento</label>
               <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data Batismo</label>
               <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.baptism_date} onChange={e => setFormData({...formData, baptism_date: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Função</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.role_type} onChange={e => setFormData({...formData, role_type: e.target.value as any})}>
                  <option value="Member">Membro</option>
                  <option value="Leader">Líder</option>
                  <option value="Pastor">Pastor</option>
                  <option value="Visitor">Visitante</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value="Active">Ativo</option>
                  <option value="Inactive">Inativo</option>
                </select>
             </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium">Cancelar</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg shadow-indigo-500/20">
              {submitting && <Spinner className="w-4 h-4" />} {editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREDENTIAL MODAL (Carteirinha) */}
      <Modal isOpen={isCredentialModalOpen} onClose={() => setIsCredentialModalOpen(false)} title="Credencial de Membro">
         <div className="flex flex-col items-center justify-center gap-6 pb-4">
            {selectedMemberForCredential && (
              <div id="credential-card" className="relative w-[320px] h-[500px] bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-200 text-slate-900">
                 {/* Background Pattern */}
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-800 z-0"></div>
                 <div className="absolute top-0 left-0 w-full h-32 bg-white/10 z-0"></div>
                 
                 {/* Church Info */}
                 <div className="relative z-10 text-center pt-8 px-4">
                   <h3 className="text-white font-bold text-xl uppercase tracking-wide">{church?.name || 'Igreja'}</h3>
                   <p className="text-blue-200 text-xs font-medium uppercase mt-1 tracking-widest">Membro Eclesiástico</p>
                 </div>

                 {/* Photo PlaceHolder */}
                 <div className="relative z-10 mt-8 mx-auto w-32 h-32 bg-white rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden">
                    <User size={64} className="text-slate-300" />
                 </div>

                 {/* Member Details */}
                 <div className="relative z-10 bg-white mt-8 mx-4 p-6 rounded-lg shadow-lg text-center">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedMemberForCredential.full_name}</h2>
                    <p className="text-indigo-600 font-semibold text-sm uppercase">{translateRole(selectedMemberForCredential.role_type)}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Membro Desde</p>
                        <p className="text-xs font-medium text-slate-700">
                          {new Date(selectedMemberForCredential.created_at).getFullYear()}
                        </p>
                      </div>
                      <div>
                         <p className="text-[10px] text-slate-400 uppercase font-bold">Batismo</p>
                         <p className="text-xs font-medium text-slate-700">
                           {selectedMemberForCredential.baptism_date ? new Date(selectedMemberForCredential.baptism_date).toLocaleDateString('pt-BR') : '-'}
                         </p>
                      </div>
                    </div>
                 </div>
                 
                 {/* Footer */}
                 <div className="absolute bottom-4 w-full text-center z-10">
                    <p className="text-white/50 text-[10px]">ecclesia.app | Válido em todo território nacional</p>
                 </div>
              </div>
            )}
            
            <button 
               onClick={() => window.print()} 
               className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2"
            >
               <Download size={16} /> Imprimir / Salvar PDF
            </button>
            <p className="text-xs text-slate-400 text-center max-w-xs">
               Dica: Na janela de impressão, selecione "Salvar como PDF" e ative "Gráficos de plano de fundo".
            </p>
         </div>
      </Modal>
    </div>
  );
};

const EmptyState = () => (
  <div className="col-span-full flex flex-col items-center justify-center text-center py-16">
    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
      <User className="w-8 h-8 text-slate-600" />
    </div>
    <h3 className="text-slate-300 font-medium text-lg">Nenhum membro encontrado</h3>
    <p className="text-slate-500 text-sm mt-1 max-w-xs">Tente ajustar seus filtros de busca ou adicione um novo membro.</p>
  </div>
);
