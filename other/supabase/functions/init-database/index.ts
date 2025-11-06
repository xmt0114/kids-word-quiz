// Supabase数据初始化Edge Function
// 用于创建管理员账号和导入示例数据

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    // 这里需要使用SERVICE_ROLE_KEY来绕过RLS
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (action === 'create_admin') {
      // 创建管理员账号逻辑
      // TODO: 实现管理员创建
    }
    
    if (action === 'import_words') {
      // 导入示例单词数据
      // TODO: 实现数据导入
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Initialization completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
