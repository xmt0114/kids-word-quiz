// 数据迁移Edge Function
// 将words.json数据导入Supabase数据库

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
    // 使用Service Role Key绕过RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 默认词汇集合ID
    const collectionId = '11111111-1111-1111-1111-111111111111'

    // 检查集合是否存在
    const { data: existingCollection } = await supabase
      .from('word_collections')
      .select('id')
      .eq('id', collectionId)
      .maybeSingle()

    if (!existingCollection) {
      // 创建默认词汇集合
      const { error: collError } = await supabase
        .from('word_collections')
        .insert({
          id: collectionId,
          name: '儿童基础词汇',
          description: '适合儿童学习的基础英语单词，包含日常生活常见词汇',
          category: 'custom',
          grade_level: '3-6',
          is_public: true,
          created_by: '00000000-0000-0000-0000-000000000000',
          word_count: 10
        })

      if (collError) {
        console.error('Error creating collection:', collError)
      }
    }

    // 10个单词数据
    const words = [
      {
        word: 'brother',
        definition: 'This boy or man has the same mother and father as you.',
        audio_text: 'He is a boy. His mother is your mother.',
        difficulty: 'easy',
        options: ['sister', 'brother', 'father', 'uncle'],
        answer: 'brother',
        hint: 'B _ _ _ _ _ _',
        word_order: 1
      },
      {
        word: 'apple',
        definition: 'A round fruit that is usually red, green, or yellow.',
        audio_text: 'A round fruit that grows on trees. It is usually red, green, or yellow.',
        difficulty: 'easy',
        options: ['orange', 'banana', 'apple', 'grape'],
        answer: 'apple',
        hint: 'A _ _ _ _ _',
        word_order: 2
      },
      {
        word: 'elephant',
        definition: 'A very large gray animal with a long nose called a trunk.',
        audio_text: 'A very big gray animal. It has a long nose called a trunk.',
        difficulty: 'medium',
        options: ['elephant', 'giraffe', 'tiger', 'lion'],
        answer: 'elephant',
        hint: 'E _ _ _ _ _ _ _',
        word_order: 3
      },
      {
        word: 'butterfly',
        definition: 'A flying insect with colorful wings.',
        audio_text: 'A beautiful flying insect. It has colorful wings and flies from flower to flower.',
        difficulty: 'medium',
        options: ['bird', 'butterfly', 'bee', 'spider'],
        answer: 'butterfly',
        hint: 'B _ _ _ _ _ _ _',
        word_order: 4
      },
      {
        word: 'umbrella',
        definition: 'A thing you hold to keep dry when it rains.',
        audio_text: 'You hold this when it rains to stay dry. It opens up like a flower.',
        difficulty: 'easy',
        options: ['coat', 'hat', 'umbrella', 'shoes'],
        answer: 'umbrella',
        hint: 'U _ _ _ _ _ _ _',
        word_order: 5
      },
      {
        word: 'computer',
        definition: 'An electronic machine that can store and process information.',
        audio_text: 'An electronic machine. You can use it to work, play games, and watch videos.',
        difficulty: 'hard',
        options: ['television', 'computer', 'radio', 'telephone'],
        answer: 'computer',
        hint: 'C _ _ _ _ _ _ _',
        word_order: 6
      },
      {
        word: 'pizza',
        definition: 'A round food made with bread, cheese, and tomato sauce.',
        audio_text: 'A delicious round food. It has bread, melted cheese, and tomato sauce on top.',
        difficulty: 'easy',
        options: ['cake', 'pizza', 'bread', 'sandwich'],
        answer: 'pizza',
        hint: 'P _ _ _ _',
        word_order: 7
      },
      {
        word: 'rainbow',
        definition: 'A colorful arc that appears in the sky after rain.',
        audio_text: 'A beautiful colorful arc. You can see it in the sky when the sun comes out after rain.',
        difficulty: 'medium',
        options: ['cloud', 'rainbow', 'storm', 'wind'],
        answer: 'rainbow',
        hint: 'R _ _ _ _ _ _',
        word_order: 8
      },
      {
        word: 'dinosaur',
        definition: 'A very large animal that lived millions of years ago.',
        audio_text: 'A huge animal that lived long, long ago. Some were as big as a house!',
        difficulty: 'hard',
        options: ['dragon', 'dinosaur', 'monster', 'giant'],
        answer: 'dinosaur',
        hint: 'D _ _ _ _ _ _ _',
        word_order: 9
      },
      {
        word: 'flower',
        definition: 'A colorful part of a plant that smells nice.',
        audio_text: 'A pretty and colorful part of a plant. It smells very nice and bees like to visit it.',
        difficulty: 'easy',
        options: ['tree', 'grass', 'flower', 'leaf'],
        answer: 'flower',
        hint: 'F _ _ _ _ _',
        word_order: 10
      }
    ]

    // 为每个单词添加collection_id
    const wordsToInsert = words.map(word => ({
      ...word,
      collection_id: collectionId
    }))

    // 删除现有数据（如果有）
    await supabase
      .from('words')
      .delete()
      .eq('collection_id', collectionId)

    // 插入单词数据
    const { data: insertedWords, error: wordsError } = await supabase
      .from('words')
      .insert(wordsToInsert)
      .select()

    if (wordsError) {
      throw new Error(`Error inserting words: ${wordsError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '数据迁移成功',
        collection_id: collectionId,
        words_count: insertedWords?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Migration error:', error)
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
