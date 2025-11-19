
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Transaction, UserProfile, Member } from '../types';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Tag, Plus, Pencil, Trash2, Download, User } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';

interface FinanceProps {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Finance: React.FC<FinanceProps> = ({ onNotify }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]); // List for selection

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'income' as 'income' | 'expense',
    category: 'Tithes',
    date: new Date().toISOString().split('T')[0],
    member_id: '',
    supplier: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        if(data?.igreja_id) {
           // Fetch Members for Dropdown
           const { data: mems } = await supabase.from('membros').select('id, full_name').eq('igreja_id', data.igreja_id).eq('status', 'Active').order('full_name');
           setMembers(mems || []);
        }
      }
    };
    fetchProfile();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Join with members to get name
      const { data, error } = await supabase
        .from('transacoes')
        .select('*, membros(full_name)')
        .order('date', { ascending: false });

      if (error) throw error;
      
      const mapped = data?.map((t: any) => ({
         ...t,
         member_name: t.membros?.full_name
      })) || [];

      setTransactions(mapped);
    } catch (error: any) {
      console.error(error);
      onNotify('error', 'Erro ao carregar transações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;

    setSubmitting(true);
    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        member_id: formData.type === 'income' && formData.category === 'Tithes' && formData.member_id ? formData.member_id : null,
        supplier: formData.type === 'expense' ? formData.supplier : null,
        igreja_id: profile.igreja_id
      };

      if (editingId) {
        const { error } = await supabase.from('transacoes').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Transação atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('transacoes').insert([payload]);
        if (error) throw error;
        onNotify('success', 'Transação registrada com sucesso!');
      }
      
      closeModal();
      fetchTransactions();
    } catch (error: any) {
      console.error(error);
      onNotify('error', error.message || 'Erro ao salvar transação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta transação?")) return;
    try {
      const { error } = await supabase.from('transacoes').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Transação removida.');
      fetchTransactions();
    } catch (err: any) {
      console.error(err);
      onNotify('error', 'Erro ao excluir.');
    }
  };

  const exportToCSV = () => {
    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Membro/Fornecedor"];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      `"${t.description}"`,
      t.category,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.amount.toFixed(2).replace('.', ','),
      `"${t.member_name || t.supplier || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financeiro_ecclesia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('info', 'Download iniciado.');
  };

  const openEditModal = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormData({
      description: tx.description,
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      date: tx.date,
      member_id: tx.member_id || '',
      supplier: tx.supplier || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ description: '', amount: '', type: 'income', category: 'Tithes', date: new Date().toISOString().split('T')[0], member_id: '', supplier: '' });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalVolume = totalIncome + totalExpense;
  const incomePercent = totalVolume > 0 ? (totalIncome / totalVolume) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Financeiro</h2>
          <p className="text-slate-400 text-sm">Controle dízimos, ofertas e despesas operacionais.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all font-medium text-sm"
          >
            <Download size={18} /> CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 font-medium text-sm"
          >
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingUp size={80} className="text-emerald-500" />
           </div>
           <div className="relative z-10">
              <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Entradas
              </p>
              <p className="text-3xl font-bold text-white tracking-tight">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingDown size={80} className="text-red-500" />
           </div>
           <div className="relative z-10">
              <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Saídas
              </p>
              <p className="text-3xl font-bold text-white tracking-tight">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-slate-400 text-sm font-medium mb-1">Saldo Atual</p>
              <p className={`text-3xl font-bold tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
           </div>
           <div className="mt-6 h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
             <div style={{ width: `${incomePercent}%` }} className="h-full bg-emerald-500"></div>
             <div className="flex-1 h-full bg-red-500"></div>
           </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800/60 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Transações Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center"><Spinner className="text-indigo-500" /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 uppercase tracking-wider text-xs font-semibold">
                  <th className="p-4 pl-6">Descrição</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Origem/Destino</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-right">Valor</th>
                  <th className="p-4 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-slate-500">Nenhuma transação registrada ainda.</td></tr>
                ) : transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {t.type === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                        </div>
                        <span className="font-medium text-slate-200">{t.description}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs border border-slate-700">
                        <Tag size={12} />
                        {t.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                       {t.member_name || t.supplier || '-'}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-xs">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`p-4 text-right font-medium font-mono ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-right pr-6">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(t)} className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Lançamento" : "Adicionar Transação"}>
        <form onSubmit={handleSaveTransaction} className="space-y-5">
          <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-4">
            <div className="flex gap-4">
               <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.type === 'income' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
                 <input type="radio" name="type" className="hidden" checked={formData.type === 'income'} onChange={() => setFormData({...formData, type: 'income', category: 'Tithes', supplier: ''})} />
                 <ArrowUpCircle size={18} /> Receita
               </label>
               <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.type === 'expense' ? 'bg-red-500/10 border-red-500 text-red-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
                 <input type="radio" name="type" className="hidden" checked={formData.type === 'expense'} onChange={() => setFormData({...formData, type: 'expense', category: 'Maintenance', member_id: ''})} />
                 <ArrowDownCircle size={18} /> Despesa
               </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Categoria</label>
              <select 
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {formData.type === 'income' ? (
                   <>
                    <option value="Tithes">Dízimos</option>
                    <option value="Offerings">Ofertas</option>
                    <option value="Donations">Doações</option>
                    <option value="Events">Eventos</option>
                   </>
                ) : (
                   <>
                    <option value="Maintenance">Manutenção</option>
                    <option value="Utilities">Contas (Luz/Água)</option>
                    <option value="Salaries">Salários</option>
                    <option value="Missions">Missões</option>
                    <option value="Ministry">Ministério</option>
                   </>
                )}
              </select>
            </div>
          </div>
          
          {/* CONDITIONAL FIELDS */}
          {formData.type === 'income' && formData.category === 'Tithes' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Membro Dizimista</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" value={formData.member_id} onChange={e => setFormData({...formData, member_id: e.target.value})}>
                 <option value="">Selecione o membro...</option>
                 {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          )}
          
          {formData.type === 'expense' && (
            <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fornecedor / Destino</label>
               <input 
                 className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white"
                 placeholder="Ex: Sabesp, Loja de Som, etc."
                 value={formData.supplier}
                 onChange={e => setFormData({...formData, supplier: e.target.value})}
               />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Descrição</label>
            <input 
              required 
              type="text" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              placeholder="Ex: Dízimo do Culto de Domingo"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data</label>
              <input 
                required 
                type="date" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={closeModal}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-500/20"
            >
              {submitting && <Spinner className="w-4 h-4" />}
              {editingId ? 'Atualizar' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
