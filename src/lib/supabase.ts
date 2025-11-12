// Supabase客户端配置
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_COLLECTION_ID } from './config'

const supabaseUrl = 'https://apgzgtfxkkzygkkmsywg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZ3pndGZ4a2t6eWdra21zeXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODI5ODcsImV4cCI6MjA3NzM1ODk4N30.bmT1FAUxQ0VPTVUvdxsZ-n7m-oiXmYjhoQyam9TO78U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 重新导出默认配置（兼容旧代码）
export { DEFAULT_COLLECTION_ID } from './config';

// 注意：默认配置现在从 config.ts 导入
// 实际运行时建议使用 useAppConfig hook 从数据库动态加载
