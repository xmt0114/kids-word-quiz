// 获取单词数据的Edge Function
// 替代原来的JSON文件读取

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url)
    const difficulty = url.searchParams.get('difficulty')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const collectionId = url.searchParams.get('collection_id') || '11111111-1111-1111-1111-111111111111'

    // 使用Anon Key（前端也可以直接调用）
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 构建查询
    let query = supabase
      .from('words')
      .select('*')
      .eq('collection_id', collectionId)
      .order('word_order', { ascending: true })

    // 如果指定了难度，添加过滤
    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty)
    }

    // 限制数量
    query = query.limit(limit)

    const { data: words, error } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // 如果没有数据，返回友好提示
    if (!words || words.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '未找到单词数据，请先运行数据迁移',
          data: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: words,
        count: words.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching words:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
