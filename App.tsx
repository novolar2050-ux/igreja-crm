
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Finance } from './pages/Finance';
import { Ministry } from './pages/Ministry';
import { Agenda } from './pages/Agenda';
import { Discipleship } from './pages/Discipleship';
import { Communication } from './pages/Communication';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
import { School } from './pages/School';
import { Inventory } from './pages/Inventory';
import { Scales } from './pages/Scales';
import { Prayer } from './pages/Prayer';
import { Reports } from './pages/Reports'; 
import { Media } from './pages/Media'; // NEW
import { PublicRegistration } from './pages/PublicRegistration'; // NEW
import { SetupSQL } from './pages/SetupSQL';
import { Onboarding } from './pages/Onboarding';
import { Spinner } from './components/Spinner';
import { NotificationToast } from './components/NotificationToast';
import { Notification, UserProfile } from './types';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemReady, setSystemReady] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const checkSystemStatus = async (currentSession: Session | null) => {
    if (!currentSession) {
      setLoading(false);
      return;
    }

    try {
      const { error: tableError } = await supabase.from('igrejas').select('id, created_by').limit(0);
      
      const isMissingTable = tableError && (
        tableError.code === '42P01' || 
        tableError.code === '42703' || 
        tableError.message.includes('does not exist') ||
        tableError.message.includes('Could not find the table')
      );

      if (isMissingTable) {
        console.warn("Tabelas ou colunas críticas não encontradas. Redirecionando para Setup.");
        setSystemReady(false);
        setLoading(false);
        return;
      }
      
      setSystemReady(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .maybeSingle(); 
      
      setProfile(profileData);

    } catch (error) {
      console.error("Erro na verificação do sistema:", error);
      setSystemReady(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkSystemStatus(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN') {
        setLoading(true);
        checkSystemStatus(session);
      } else if (_event === 'SIGNED_OUT') {
        setProfile(null);
        setSystemReady(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <Spinner className="w-12 h-12 text-indigo-500" />
      </div>
    );
  }

  return (
    <Router>
      <div className="fixed top-4 right-4 z-[100] w-80 flex flex-col pointer-events-none">
        <div className="pointer-events-auto space-y-2">
           {notifications.map(n => (
             <NotificationToast key={n.id} notification={n} onDismiss={dismissNotification} />
           ))}
        </div>
      </div>

      <Routes>
        {/* Public Route */}
        <Route path="/external/register/:churchId" element={<PublicRegistration />} />

        <Route path="/login" element={
          !session ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
              <div className="max-w-md w-full">
                <Auth onNotify={addNotification} />
              </div>
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        } />

        <Route path="/setup" element={
          session ? <SetupSQL /> : <Navigate to="/login" replace />
        } />

        <Route path="/onboarding" element={
          session && systemReady ? (
            <Onboarding onComplete={() => checkSystemStatus(session)} />
          ) : (
            <Navigate to="/" replace />
          )
        } />
        
        <Route path="/*" element={
          session ? (
            !systemReady ? (
              <Navigate to="/setup" replace />
            ) : !profile ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Layout userEmail={profile.full_name || session.user.email}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/members" element={<Members onNotify={addNotification} />} />
                  <Route path="/finance" element={<Finance onNotify={addNotification} />} />
                  <Route path="/school" element={<School onNotify={addNotification} />} />
                  <Route path="/scales" element={<Scales onNotify={addNotification} />} />
                  <Route path="/ministry" element={<Ministry onNotify={addNotification} />} />
                  <Route path="/discipleship" element={<Discipleship onNotify={addNotification} />} />
                  <Route path="/prayer" element={<Prayer onNotify={addNotification} />} />
                  <Route path="/inventory" element={<Inventory onNotify={addNotification} />} />
                  <Route path="/agenda" element={<Agenda onNotify={addNotification} />} />
                  <Route path="/communication" element={<Communication onNotify={addNotification} />} />
                  <Route path="/media" element={<Media onNotify={addNotification} />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/documents" element={<Documents onNotify={addNotification} />} />
                  <Route path="/settings" element={<Settings onNotify={addNotification} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </Router>
  );
};

export default App;
