// Supabase客户端配置
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://apgzgtfxkkzygkkmsywg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZ3pndGZ4a2t6eWdra21zeXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODI5ODcsImV4cCI6MjA3NzM1ODk4N30.bmT1FAUxQ0VPTVUvdxsZ-n7m-oiXmYjhoQyam9TO78U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 默认词汇集合ID
export const DEFAULT_COLLECTION_ID = '11111111-1111-1111-1111-111111111111'
