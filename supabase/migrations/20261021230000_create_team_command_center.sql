-- Club4 Premium: Central de Comando da Equipe
-- Roles are application roles; never expose privileged actions without RLS.

create table if not exists public.team_roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  level integer not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.team_roles (key,name,description,level) values
 ('admin_master','Admin Master','Acesso global e gestão de toda a plataforma',100),
 ('gerente_unidade','Gerente de Unidade','Gestão operacional da unidade e equipe',80),
 ('financeiro','Financeiro','Gestão financeira e relatórios financeiros',70),
 ('consultora','Consultora','Atendimento comercial, leads e vendas',50),
 ('recepcionista','Recepcionista','Atendimento, cadastro e agenda da unidade',40),
 ('professor','Professor','Agenda, alunos/clientes e atividades acadêmicas',30)
on conflict (key) do update set name=excluded.name,description=excluded.description,level=excluded.level;

create table if not exists public.team_permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  module text not null,
  action text not null,
  description text,
  created_at timestamptz not null default now()
);

insert into public.team_permissions (key,name,module,action,description) values
 ('dashboard.view','Ver dashboard','dashboard','view','Visualizar indicadores'),
 ('leads.view','Ver leads','leads','view','Visualizar leads'),
 ('leads.create','Criar leads','leads','create','Cadastrar leads'),
 ('leads.edit','Editar leads','leads','edit','Editar dados de leads'),
 ('leads.assign','Distribuir leads','leads','assign','Atribuir leads à equipe'),
 ('customers.view','Ver clientes','customers','view','Visualizar clientes'),
 ('customers.edit','Editar clientes','customers','edit','Editar clientes'),
 ('activities.manage','Gerenciar atividades','activities','manage','Criar e concluir atividades'),
 ('appointments.view','Ver agenda','appointments','view','Visualizar agenda'),
 ('appointments.manage','Gerenciar agenda','appointments','manage','Criar, alterar e cancelar agendamentos'),
 ('finance.view','Ver financeiro','finance','view','Visualizar dados financeiros'),
 ('finance.manage','Gerenciar financeiro','finance','manage','Operar rotinas financeiras'),
 ('team.view','Ver equipe','team','view','Visualizar equipe'),
 ('team.manage','Gerenciar equipe','team','manage','Cadastrar, editar, ativar e desativar usuários'),
 ('roles.manage','Gerenciar cargos e permissões','team','roles','Configurar cargos e permissões'),
 ('unit.manage','Gerenciar unidades','units','manage','Configurar unidades'),
 ('sdr.view','Ver SDR IA','sdr','view','Visualizar central SDR'),
 ('sdr.manage','Configurar SDR IA','sdr','manage','Administrar SDR e integrações'),
 ('reports.view','Ver relatórios','reports','view','Visualizar relatórios'),
 ('settings.manage','Configurações','settings','manage','Administrar configurações globais')
on conflict (key) do update set name=excluded.name,module=excluded.module,action=excluded.action,description=excluded.description;

create table if not exists public.team_role_permissions (
  role_id uuid not null references public.team_roles(id) on delete cascade,
  permission_id uuid not null references public.team_permissions(id) on delete cascade,
  primary key (role_id,permission_id)
);

