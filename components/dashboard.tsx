'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Lead = { id: string; name: string; company: string | null; status: string; estimated_value: number | null };
type Activity = { id: string; title: string; due_at: string | null; completed_at: string | null };

const stages = [
  ['new', 'Novos'],
  ['contacted', 'Contato'],
  ['qualified', 'Qualificados'],
  ['proposal', 'Proposta'],
  ['won', 'Ganhos'],
] as const;

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Equipe comercial');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const [{ data: profile }, { data: leadData }, { data: activityData }, { count }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('leads').select('id,name,company,status,estimated_value').order('created_at', { ascending: false }).limit(100),
        supabase.from('activities').select('id,title,due_at,completed_at').order('due_at', { ascending: true }).limit(5),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      setUserName(profile?.full_name || user.email?.split('@')[0] || 'Equipe comercial');
      setLeads(leadData || []);
      setActivities(activityData || []);
      setCustomersCount(count || 0);
      setLoading(false);
    }
    load();
  }, []);

  const pipelineValue = useMemo(() => leads.reduce((total, lead) => total + Number(lead.estimated_value || 0), 0), [leads]);

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = '/login';
  }

  return (
    <main className="crm-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark small">C4</span><span>Club4 <strong>Premium</strong></span></div>
        <nav className="nav-list">
          <a className="nav-item active" href="/">Dashboard</a>
          <a className="nav-item" href="#leads">Leads</a>
          <a className="nav-item" href="#clientes">Clientes</a>
          <a className="nav-item" href="#atividades">Atividades</a>
        </nav>
        <button className="logout-button" onClick={signOut}>Sair</button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">Visão geral</p><h1>Olá, {userName.split(' ')[0]} 👋</h1><p className="muted">Acompanhe o desempenho comercial do Club4 Premium.</p></div>
          <a className="primary-button compact" href="#leads">Novo lead</a>
        </header>

        <section className="metric-grid">
          <article className="metric-card"><span>Leads</span><strong>{loading ? '—' : leads.length}</strong><small>Total carregado</small></article>
          <article className="metric-card"><span>Pipeline</span><strong>{loading ? '—' : `R$ ${pipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</strong><small>Valor estimado</small></article>
          <article className="metric-card"><span>Clientes ativos</span><strong>{loading ? '—' : customersCount}</strong><small>Base ativa</small></article>
          <article className="metric-card"><span>Atividades</span><strong>{loading ? '—' : activities.filter((activity) => !activity.completed_at).length}</strong><small>Pendentes</small></article>
        </section>

        <section className="panel" id="leads">
          <div className="panel-header"><div><h2>Pipeline de vendas</h2><p className="muted">Leads reais do Supabase agrupados por etapa.</p></div></div>
          <div className="pipeline-grid">
            {stages.map(([status, label]) => {
              const items = leads.filter((lead) => lead.status === status);
              return <div className="pipeline-column" key={status}><div className="pipeline-title"><span>{label}</span><b>{items.length}</b></div>{items.length === 0 ? <div className="empty-state">Nenhum lead</div> : items.slice(0, 6).map((lead) => <article className="lead-card" key={lead.id}><strong>{lead.name}</strong><span>{lead.company || 'Sem empresa'}</span>{lead.estimated_value ? <small>R$ {Number(lead.estimated_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small> : null}</article>)}</div>;
            })}
          </div>
        </section>

        <section className="panel" id="atividades">
          <div className="panel-header"><div><h2>Próximas atividades</h2><p className="muted">Follow-ups registrados no CRM.</p></div></div>
          {activities.length === 0 ? <div className="empty-state large">Nenhuma atividade cadastrada.</div> : <div className="activity-list">{activities.map((activity) => <div className="activity-row" key={activity.id}><div><strong>{activity.title}</strong><span>{activity.due_at ? new Date(activity.due_at).toLocaleString('pt-BR') : 'Sem prazo'}</span></div><span className={activity.completed_at ? 'status-done' : 'status-pending'}>{activity.completed_at ? 'Concluída' : 'Pendente'}</span></div>)}</div>}
        </section>
      </section>
    </main>
  );
}
