
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Users, Banknote, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, ExternalLink, ArrowRight, Cake, HeartHandshake, Box, GraduationCap, Heart, Pin, X, AlertCircle } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Spinner } from '../components/Spinner';
import { UserProfile, Member, Notice } from '../types';

const StatCard = ({ title, value, trend, icon: Icon, color, subtitle, loading, link }: any) => (
  <Link to={link || '#'} className="block h-full">
    <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-sm hover:bg-slate-800/40 transition-colors group h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && !loading && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-950 border border-slate-800 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        {loading ? (
          <div className="h-8 w-24 bg-slate-800 rounded animate-pulse mb-1"></div>
        ) : (
          <p className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">{value}</p>
        )}
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  </Link>
);

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    newMembersMonth: 0,
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    upcomingEvents: 0,
    ministryCount: 0,
    inventoryValue: 0,
    prayerCount: 0,
    classCount: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<Member[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [showNoticeForm, setShowNoticeForm] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (!prof) return;
        setProfile(prof);
        const churchId = prof.igreja_id;

        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

        const [
          { count: memberCount },
          { count: newMemberCount },
          { data: transactions },
          { count: eventCount },
          { count: minCount },
          { data: recentTx },
          { data: recentMembers },
          { data: allMembers },
          { data: assets },
          { count: prayerCount },
          { count: classCount },
          { data: activeNotices }
        ] = await Promise.all([
          supabase.from('membros').select('*', { count: 'exact', head: true }).eq('igreja_id', churchId).eq('status', 'Active'),
          supabase.from('membros').select('*', { count: 'exact', head: true }).eq('igreja_id', churchId).gte('created_at', firstDayOfMonth),
          supabase.from('transacoes').select('amount, type, date').eq('igreja_id', churchId).gte('date', startOfYear),
          supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('igreja_id', churchId).gte('start_time', new Date().toISOString()),
          supabase.from('ministerios').select('*', { count: 'exact', head: true }).eq('igreja_id', churchId),
          supabase.from('transacoes').select('id, description, amount, type, created_at').eq('igreja_id', churchId).order('created_at', { ascending: false }).limit(3),
          supabase.from('membros').select('id, full_name, created_at').eq('igreja_id', churchId).order('created_at', { ascending: false }).limit(2),
          supabase.from('membros').select('id, full_name, birth_date, phone').eq('igreja_id', churchId).eq('status', 'Active'),
          supabase.from('patrimonio').select('value').eq('igreja_id', churchId),
          supabase.from('pedidos_oracao').select('*', { count: 'exact', head: true }).eq('igreja_id', churchId).eq('status', 'Pending'),
          supabase.from('ebd_classes').select('*', { count: 'exact', head: true }).eq('igreja_id', churchId),
          supabase.from('avisos').select('*').eq('igreja_id', churchId).order('created_at', {ascending: false})
        ]);

        // Finances
        const txs = transactions || [];
        const totalIncome = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const totalExpense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        
        const totalAssets = (assets || []).reduce((acc, a) => acc + (a.value || 0), 0);

        // Chart Data
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const chartMap = new Array(12).fill(0).map((_, i) => ({ name: months[i], income: 0, expense: 0 }));
        
        txs.forEach((t: any) => {
          const month = new Date(t.date).getMonth();
          if (t.type === 'income') chartMap[month].income += t.amount;
          else chartMap[month].expense += t.amount;
        });

        const currentMonthIdx = today.getMonth();

        const monthBirthdays = (allMembers || []).filter(m => {
          if (!m.birth_date) return false;
          const bdate = new Date(m.birth_date);
          const bMonth = bdate.getUTCMonth(); 
          return bMonth === today.getMonth();
        }).sort((a, b) => new Date(a.birth_date!).getUTCDate() - new Date(b.birth_date!).getUTCDate());

        const activities = [
            ...(recentTx || []).map((t: any) => ({ ...t, kind: 'finance' })),
            ...(recentMembers || []).map((m: any) => ({ ...m, kind: 'member' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

        setStats({
          totalMembers: memberCount || 0,
          newMembersMonth: newMemberCount || 0,
          totalBalance: totalIncome - totalExpense,
          monthlyIncome: chartMap[currentMonthIdx].income,
          monthlyExpense: chartMap[currentMonthIdx].expense,
          upcomingEvents: eventCount || 0,
          ministryCount: minCount || 0,
          inventoryValue: totalAssets,
          prayerCount: prayerCount || 0,
          classCount: classCount || 0
        });

        setChartData(chartMap.slice(0, currentMonthIdx + 1));
        setRecentActivity(activities);
        setBirthdays(monthBirthdays);
        setNotices(activeNotices || []);

      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!profile?.igreja_id || !newNoticeTitle.trim()) return;
    
    const { data, error } = await supabase.from('avisos').insert([
      { igreja_id: profile.igreja_id, title: newNoticeTitle, content: '', priority: 'Normal' }
    ]).select().single();

    if(data) {
      setNotices([data, ...notices]);
      setNewNoticeTitle('');
      setShowNoticeForm(false);
    }
  };

  const handleDeleteNotice = async (id: number) => {
    await supabase.from('avisos').delete().eq('id', id);
    setNotices(notices.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">
            {loading ? <div className="h-8 w-48 bg-slate-800 rounded animate-pulse"></div> : `Olá, ${profile?.full_name?.split(' ')[0] || 'Pastor'}.`}
          </h2>
          <p className="text-slate-400 text-sm">Visão geral do ministério hoje.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/members" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-slate-700">
            <Users size={16} /> Membros
          </Link>
          <Link to="/finance" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
            <Plus size={16} /> Lançamento
          </Link>
        </div>
      </div>

      {/* NOTICE BOARD */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-amber-400 font-bold flex items-center gap-2"><Pin size={18} /> Mural de Avisos</h3>
           <button onClick={() => setShowNoticeForm(!showNoticeForm)} className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded transition-colors">
             {showNoticeForm ? 'Cancelar' : 'Novo Aviso'}
           </button>
         </div>

         {showNoticeForm && (
           <form onSubmit={handleAddNotice} className="flex gap-2 mb-4">
             <input 
               autoFocus
               placeholder="Escreva um aviso rápido..."
               className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
               value={newNoticeTitle}
               onChange={e => setNewNoticeTitle(e.target.value)}
             />
             <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-500">Publicar</button>
           </form>
         )}

         <div className="space-y-2">
           {notices.length === 0 ? (
             <p className="text-sm text-slate-500 italic">Nenhum aviso fixado no momento.</p>
           ) : (
             notices.map(notice => (
               <div key={notice.id} className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800/50 group">
                  <span className="text-sm text-slate-200 font-medium">{notice.title}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{new Date(notice.created_at).toLocaleDateString('pt-BR')}</span>
                    <button onClick={() => handleDeleteNotice(notice.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                  </div>
               </div>
             ))
           )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Membros Ativos" 
          value={stats.totalMembers} 
          trend={stats.newMembersMonth > 0 ? 5 : 0}
          icon={Users} 
          color="bg-indigo-500" 
          subtitle={`+${stats.newMembersMonth} este mês`}
          loading={loading}
          link="/members"
        />
        <StatCard 
          title="Saldo em Caixa" 
          value={`R$ ${stats.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
          icon={Banknote} 
          color="bg-emerald-500" 
          subtitle="Acumulado Geral"
          loading={loading}
          link="/finance"
        />
        <StatCard 
          title="Pedidos Oração" 
          value={stats.prayerCount} 
          icon={Heart} 
          color="bg-pink-500" 
          subtitle="Pendentes"
          loading={loading}
          link="/prayer"
        />
        <StatCard 
          title="Patrimônio" 
          value={`R$ ${(stats.inventoryValue/1000).toFixed(1)}k`}
          icon={Box} 
          color="bg-amber-500" 
          subtitle="Valor Estimado"
          loading={loading}
          link="/inventory"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Section */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Fluxo de Caixa (Ano Atual)</h3>
                <p className="text-sm text-slate-500">Entradas vs Saídas Mensais</p>
              </div>
            </div>
            <div className="h-80 w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                   <Spinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} dy={10} fontSize={12} />
                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                    />
                    <Area type="monotone" dataKey="income" name="Receitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Birthdays Widget */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-pink-500/10 p-2 rounded-lg text-pink-500"><Cake size={20} /></div>
               <div>
                 <h3 className="text-lg font-semibold text-white">Aniversariantes do Mês</h3>
                 <p className="text-sm text-slate-500">Celebre a vida dos seus membros.</p>
               </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {loading ? <Spinner /> : birthdays.length === 0 ? (
                 <p className="col-span-full text-slate-500 text-sm text-center py-4">Nenhum aniversariante este mês.</p>
               ) : (
                 birthdays.map(m => {
                   const day = new Date(m.birth_date!).getUTCDate();
                   return (
                     <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-pink-500/30 transition-colors group">
                       <div className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-slate-300 group-hover:text-pink-400 group-hover:bg-pink-500/10 transition-all">
                         {day}
                       </div>
                       <div className="min-w-0">
                         <p className="text-sm font-medium text-white truncate">{m.full_name}</p>
                         <p className="text-xs text-slate-500 truncate">{m.phone || 'Sem telefone'}</p>
                       </div>
                     </div>
                   )
                 })
               )}
             </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Atividade Recente</h3>
            </div>
            
            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-800 flex-1">
              {loading ? (
                <div className="p-4 text-center text-slate-500 text-sm">Carregando atividades...</div>
              ) : recentActivity.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">Nenhuma atividade recente.</div>
              ) : (
                recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center shrink-0 z-10">
                      {item.kind === 'finance' ? (
                        <Banknote size={16} className={item.type === 'income' ? "text-emerald-400" : "text-red-400"} />
                      ) : (
                        <Users size={16} className="text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {item.kind === 'finance' 
                          ? (item.type === 'income' ? 'Receita Registrada' : 'Despesa Registrada') 
                          : 'Novo Membro'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {item.kind === 'finance' 
                          ? `${item.description} (R$ ${item.amount})` 
                          : `${item.full_name} se uniu à igreja`}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(item.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
             <Link to="/reports" className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors">
                Relatórios Completos <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-5">
             <h4 className="text-indigo-400 font-semibold text-sm mb-2 flex items-center gap-2">
               <GraduationCap size={16} /> EBD & Ensino
             </h4>
             <p className="text-2xl font-bold text-white">{stats.classCount}</p>
             <p className="text-xs text-slate-400 mb-3">Turmas ativas</p>
             <Link to="/school" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Gerenciar Turmas &rarr;</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