-- Default least-privilege matrix.
with matrix(role_key,permission_key) as (values
 ('admin_master','dashboard.view'),('admin_master','leads.view'),('admin_master','leads.create'),('admin_master','leads.edit'),('admin_master','leads.assign'),('admin_master','customers.view'),('admin_master','customers.edit'),('admin_master','activities.manage'),('admin_master','appointments.view'),('admin_master','appointments.manage'),('admin_master','finance.view'),('admin_master','finance.manage'),('admin_master','team.view'),('admin_master','team.manage'),('admin_master','roles.manage'),('admin_master','unit.manage'),('admin_master','sdr.view'),('admin_master','sdr.manage'),('admin_master','reports.view'),('admin_master','settings.manage'),
 ('gerente_unidade','dashboard.view'),('gerente_unidade','leads.view'),('gerente_unidade','leads.create'),('gerente_unidade','leads.edit'),('gerente_unidade','leads.assign'),('gerente_unidade','customers.view'),('gerente_unidade','customers.edit'),('gerente_unidade','activities.manage'),('gerente_unidade','appointments.view'),('gerente_unidade','appointments.manage'),('gerente_unidade','team.view'),('gerente_unidade','reports.view'),('gerente_unidade','sdr.view'),
 ('financeiro','dashboard.view'),('financeiro','customers.view'),('financeiro','finance.view'),('financeiro','finance.manage'),('financeiro','reports.view'),
 ('consultora','dashboard.view'),('consultora','leads.view'),('consultora','leads.create'),('consultora','leads.edit'),('consultora','customers.view'),('consultora','customers.edit'),('consultora','activities.manage'),('consultora','appointments.view'),('consultora','appointments.manage'),('consultora','sdr.view'),
 ('recepcionista','dashboard.view'),('recepcionista','leads.view'),('recepcionista','leads.create'),('recepcionista','customers.view'),('recepcionista','customers.edit'),('recepcionista','appointments.view'),('recepcionista','appointments.manage'),('recepcionista','activities.manage'),
 ('professor','dashboard.view'),('professor','customers.view'),('professor','appointments.view'),('professor','activities.manage')
)
insert into public.team_role_permissions(role_id,permission_id)
select r.id,p.id from matrix m join public.team_roles r on r.key=m.role_key join public.team_permissions p on p.key=m.permission_key
on conflict do nothing;

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role_id uuid not null references public.team_roles(id),
  unit_id uuid references public.units(id) on delete set null,
  active boolean not null default true,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_members_role on public.team_members(role_id);
create index if not exists idx_team_members_unit on public.team_members(unit_id);
create index if not exists idx_team_members_active on public.team_members(active);
create index if not exists idx_role_permissions_permission on public.team_role_permissions(permission_id);

-- Keep profile role information synchronized when possible, while team_members remains the source for the new command center.
alter table public.team_roles enable row level security;
alter table public.team_permissions enable row level security;
alter table public.team_role_permissions enable row level security;
alter table public.units enable row level security;
alter table public.team_members enable row level security;

create or replace function public.has_team_permission(permission_key text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists (
    select 1
    from public.team_members tm
    join public.team_roles tr on tr.id=tm.role_id
    join public.team_role_permissions rp on rp.role_id=tr.id
    join public.team_permissions p on p.id=rp.permission_id
    where tm.user_id=auth.uid() and tm.active=true and tr.active=true and p.key=permission_key
  );
$$;

create policy team_roles_read on public.team_roles for select to authenticated using (public.has_team_permission('team.view') or public.has_team_permission('roles.manage'));
create policy team_permissions_read on public.team_permissions for select to authenticated using (public.has_team_permission('team.view') or public.has_team_permission('roles.manage'));
create policy team_role_permissions_read on public.team_role_permissions for select to authenticated using (public.has_team_permission('team.view') or public.has_team_permission('roles.manage'));
create policy team_role_permissions_manage on public.team_role_permissions for all to authenticated using (public.has_team_permission('roles.manage')) with check (public.has_team_permission('roles.manage'));
create policy team_roles_manage on public.team_roles for all to authenticated using (public.has_team_permission('roles.manage')) with check (public.has_team_permission('roles.manage'));
create policy units_read on public.units for select to authenticated using (public.has_team_permission('team.view') or public.has_team_permission('unit.manage'));
create policy units_manage on public.units for all to authenticated using (public.has_team_permission('unit.manage')) with check (public.has_team_permission('unit.manage'));
create policy team_members_read on public.team_members for select to authenticated using (public.has_team_permission('team.view') or user_id=auth.uid());
create policy team_members_manage on public.team_members for all to authenticated using (public.has_team_permission('team.manage')) with check (public.has_team_permission('team.manage'));

create or replace function public.touch_team_member_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists team_member_updated_at on public.team_members;
create trigger team_member_updated_at before update on public.team_members for each row execute function public.touch_team_member_updated_at();
