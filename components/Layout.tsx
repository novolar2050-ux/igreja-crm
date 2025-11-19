
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Modal } from './Modal';
import { 
  LayoutDashboard, 
  Users, 
  Banknote, 
  Calendar, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  Church,
  MessageSquare,
  HeartHandshake,
  Bell,
  Search,
  FileText,
  Settings,
  GraduationCap,
  Box,
  ListChecks,
  Heart,
  PieChart,
  Image,
  Share2,
  Copy,
  QrCode,
  ExternalLink,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  userEmail?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, userEmail }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [forceShowQR, setForceShowQR] = useState(false); // NEW STATE
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const getChurchId = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if(user) {
          const { data } = await supabase.from('profiles').select('igreja_id').eq('id', user.id).single();
          if(data) setChurchId(data.igreja_id);
       }
    }
    getChurchId();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Detects if running in a Blob/Preview environment
  const isPreviewEnv = () => {
    return window.location.protocol === 'blob:';
  };

  // Robust link generation that works in subfolders/cloud environments
  const getPublicLink = () => {
    if(!churchId) return '';
    
    if (isPreviewEnv()) {
       return window.location.href; // Return blob url if forced
    }

    // Use href split to keep current path/port/subdomain
    const baseUrl = window.location.href.split('#')[0]; 
    // Remove trailing slash if present to avoid double slashes
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}/#/external/register/${churchId}`;
  };

  const copyPublicLink = () => {
     const link = getPublicLink();
     if(link) {
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
     }
  };

  const navItems = [
    { path: '/dashboard', label: 'Painel Geral', icon: <LayoutDashboard size={20} /> },
    { path: '/members', label: 'Membros', icon: <Users size={20} /> },
    { path: '/finance', label: 'Financeiro', icon: <Banknote size={20} /> },
    { path: '/school', label: 'EBD / Ensino', icon: <GraduationCap size={20} /> },
    { path: '/scales', label: 'Escalas', icon: <ListChecks size={20} /> },
    { path: '/ministry', label: 'Ministérios', icon: <BookOpen size={20} /> },
    { path: '/discipleship', label: 'Discipulado', icon: <HeartHandshake size={20} /> },
    { path: '/prayer', label: 'Pedidos Oração', icon: <Heart size={20} /> },
    { path: '/inventory', label: 'Patrimônio', icon: <Box size={20} /> },
    { path: '/agenda', label: 'Agenda', icon: <Calendar size={20} /> },
    { path: '/communication', label: 'Comunicação', icon: <MessageSquare size={20} /> },
    { path: '/media', label: 'Mídia & Arquivos', icon: <Image size={20} /> }, 
    { path: '/reports', label: 'Relatórios', icon: <PieChart size={20} /> }, 
    { path: '/documents', label: 'Documentos', icon: <FileText size={20} /> },
    { path: '/settings', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.label : 'Ecclesia';
  };

  const publicLink = getPublicLink();
  const isBlobMode = isPreviewEnv();

  // Reset force show when closing
  useEffect(() => {
    if(!isShareOpen) setForceShowQR(false);
  }, [isShareOpen]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-slate-900/80 border-r border-slate-800/60 backdrop-blur-xl">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Church className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight leading-tight">Ecclesia</h1>
            <span className="text-xs text-slate-500 font-medium">Gestão Pro</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 mb-4 custom-scrollbar">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-2">Gestão</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive(item.path)
                    ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                {isActive(item.path) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
                )}
                <span className={`transition-colors ${isActive(item.path) ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800/60 space-y-3">
          {churchId && (
            <button 
              onClick={() => setIsShareOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-all text-xs font-medium"
            >
              <Share2 size={14} />
              Compartilhar Cadastro
            </button>
          )}

          <div className="bg-slate-800/40 rounded-xl p-4 flex items-center gap-3 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
              {userEmail?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userEmail}</p>
              <p className="text-xs text-slate-500 truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-slate-700 text-slate-400 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Church className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Ecclesia</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950 pt-20 px-4 animate-in slide-in-from-top-10 duration-200 overflow-y-auto">
          <nav className="space-y-2 pb-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl border ${
                  isActive(item.path)
                    ? 'bg-indigo-600/10 border-indigo-600/20 text-indigo-400'
                    : 'border-slate-800/50 bg-slate-900/30 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span className="text-lg font-medium">{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-4 mt-6 rounded-xl text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 bg-slate-900/30"
            >
              <LogOut size={20} />
              <span className="text-lg font-medium">Sair</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full bg-slate-950">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-16 border-b border-slate-800/60 items-center justify-between px-8 bg-slate-900/30 backdrop-blur-sm">
           <h2 className="text-xl font-semibold text-white tracking-tight">{getPageTitle()}</h2>
           
           <div className="flex items-center gap-4">
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Busca rápida..." 
                 className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 w-64 transition-all"
               />
             </div>
             <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
             </button>
           </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-20">
             {children}
          </div>
        </div>
      </main>

      {/* Share Modal */}
      <Modal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title="Divulgar Cadastro">
         <div className="flex flex-col items-center gap-6 p-4">
            {isBlobMode && !forceShowQR ? (
               <div className="w-full p-6 bg-amber-950/30 border border-amber-500/30 rounded-xl text-center">
                  <div className="inline-flex p-3 bg-amber-500/20 rounded-full mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-amber-400 mb-2">Você está no Modo de Edição</h3>
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                    Este endereço (blob) é interno do editor e não funciona para o público. 
                  </p>
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-sm text-indigo-300 font-medium mb-4 shadow-inner">
                    <p className="mb-1 text-white">Para gerar o QR Code correto:</p>
                    1. Procure o ícone <span className="inline-flex bg-slate-800 p-1 rounded mx-1 text-white">↗ Open in New Tab</span> no topo do editor.<br/>
                    2. Clique nele para abrir o site real.<br/>
                    3. Tente compartilhar novamente na nova aba.
                  </div>
                  <button 
                    onClick={() => setForceShowQR(true)}
                    className="text-xs text-slate-500 hover:text-slate-300 underline"
                  >
                    Ignorar aviso e mostrar QR Code inválido (Apenas Teste)
                  </button>
               </div>
            ) : (
               <>
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                     <img 
                       src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicLink)}`} 
                       alt="QR Code" 
                       className="w-48 h-48"
                     />
                  </div>
                  
                  <div className="w-full text-center space-y-2">
                     <p className="text-slate-300 text-sm font-medium">Link Público para Visitantes</p>
                     <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-lg">
                        <input 
                          readOnly 
                          value={publicLink} 
                          className="bg-transparent text-slate-400 text-xs flex-1 outline-none"
                        />
                        <button 
                          onClick={copyPublicLink}
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
                        >
                          {copiedLink ? <CheckIcon size={16} /> : <Copy size={16} />}
                        </button>
                     </div>
                     {isBlobMode && (
                       <p className="text-[10px] text-amber-500/80">
                         Atenção: Este link de teste (blob) não funcionará em outros dispositivos.
                       </p>
                     )}
                  </div>

                  <div className="flex gap-3 w-full">
                     <a 
                       href={publicLink} 
                       target="_blank" 
                       rel="noreferrer"
                       className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                     >
                       <ExternalLink size={16} /> Testar Link
                     </a>
                     <button 
                       onClick={() => setIsShareOpen(false)}
                       className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
                     >
                       Fechar
                     </button>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 text-center max-w-xs">
                     Imprima o QR Code e coloque na recepção. Os visitantes se cadastrarão diretamente no sistema como "Visitantes".
                  </p>
               </>
            )}
         </div>
      </Modal>
    </div>
  );
};

const CheckIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
