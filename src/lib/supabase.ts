// Supabase客户端配置
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_COLLECTION_ID } from './config'

// 从环境变量获取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 验证环境变量是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 重新导出默认配置（兼容旧代码）
export { DEFAULT_COLLECTION_ID } from './config';

// 注意：默认配置现在从 config.ts 导入
// 实际运行时建议使用 useAppConfig hook 从数据库动态加载
