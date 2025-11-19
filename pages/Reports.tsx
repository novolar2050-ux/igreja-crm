
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Member, Transaction, Asset, UserProfile } from '../types';
import { FileText, Printer, Download, Users, DollarSign, Box, Calendar } from 'lucide-react';
import { Spinner } from '../components/Spinner';

export const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
    });
  }, []);

  const generatePDF = (title: string, content: string) => {
    const printWindow = window.open('', '', 'width=900,height=800');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .meta { text-align: center; margin-bottom: 40px; color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; }
            th { background-color: #f4f4f4; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            .total-row { font-weight: bold; background-color: #fafafa; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="meta">Gerado em ${new Date().toLocaleDateString('pt-BR')} por Ecclesia CRM</p>
          ${content}
          <div class="footer">Documento interno da igreja. Uso exclusivo administrativo.</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleMembersReport = async () => {
    setLoading(true);
    if (!profile?.igreja_id) return;
    const { data } = await supabase.from('membros').select('*').eq('igreja_id', profile.igreja_id).order('full_name');
    setLoading(false);
    
    if (!data) return;
    
    const rows = data.map(m => `
      <tr>
        <td>${m.full_name}</td>
        <td>${m.role_type}</td>
        <td>${m.status}</td>
        <td>${m.phone || '-'}</td>
        <td>${m.email || '-'}</td>
      </tr>
    `).join('');

    generatePDF('Relatório Geral de Membros', `
      <table>
        <thead><tr><th>Nome</th><th>Função</th><th>Status</th><th>Telefone</th><th>Email</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p><strong>Total de Registros:</strong> ${data.length}</p>
    `);
  };

  const handleFinanceReport = async () => {
    setLoading(true);
    if (!profile?.igreja_id) return;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data } = await supabase.from('transacoes').select('*').eq('igreja_id', profile.igreja_id).gte('date', startOfMonth).order('date');
    setLoading(false);
    
    if (!data) return;
    
    const totalIn = data.filter(t => t.type === 'income').reduce((a,b) => a + b.amount, 0);
    const totalOut = data.filter(t => t.type === 'expense').reduce((a,b) => a + b.amount, 0);
    
    const rows = data.map(t => `
      <tr>
        <td>${new Date(t.date).toLocaleDateString('pt-BR')}</td>
        <td>${t.description}</td>
        <td>${t.category}</td>
        <td style="color: ${t.type === 'income' ? 'green' : 'red'}">${t.type === 'income' ? '+' : '-'} R$ ${t.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    generatePDF('Relatório Financeiro (Mês Atual)', `
      <table>
        <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="total-row"><td colspan="3">Total Entradas</td><td>R$ ${totalIn.toFixed(2)}</td></tr>
          <tr class="total-row"><td colspan="3">Total Saídas</td><td>R$ ${totalOut.toFixed(2)}</td></tr>
          <tr class="total-row"><td colspan="3">Saldo do Período</td><td>R$ ${(totalIn - totalOut).toFixed(2)}</td></tr>
        </tfoot>
      </table>
    `);
  };

  const handleAssetsReport = async () => {
    setLoading(true);
    if (!profile?.igreja_id) return;
    const { data } = await supabase.from('patrimonio').select('*').eq('igreja_id', profile.igreja_id).order('name');
    setLoading(false);
    
    if (!data) return;
    
    const totalVal = data.reduce((a,b) => a + (b.value || 0), 0);
    
    const rows = data.map(a => `
      <tr>
        <td>${a.name}</td>
        <td>${a.location || '-'}</td>
        <td>${a.condition}</td>
        <td>R$ ${(a.value || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    generatePDF('Inventário Patrimonial', `
      <table>
        <thead><tr><th>Item</th><th>Local</th><th>Condição</th><th>Valor Est.</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="total-row"><td colspan="3">Valor Total Estimado</td><td>R$ ${totalVal.toFixed(2)}</td></tr>
        </tfoot>
      </table>
    `);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div>
          <h2 className="text-3xl font-bold text-white mb-1">Central de Relatórios</h2>
          <p className="text-slate-400 text-sm">Gere documentos oficiais para administração da igreja.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <ReportCard 
             title="Membros & Obreiros" 
             desc="Lista completa com contatos e status." 
             icon={Users} 
             onClick={handleMembersReport} 
             loading={loading} 
           />
           <ReportCard 
             title="Balanço Financeiro" 
             desc="Movimentações do mês corrente." 
             icon={DollarSign} 
             onClick={handleFinanceReport} 
             loading={loading} 
           />
           <ReportCard 
             title="Patrimônio" 
             desc="Inventário de bens e equipamentos." 
             icon={Box} 
             onClick={handleAssetsReport} 
             loading={loading} 
           />
        </div>
    </div>
  );
};

const ReportCard = ({ title, desc, icon: Icon, onClick, loading }: any) => (
  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all group cursor-pointer" onClick={!loading ? onClick : undefined}>
     <div className="w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 mb-4 group-hover:scale-110 transition-transform">
       <Icon className="text-indigo-400" size={24} />
     </div>
     <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
     <p className="text-sm text-slate-400 mb-4">{desc}</p>
     <button disabled={loading} className="w-full py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all">
       {loading ? <Spinner className="w-4 h-4"/> : <><Printer size={16} /> Gerar PDF</>}
     </button>
  </div>
);
