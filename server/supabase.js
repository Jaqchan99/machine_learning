import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase = null

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  console.log('✅ Supabase 已连接')
} else {
  console.log('⚠️  未配置 Supabase，使用本地文件存储（重启可能丢失数据）')
}

export function isSupabaseEnabled() {
  return supabase !== null
}

export default supabase
