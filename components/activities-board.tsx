'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Activity = {
  id: string; user_id: string; customer_id: string | null; lead_id: string | null; activity_type: string; title: string; description: string | null; due_at: string | null; completed_at: string | null; created_at: string;
};
type FormState = { title: string; activity_type: string; description: string; due_at: string; customer_id: string; lead_id: string };
type Option = { id: string; name: string };
const emptyForm: FormState = { title: '', activity_type: 'follow_up', description: '', due_at: '', customer_id: '', lead_id: '' };
const typeLabels: Record<string, string> = { call: 'Ligação', meeting: 'Reunião', email: 'E-mail', follow_up: 'Follow-up', task: 'Tarefa', other: 'Outro' };

function formatDue(value: string | null) {
  if (!value) return 'Sem prazo';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ActivitiesBoard() {
  const supabase = createClient();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [leads, setLeads] = useState<Option[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function loadData() {
    setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    setUserId(user.id);
    const [profileResult, activityResult, customerResult, leadResult] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('activities').select('*').order('due_at', { ascending: true, nullsFirst: false }),
      supabase.from('customers').select('id,name').order('name'),
      supabase.from('leads').select('id,name').order('name'),
    ]);
    if (profileResult.data?.role) setRole(profileResult.data.role);
    if (activityResult.error) setError(activityResult.error.message); else setActivities((activityResult.data ?? []) as Activity[]);
    if (customerResult.error) setError(customerResult.error.message); else setCustomers((customerResult.data ?? []) as Option[]);
    if (leadResult.error) setError(leadResult.error.message); else setLeads((leadResult.data ?? []) as Option[]);
    setLoading(false);
  }

  useEffect(() => { void loadData(); }, []);
  const canDelete = role === 'admin' || role === 'manager';
  const customerMap = useMemo(() => new Map(customers.map((item) => [item.id, item.name])), [customers]);
  const leadMap = useMemo(() => new Map(leads.map((item) => [item.id, item.name])), [leads]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchesFilter = filter === 'all' || (filter === 'pending' ? !activity.completed_at : Boolean(activity.completed_at));
      const related = [activity.customer_id ? customerMap.get(activity.customer_id) : '', activity.lead_id ? leadMap.get(activity.lead_id) : ''].join(' ');
      return matchesFilter && (!q || `${activity.title} ${activity.description ?? ''} ${related}`.toLowerCase().includes(q));
    });
  }, [activities, customerMap, leadMap, search, filter]);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setNotice(''); setModalOpen(true); }
  function openEdit(activity: Activity) { setEditing(activity); setForm({ title: activity.title, activity_type: activity.activity_type, description: activity.description ?? '', due_at: activity.due_at ? activity.due_at.slice(0, 16) : '', customer_id: activity.customer_id ?? '', lead_id: activity.lead_id ?? '' }); setError(''); setNotice(''); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); setForm(emptyForm); setError(''); }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) { setError('Informe o título da atividade.'); return; }
    if (!form.customer_id && !form.lead_id) { setError('Vincule a atividade a um cliente ou lead.'); return; }
    setSaving(true); setError(''); setNotice('');
    const payload = { title: form.title.trim(), activity_type: form.activity_type, description: form.description.trim() || null, due_at: form.due_at ? new Date(form.due_at).toISOString() : null, customer_id: form.customer_id || null, lead_id: form.lead_id || null };
    const result = editing ? await supabase.from('activities').update(payload).eq('id', editing.id).select().single() : await supabase.from('activities').insert({ ...payload, user_id: userId }).select().single();
    if (result.error) setError(result.error.message); else { setNotice(editing ? 'Atividade atualizada.' : 'Atividade criada.'); closeModal(); await loadData(); }
    setSaving(false);
  }

  async function toggleComplete(activity: Activity) {
    const completed_at = activity.completed_at ? null : new Date().toISOString();
    const result = await supabase.from('activities').update({ completed_at }).eq('id', activity.id).select().single();
    if (result.error) setError(result.error.message); else setActivities((items) => items.map((item) => item.id === activity.id ? { ...item, completed_at } : item));
  }

  async function remove(activity: Activity) {
    if (!canDelete) return;
    if (!window.confirm(`Excluir a atividade “${activity.title}”?`)) return;
    const result = await supabase.from('activities').delete().eq('id', activity.id);
    if (result.error) setError(result.error.message); else { setNotice('Atividade excluída.'); setActivities((items) => items.filter((item) => item.id !== activity.id)); }
  }

  return (
    <main className="crm-shell">
      <aside className="sidebar"><Link href="/crm" className="brand"><span className="brand-mark small">C4</span><strong>Club4 Premium</strong></Link><nav className="nav-list"><Link href="/crm" className="nav-item">Dashboard</Link><Link href="/leads" className="nav-item">Leads</Link><Link href="/clientes" className="nav-item">Clientes</Link><Link href="/atividades" className="nav-item active">Atividades</Link><span className="nav-item">Equipe</span></nav><button className="logout-button" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}>Sair</button></aside>
      <section className="content">
        <header className="topbar"><div><p className="eyebrow">Rotina comercial</p><h1>Atividades</h1><p className="muted">Organize follow-ups, reuniões, ligações e tarefas da equipe.</p></div><button className="primary-button compact" onClick={openCreate}>+ Nova atividade</button></header>
        <div className="leads-toolbar"><input className="search-input" placeholder="Buscar atividade, cliente ou lead..." value={search} onChange={(event) => setSearch(event.target.value)} /><select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="pending">Pendentes</option><option value="all">Todas</option><option value="completed">Concluídas</option></select></div>
        {error && !modalOpen && <div className="inline-message">{error}</div>}{notice && <div className="success-message">{notice}</div>}
        <section className="panel">{loading ? <div className="empty-state large">Carregando atividades...</div> : filtered.length === 0 ? <div className="empty-state large">Nenhuma atividade encontrada.</div> : <div className="activity-list">{filtered.map((activity) => { const related = activity.customer_id ? customerMap.get(activity.customer_id) : activity.lead_id ? leadMap.get(activity.lead_id) : 'Sem vínculo'; return <article className="activity-row activity-card" key={activity.id}><div className="activity-main"><div className="activity-heading"><span className="activity-type">{typeLabels[activity.activity_type] ?? activity.activity_type}</span><strong className={activity.completed_at ? 'completed-title' : ''}>{activity.title}</strong></div><span>{related} · {formatDue(activity.due_at)}</span>{activity.description && <small>{activity.description}</small>}</div><div className="lead-card-actions"><button onClick={() => void toggleComplete(activity)}>{activity.completed_at ? 'Reabrir' : 'Concluir'}</button><button onClick={() => openEdit(activity)}>Editar</button>{canDelete && <button onClick={() => void remove(activity)}>Excluir</button>}</div></article>; })}</div>}</section>
      </section>
      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) closeModal(); }}><form className="modal-card lead-form" onSubmit={save}><div className="modal-header"><div><p className="eyebrow">Agenda comercial</p><h2>{editing ? 'Editar atividade' : 'Nova atividade'}</h2></div><button type="button" className="icon-button" onClick={closeModal}>✕</button></div><div className="form-grid"><label>Título *<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label>Tipo<select value={form.activity_type} onChange={(event) => setForm({ ...form, activity_type: event.target.value })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Cliente<select value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value, lead_id: event.target.value ? '' : form.lead_id })}><option value="">Nenhum</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Lead<select value={form.lead_id} onChange={(event) => setForm({ ...form, lead_id: event.target.value, customer_id: event.target.value ? '' : form.customer_id })}><option value="">Nenhum</option>{leads.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Prazo<input type="datetime-local" value={form.due_at} onChange={(event) => setForm({ ...form, due_at: event.target.value })} /></label><label className="form-full">Descrição<textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Salvando...' : 'Salvar atividade'}</button></div></form></div>}
    </main>
  );
}
