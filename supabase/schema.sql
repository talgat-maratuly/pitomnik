-- Схема БД для учёта работ в питомнике
-- Выполните в SQL Editor Supabase

create sequence if not exists section_code_seq start 1 increment 1;

create table if not exists objects (
  id bigserial primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists sections (
  id bigserial primary key,
  object_id bigint not null references objects(id) on delete cascade,
  code text not null unique default ('PIT-' || lpad(nextval('section_code_seq')::text, 3, '0')),
  name text not null,
  area text,
  culture text,
  description text,
  qr_code_url text,
  created_at timestamptz not null default now()
);

-- На случай, если sections уже создана ранее без default:
alter table sections
  alter column code set default ('PIT-' || lpad(nextval('section_code_seq')::text, 3, '0'));

-- Подстройка sequence под уже существующие PIT-коды
select setval(
  'section_code_seq',
  coalesce(
    (
      select max(substring(code from 'PIT-([0-9]+)')::int)
      from sections
      where code ~ '^PIT-[0-9]+$'
    ),
    0
  ) + 1,
  false
);

create table if not exists work_types (
  id bigserial primary key,
  name text not null unique,
  is_other boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Для уже существующих проектов
alter table work_types add column if not exists is_other boolean not null default false;
update work_types set is_other = true where name = 'Другое';

create table if not exists work_logs (
  id bigserial primary key,
  section_id bigint not null references sections(id) on delete restrict,
  worker_full_name text not null,
  work_type_id bigint references work_types(id) on delete set null,
  custom_work_type text,
  work_volume text not null,
  comment text not null,
  photo_urls text[] not null default '{}',
  latitude double precision,
  longitude double precision,
  geo_accuracy double precision,
  map_url text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists work_logs_submitted_at_idx on work_logs(submitted_at desc);
create index if not exists work_logs_section_id_idx on work_logs(section_id);
create index if not exists work_logs_worker_idx on work_logs(worker_full_name);

-- Для уже существующих проектов
alter table work_logs add column if not exists geo_accuracy double precision;
alter table work_logs add column if not exists map_url text;

-- Стандартные виды работ
insert into work_types (name) values
  ('Полив'),
  ('Прополка'),
  ('Культивация'),
  ('Посадка'),
  ('Пересадка'),
  ('Подкормка'),
  ('Внесение удобрений'),
  ('Обработка от вредителей'),
  ('Обрезка'),
  ('Формирование растений'),
  ('Уборка территории'),
  ('Погрузка'),
  ('Разгрузка'),
  ('Перемещение растений'),
  ('Инвентаризация'),
  ('Другое')
on conflict (name) do nothing;

-- Storage bucket (создайте в Dashboard: work-photos, public)
-- insert policy ниже для anon

alter table objects enable row level security;
alter table sections enable row level security;
alter table work_types enable row level security;
alter table work_logs enable row level security;

-- MVP: открытые политики (для продакшена добавьте auth для админки)
create policy "objects read" on objects for select using (true);
create policy "objects write" on objects for all using (true) with check (true);

create policy "sections read" on sections for select using (true);
create policy "sections write" on sections for all using (true) with check (true);

create policy "work_types read" on work_types for select using (true);
create policy "work_types write" on work_types for all using (true) with check (true);

create policy "work_logs read" on work_logs for select using (true);
create policy "work_logs insert" on work_logs for insert with check (true);
create policy "work_logs update" on work_logs for update using (true) with check (true);
create policy "work_logs delete" on work_logs for delete using (true);

-- Форма для рабочих (настраиваемые тексты)
create table if not exists form_settings (
  id integer primary key default 1,
  form_title text not null default 'Отчет о выполненной работе',
  form_description text,
  form_submit_text text not null default 'Отправить',
  form_success_text text not null default 'Отчет успешно отправлен',
  form_hints text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table form_settings enable row level security;

create policy "form_settings read" on form_settings for select using (true);
create policy "form_settings write" on form_settings for all using (true) with check (true);

-- Storage policies (после создания bucket work-photos):
-- create policy "public upload" on storage.objects for insert with check (bucket_id = 'work-photos');
-- create policy "public read" on storage.objects for select using (bucket_id = 'work-photos');
