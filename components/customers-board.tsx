'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Customer = {
  id: string;
  owner_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
};

type FormState = Omit<Customer, 'id' | 'owner_id' | 'created_at'>;

const emptyForm: FormState = {
  name: '', email: '', phone: '', company: '', status: 'active', notes: '',
};

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CustomersBoard() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('sales');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function loadCustomers() {
    setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    setUserId(user.id);
    const profile = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile.data?.role) setRole(profile.data.role);
    const result = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (result.error) setError(result.error.message); else setCustomers((result.data ?? []) as Customer[]);
    setLoading(false);
  }

  useEffect(() => { void loadCustomers(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesStatus = status === 'all' || customer.status === status;
      const haystack = [customer.name, customer.email, customer.phone, customer.company].filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [customers, search, status]);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setNotice(''); }
  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({ name: customer.name, email: customer.email ?? '', phone: customer.phone ?? '', company: customer.company ?? '', status: customer.status, notes: customer.notes ?? '' });
    setError(''); setNotice('');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) { setError('Informe o nome do cliente.'); return; }
    setSaving(true); setError(''); setNotice('');
    const payload = { ...form, name: form.name.trim(), email: form.email?.trim() || null, phone: form.phone?.trim() || null, company: form.company?.trim() || null, notes: form.notes?.trim() || null };
    const result = editing
      ? await supabase.from('customers').update(payload).eq('id', editing.id).select().single()
      : await supabase.from('customers').insert({ ...payload, owner_id: userId }).select().single();
    if (result.error) setError(result.error.message);
    else { setNotice(editing ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.'); await loadCustomers(); setEditing(null); setForm(emptyForm); }
    setSaving(false);
  }

  async function remove(customer: Customer) {
    if (role !== 'admin' && role !== 'manager') return;
    if (!window.confirm(`Excluir ${customer.name}? Esta ação não pode ser desfeita.`)) return;
    const result = await supabase.from('customers').delete().eq('id', customer.id);
    if (result.error) setError(result.error.message); else { setNotice('Cliente excluído.'); setCustomers((items) => items.filter((item) => item.id !== customer.id)); }
  }

  return (
    <main className="crm-shell">
      <aside className="sidebar">
        <Link href="/crm" className="brand"><span className="brand-mark small">C4</span><strong>Club4 Premium</strong></Link>
        <nav className="nav-list">
          <Link href="/crm" className="nav-item">Dashboard</Link>
          <Link href="/leads" className="nav-item">Leads</Link>
          <Link href="/clientes" className="nav-item active">Clientes</Link>
          <span className="nav-item">Atividades</span>
          <span className="nav-item">Equipe</span>
        </nav>
        <button className="logout-button" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}>Sair</button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">Relacionamento</p><h1>Clientes</h1><p className="muted">Gerencie sua carteira, contatos e status comercial.</p></div>
          <button className="primary-button compact" onClick={openCreate}>+ Novo cliente</button>
        </header>

        <div className="leads-toolbar">
          <input className="search-input" placeholder="Buscar por nome, empresa, e-mail ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">Todos os status</option><option value="active">Ativos</option><option value="inactive">Inativos</option>
          </select>
        </div>

        {error && <div className="inline-message">{error}</div>}
        {notice && <div className="success-message">{notice}</div>}

        <section className="panel">
          {loading ? <div className="empty-state large">Carregando clientes...</div> : filtered.length === 0 ? <div className="empty-state large">Nenhum cliente encontrado.</div> : (
            <div className="customer-table-wrap"><table className="customer-table"><thead><tr><th>Cliente</th><th>Contato</th><th>Empresa</th><th>Status</th><th>Ações</th></tr></thead><tbody>
              {filtered.map((customer) => <tr key={customer.id}>
                <td><strong>{customer.name}</strong><small>{new Date(customer.created_at).toLocaleDateString('pt-BR')}</small></td>
                <td><span>{customer.email || '—'}</span><small>{customer.phone || 'Sem telefone'}</small></td>
                <td>{customer.company || '—'}</td>
                <td><span className={customer.status === 'active' ? 'customer-status active' : 'customer-status inactive'}>{customer.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
                <td><div className="lead-card-actions"><button onClick={() => openEdit(customer)}>Editar</button>{(role === 'admin' || role === 'manager') && <button onClick={() => void remove(customer)}>Excluir</button>}</div></td>
              </tr>)}
            </tbody></table></div>
          )}
        </section>

        <p className="muted customer-summary">{filtered.length} cliente{filtered.length === 1 ? '' : 's'} exibido{filtered.length === 1 ? '' : 's'} · Carteira atual</p>
      </section>

      {(editing || form !== emptyForm && form.name !== '' || (!editing && form.name === '' && false)) && null}
      {editing !== null || form.name !== '' || notice === '' && false ? null : null}
      {editing !== null || form.name !== '' ? (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) { setEditing(null); setForm(emptyForm); } }}>
          <form className="modal-card lead-form" onSubmit={save}>
            <div className="modal-header"><div><p className="eyebrow">Cadastro</p><h2>{editing ? 'Editar cliente' : 'Novo cliente'}</h2></div><button type="button" className="icon-button" onClick={() => { setEditing(null); setForm(emptyForm); }}>✕</button></div>
            <div className="form-grid">
              <label>Nome *<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label>Empresa<input value={form.company ?? ''} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
              <label>E-mail<input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>Telefone<input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
              <label className="form-full">Observações<textarea rows={4} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cliente'}</button></div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
