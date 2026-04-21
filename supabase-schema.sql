-- ============================================
-- StockSim 数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 里运行此文件
-- ============================================

-- 1. 用户资产表
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  cash numeric(12,2) not null default 100000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- 2. 持仓表
create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  name text not null,
  shares integer not null default 0,
  avg_cost numeric(12,4) not null default 0,
  total_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, symbol)
);

-- 3. 交易记录表
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('buy', 'sell')),
  symbol text not null,
  name text not null,
  shares integer not null,
  price numeric(12,4) not null,
  total numeric(12,2) not null,
  profit numeric(12,2),
  profit_percent numeric(8,4),
  avg_cost numeric(12,4),
  created_at timestamptz not null default now()
);

-- 4. 新手任务进度表
create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  quest_key text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  unique(user_id, quest_key)
);

-- 索引
create index if not exists idx_holdings_user on holdings(user_id);
create index if not exists idx_transactions_user on transactions(user_id, created_at desc);
create index if not exists idx_quests_user on quests(user_id);

-- RLS（行级安全，每个用户只能访问自己的数据）
alter table portfolios enable row level security;
alter table holdings enable row level security;
alter table transactions enable row level security;
alter table quests enable row level security;

create policy "Users manage own portfolio" on portfolios for all using (auth.uid() = user_id);
create policy "Users manage own holdings" on holdings for all using (auth.uid() = user_id);
create policy "Users manage own transactions" on transactions for all using (auth.uid() = user_id);
create policy "Users manage own quests" on quests for all using (auth.uid() = user_id);
