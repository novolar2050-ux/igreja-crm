import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Event, UserProfile } from '../types';
import { Calendar as CalendarIcon, MapPin, Clock, Plus, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

interface Props {
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Agenda: React.FC<Props> = ({ onNotify }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: ''
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('eventos').select('*').order('start_time', { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.igreja_id) return;
    setSubmitting(true);
    try {
      const payload = { ...formData, igreja_id: profile.igreja_id };

      if (editingId) {
        const { error } = await supabase.from('eventos').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Evento atualizado!');
      } else {
        const { error } = await supabase.from('eventos').insert([payload]);
        if (error) throw error;
        onNotify('success', 'Evento criado com sucesso!');
      }
      
      closeModal();
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      onNotify('error', 'Erro ao salvar evento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este evento?")) return;
    try {
      const { error } = await supabase.from('eventos').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Evento excluído.');
      fetchEvents();
    } catch (err) { 
      console.error(err);
      onNotify('error', 'Erro ao excluir.');
    }
  };

  const toInputDate = (isoStr?: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const openEditModal = (evt: Event) => {
    setEditingId(evt.id);
    setFormData({
      title: evt.title,
      description: evt.description || '',
      start_time: toInputDate(evt.start_time),
      end_time: toInputDate(evt.end_time),
      location: evt.location || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', description: '', start_time: '', end_time: '', location: '' });
  };

  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.start_time).toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Agenda</h2>
          <p className="text-slate-400 text-sm">Cronograma de atividades da igreja.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all shadow-lg shadow-amber-500/20 font-medium text-sm">
          <Plus size={18} /> Adicionar Evento
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-800 hidden md:block"></div>

        {loading ? <div className="flex justify-center py-12"><Spinner /></div> : events.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl">
            <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-slate-300 font-medium">Nenhum evento agendado</h3>
            <p className="text-slate-500 text-sm mt-1">Adicione cultos, reuniões ou eventos especiais.</p>
          </div>
        ) : (
          Object.keys(groupedEvents).map((date) => (
            <div key={date} className="mb-8 relative">
              <div className="flex items-center gap-4 mb-4 md:ml-8">
                <div className="hidden md:block absolute left-6 w-4 h-4 bg-slate-950 border-2 border-amber-500 rounded-full z-10"></div>
                <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full inline-block border border-amber-500/20">
                  {date}
                </h3>
              </div>
              
              <div className="space-y-3 md:ml-16">
                {groupedEvents[date].map(event => (
                  <div key={event.id} className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl hover:border-amber-500/30 hover:bg-slate-800/60 transition-all group flex flex-col md:flex-row md:items-center gap-5 backdrop-blur-sm">
                    <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl p-3 min-w-[80px] shrink-0 group-hover:border-amber-500/40 transition-colors">
                      <span className="text-2xl font-bold text-white">
                        {new Date(event.start_time).getDate()}
                      </span>
                      <span className="text-xs text-slate-500 uppercase font-medium">
                        {new Date(event.start_time).toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-white">{event.title}</h4>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                           <Clock size={12} />
                           {new Date(event.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">{event.description || 'Sem descrição detalhada.'}</p>
                      
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin size={14} className="text-amber-500/70" /> 
                          {event.location}
                        </div>
                      )}
                    </div>

                    <div className="md:self-center pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-800/60 md:pl-5 flex flex-row md:flex-col gap-2">
                      <button onClick={() => openEditModal(event)} className="w-full md:w-auto text-xs text-slate-400 hover:text-amber-400 font-medium flex items-center justify-center gap-1 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="w-full md:w-auto text-xs text-slate-400 hover:text-red-400 font-medium flex items-center justify-center gap-1 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Evento" : "Novo Evento"}>
        <form onSubmit={handleSaveEvent} className="space-y-5">
          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Título</label>
             <input required placeholder="Culto de Domingo, Ensaio..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Início</label>
              <input required type="datetime-local" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
            </div>
            <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fim (Opcional)</label>
               <input type="datetime-local" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Local</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input placeholder="Santuário Principal, Sala 3..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
          </div>
          
          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Descrição</label>
             <textarea placeholder="Detalhes adicionais sobre o evento..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white h-24 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="pt-2 flex justify-end gap-3">
             <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancelar</button>
             <button type="submit" disabled={submitting} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-amber-500/20 flex items-center gap-2">
               {submitting && <Spinner className="w-4 h-4" />} {editingId ? 'Atualizar' : 'Criar Evento'}
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};