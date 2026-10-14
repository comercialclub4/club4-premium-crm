const metrics = [
  { label: 'Leads novos', value: '24', detail: '+12% este mês' },
  { label: 'Oportunidades', value: '18', detail: 'R$ 84.500 em pipeline' },
  { label: 'Clientes ativos', value: '132', detail: '+8 novos este mês' },
  { label: 'Atividades hoje', value: '11', detail: '4 pendentes' },
];

const pipeline = [
  { label: 'Novos', value: 8 },
  { label: 'Contato', value: 5 },
  { label: 'Qualificados', value: 7 },
  { label: 'Proposta', value: 4 },
];

export default function Dashboard() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex' }}>
      <aside style={{ width: 250, background: '#111827', color: 'white', padding: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 40 }}>Club4 Premium</div>
        <nav style={{ display: 'grid', gap: 8 }}>
          {['Dashboard', 'Leads', 'Clientes', 'Atividades', 'Equipe'].map((item, index) => (
            <div key={item} style={{ padding: '12px 14px', borderRadius: 10, background: index === 0 ? '#1f2937' : 'transparent', color: index === 0 ? 'white' : '#9ca3af' }}>
              {item}
            </div>
          ))}
        </nav>
      </aside>

      <section style={{ flex: 1, padding: 32, maxWidth: 1400 }}>
        <header style={{ marginBottom: 28 }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>Visão geral</p>
          <h1 style={{ margin: '6px 0 0', fontSize: 32 }}>Dashboard comercial</h1>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
          {metrics.map((metric) => (
            <article key={metric.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20 }}>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{metric.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '8px 0' }}>{metric.value}</div>
              <div style={{ color: '#059669', fontSize: 13 }}>{metric.detail}</div>
            </article>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Pipeline de vendas</h2>
            <div style={{ display: 'grid', gap: 18 }}>
              {pipeline.map((stage) => (
                <div key={stage.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 14 }}>
                    <span>{stage.label}</span><strong>{stage.value}</strong>
                  </div>
                  <div style={{ height: 10, background: '#eef0f3', borderRadius: 99 }}>
                    <div style={{ width: `${stage.value * 10}%`, height: '100%', background: '#111827', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Próximas atividades</h2>
            {['Ligação — João Silva', 'Follow-up — Empresa Alfa', 'Enviar proposta — Maria Souza', 'Reunião — Cliente Premium'].map((item, index) => (
              <div key={item} style={{ padding: '14px 0', borderBottom: index < 3 ? '1px solid #f0f1f3' : 'none', fontSize: 14 }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>{item}</strong>
                <span style={{ color: '#6b7280' }}>{index + 1}0:{index === 0 ? '00' : '30'} · hoje</span>
              </div>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
