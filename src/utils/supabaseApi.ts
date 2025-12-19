// Supabase API实现
import { supabase } from '../lib/supabase'
import { DEFAULT_COLLECTION_ID, GAME_CONFIG } from '../lib/config'
import { ApiResponse, WordApiResponse, WordAPI, WordCollection } from './api'
import { Game } from '../types'

// 注意：游戏常量现在从 lib/config.ts 导入
// TOTAL_QUESTIONS 已不再用于 getWords 方法，保留用于其他功能
const TOTAL_QUESTIONS = GAME_CONFIG.TOTAL_QUESTIONS;

// 类型转换：Supabase数据 → 前端数据格式
function transformWord(dbWord: any): any {
  return {
    id: dbWord.id,
    word: dbWord.word,
    definition: dbWord.definition,
    audioText: dbWord.audio_text,
    difficulty: dbWord.difficulty,
    options: dbWord.options,
    answer: dbWord.answer,
    hint: dbWord.hint,
    word_order: dbWord.word_order,
    created_at: dbWord.created_at
  }
}

// 类型转换：教材数据
function transformCollection(dbCollection: any): WordCollection {
  return {
    id: dbCollection.id,
    name: dbCollection.name,
    description: dbCollection.description,
    category: dbCollection.category,
    textbook_type: dbCollection.textbook_type,
    grade_level: dbCollection.grade_level,
    theme: dbCollection.theme,
    is_public: dbCollection.is_public,
    word_count: dbCollection.word_count,
    created_at: dbCollection.created_at
  }
}

// Supabase Word API 实现
export class SupabaseWordAPI implements WordAPI {
  // 获取教材列表 (可选: 按游戏ID过滤)
  async getCollections(gameId?: string): Promise<ApiResponse<WordCollection[]>> {
    try {
      let query = supabase
        .from('word_collections')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (gameId) {
        query = query.eq('game_id', gameId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase getCollections error:', error)
        return {
          success: false,
          error: `获取教材列表失败: ${error.message}`
        }
      }

      const collections = (data || []).map(transformCollection)

      return {
        success: true,
        data: collections,
        message: `获取到${collections.length}个教材`
      }
    } catch (error) {
      console.error('Unexpected error in getCollections:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 获取游戏列表
  async getGames(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase getGames error:', error)
        return {
          success: false,
          error: `获取游戏列表失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: data || [],
        message: `获取到${(data || []).length}个游戏`
      }
    } catch (error) {
      console.error('Unexpected error in getGames:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 创建游戏
  async createGame(game: Omit<Game, 'id' | 'created_at'>): Promise<ApiResponse<Game>> {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert(game)
        .select()
        .single()

      if (error) {
        console.error('Supabase createGame error:', error)
        return {
          success: false,
          error: `创建游戏失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: data,
        message: '创建游戏成功'
      }
    } catch (error) {
      console.error('Unexpected error in createGame:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 更新游戏
  async updateGame(id: string, game: Partial<Game>): Promise<ApiResponse<Game>> {
    try {
      const { data, error } = await supabase
        .from('games')
        .update(game)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase updateGame error:', error)
        return {
          success: false,
          error: `更新游戏失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: data,
        message: '更新游戏成功'
      }
    } catch (error) {
      console.error('Unexpected error in updateGame:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  } // <-- Added missing brace here
  // 删除游戏
  async deleteGame(id: string): Promise<ApiResponse<void>> {
    try {
      // 检查是否有教材关联
      const { data: collections, error: checkError } = await supabase
        .from('word_collections')
        .select('id')
        .eq('game_id', id)
        .limit(1)

      if (checkError) {
        console.error('Supabase check collections error:', checkError)
        return {
          success: false,
          error: `检查游戏关联教材失败: ${checkError.message}`
        }
      }

      if (collections && collections.length > 0) {
        return {
          success: false,
          error: '该游戏下还有教材，请先删除所有教材'
        }
      }

      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase deleteGame error:', error)
        return {
          success: false,
          error: `删除游戏失败: ${error.message}`
        }
      }

      return {
        success: true,
        message: '删除游戏成功'
      }
    } catch (error) {
      console.error('Unexpected error in deleteGame:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }


  // 获取指定教材信息
  async getCollectionById(collectionId: string): Promise<ApiResponse<WordCollection>> {
    try {
      const { data, error } = await supabase
        .from('word_collections')
        .select('*')
        .eq('id', collectionId)
        .maybeSingle()

      if (error) {
        console.error('Supabase getCollectionById error:', error)
        return {
          success: false,
          error: `获取教材信息失败: ${error.message}`
        }
      }

      if (!data) {
        return {
          success: false,
          error: `未找到ID为${collectionId}的教材`
        }
      }

      return {
        success: true,
        data: transformCollection(data),
        message: '获取教材成功'
      }
    } catch (error) {
      console.error('Unexpected error in getCollectionById:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 获取单词列表 - 专为数据管理页面设计的简化版本
   * 
   * @param filters 过滤和排序选项
   * @param filters.collectionId 教材集合ID，默认使用DEFAULT_COLLECTION_ID
   * @param filters.limit 每页数量，默认20，范围1-1000
   * @param filters.offset 偏移量，默认0，用于分页
   * @param filters.sortBy 排序字段，'word'、'created_at'或'word_order'，默认'word'
   * @param filters.sortOrder 排序方向，'asc'或'desc'，默认'asc'
   * @returns Promise<WordApiResponse> 包含单词列表的响应
   * 
   * @example
   * // 获取第一页单词，按字母升序排列
   * const response = await getWords({ collectionId: 'abc123', limit: 20, offset: 0 });
   * 
   * // 获取按创建时间降序排列的单词
   * const response = await getWords({ 
   *   collectionId: 'abc123', 
   *   sortBy: 'created_at', 
   *   sortOrder: 'desc' 
   * });
   * 
   * // 获取按序号升序排列的单词
   * const response = await getWords({ 
   *   collectionId: 'abc123', 
   *   sortBy: 'word_order', 
   *   sortOrder: 'asc' 
   * });
   */
  async getWords(filters?: {
    limit?: number;
    offset?: number;
    collectionId?: string;
    sortBy?: 'word' | 'created_at' | 'word_order';
    sortOrder?: 'asc' | 'desc';
  }): Promise<WordApiResponse> {
    try {
      // 参数验证
      if (filters?.sortBy && !['word', 'created_at', 'word_order'].includes(filters.sortBy)) {
        return {
          success: false,
          error: 'sortBy参数必须是 "word"、"created_at" 或 "word_order"'
        }
      }

      if (filters?.sortOrder && !['asc', 'desc'].includes(filters.sortOrder)) {
        return {
          success: false,
          error: 'sortOrder参数必须是 "asc" 或 "desc"'
        }
      }

      if (filters?.limit !== undefined && (filters.limit < 1 || filters.limit > 1000)) {
        return {
          success: false,
          error: 'limit参数必须在1-1000之间'
        }
      }

      if (filters?.offset !== undefined && filters.offset < 0) {
        return {
          success: false,
          error: 'offset参数不能为负数'
        }
      }

      // 使用指定的collectionId或默认ID
      const collectionId = filters?.collectionId || DEFAULT_COLLECTION_ID

      console.log('[SupabaseAPI] getWords called with filters:', filters)

      // 构建查询
      let query = supabase
        .from('words')
        .select('*')
        .eq('collection_id', collectionId)

      // 排序逻辑
      const sortBy = filters?.sortBy || 'word'
      const sortOrder = filters?.sortOrder || 'asc'
      const ascending = sortOrder === 'asc'

      if (sortBy === 'word_order') {
        // 对于word_order排序，需要特殊处理null值
        // 使用nullsLast确保null值排在最后
        query = query.order(sortBy, { ascending, nullsFirst: false })
      } else {
        query = query.order(sortBy, { ascending })
      }

      // 分页逻辑
      const limit = filters?.limit || 20 // 默认每页20条
      if (filters?.offset !== undefined && filters.offset > 0) {
        // 使用offset分页：从offset位置开始，取limit个
        query = query.range(filters.offset, filters.offset + limit - 1)
      } else {
        // 使用limit：从第0个开始，取limit个
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase getWords error:', error)
        return {
          success: false,
          error: `获取单词失败: ${error.message}`
        }
      }

      // 转换数据格式
      const words = (data || []).map(transformWord)

      console.log('[SupabaseAPI] Returning words:', { count: words.length, sortBy, sortOrder })

      return {
        success: true,
        data: words,
        message: `获取到${words.length}个单词`
      }
    } catch (error) {
      console.error('Unexpected error in getWords:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  async getWordById(id: number): Promise<WordApiResponse> {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('Supabase getWordById error:', error)
        return {
          success: false,
          error: `获取单词失败: ${error.message}`
        }
      }

      if (!data) {
        return {
          success: false,
          error: `未找到ID为${id}的单词`
        }
      }

      return {
        success: true,
        data: transformWord(data),
        message: '获取单词成功'
      }
    } catch (error) {
      console.error('Unexpected error in getWordById:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  async addWord(word: any): Promise<WordApiResponse> {
    try {
      // 转换为数据库格式
      const dbWord = {
        collection_id: word.collectionId || DEFAULT_COLLECTION_ID,
        word: word.word,
        definition: word.definition,
        audio_text: word.audioText || word.definition,
        difficulty: word.difficulty || 'easy', // 默认为easy
        options: word.options,
        answer: word.answer,
        hint: word.hint || '',
        word_order: word.order || 0
      }

      const { data, error } = await supabase
        .from('words')
        .insert(dbWord)
        .select()
        .single()

      if (error) {
        console.error('Supabase addWord error:', error)
        return {
          success: false,
          error: `添加单词失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: transformWord(data),
        message: '添加单词成功'
      }
    } catch (error) {
      console.error('Unexpected error in addWord:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 批量添加词汇
  async batchAddWords(words: any[]): Promise<ApiResponse<{ count: number; errors?: { word: string; error: string }[] }>> {
    try {
      // 转换为数据库格式
      const dbWords = words.map(word => ({
        collection_id: word.collectionId || DEFAULT_COLLECTION_ID,
        word: word.word,
        definition: word.definition,
        audio_text: word.audioText || word.definition,
        difficulty: word.difficulty || 'easy', // 默认为easy
        options: word.options,
        answer: word.answer,
        hint: word.hint || '',
        word_order: word.order || 0
      }))

      const { data, error } = await supabase
        .from('words')
        .insert(dbWords)
        .select()

      if (error) {
        console.error('Supabase batchAddWords error:', error)
        return {
          success: false,
          error: `批量添加单词失败: ${error.message}`
        }
      }

      // 检查是否有部分失败（Supabase在某些情况下可能不会返回error，但返回的数据少于预期）
      const successCount = data?.length || 0
      const expectedCount = words.length
      const errors = successCount < expectedCount
        ? words.slice(successCount).map(word => ({
          word: word.word,
          error: '插入失败（可能因为重复或其他约束）'
        }))
        : []

      return {
        success: true,
        data: { count: successCount, errors },
        message: `成功添加${successCount}个单词${errors.length > 0 ? `，${errors.length}个失败` : ''}`
      }
    } catch (error) {
      console.error('Unexpected error in batchAddWords:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  async updateWord(id: number, word: any): Promise<WordApiResponse> {
    try {
      // 转换为数据库格式
      const dbWord = {
        word: word.word,
        definition: word.definition,
        audio_text: word.audioText || word.definition,
        difficulty: word.difficulty,
        options: word.options,
        answer: word.answer,
        hint: word.hint || ''
      }

      const { data, error } = await supabase
        .from('words')
        .update(dbWord)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase updateWord error:', error)
        return {
          success: false,
          error: `更新单词失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: transformWord(data),
        message: '更新单词成功'
      }
    } catch (error) {
      console.error('Unexpected error in updateWord:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  async deleteWord(id: number): Promise<WordApiResponse> {
    try {
      const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase deleteWord error:', error)
        return {
          success: false,
          error: `删除单词失败: ${error.message}`
        }
      }

      return {
        success: true,
        message: '删除单词成功'
      }
    } catch (error) {
      console.error('Unexpected error in deleteWord:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 批量删除词汇
  async batchDeleteWords(ids: number[]): Promise<ApiResponse<{ count: number }>> {
    try {
      const { error, count } = await supabase
        .from('words')
        .delete()
        .in('id', ids)

      if (error) {
        console.error('Supabase batchDeleteWords error:', error)
        return {
          success: false,
          error: `批量删除词汇失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: { count: count || 0 },
        message: `成功删除${count || 0}个词汇`
      }
    } catch (error) {
      console.error('Unexpected error in batchDeleteWords:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 创建教材
  async createCollection(collectionData: {
    name: string;
    description?: string;
    category?: string;
    textbook_type?: string;
    grade_level?: string;
    theme?: string;
    is_public?: boolean;
    game_id?: string; // Added game_id
  }): Promise<ApiResponse<WordCollection>> {
    try {
      // 为匿名用户设置一个固定的UUID作为created_by
      const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase
        .from('word_collections')
        .insert({
          name: collectionData.name,
          description: collectionData.description || null,
          category: collectionData.category || 'textbook',
          textbook_type: collectionData.textbook_type || null,
          grade_level: collectionData.grade_level || null,
          theme: collectionData.theme || null,
          is_public: collectionData.is_public !== undefined ? collectionData.is_public : true,
          word_count: 0,
          created_by: ANONYMOUS_USER_ID,
          game_id: collectionData.game_id || null // Added game_id
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase createCollection error:', error)
        return {
          success: false,
          error: `创建教材失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: transformCollection(data),
        message: '创建教材成功'
      }
    } catch (error) {
      console.error('Unexpected error in createCollection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 更新教材
  async updateCollection(id: string, collectionData: {
    name?: string;
    description?: string;
    category?: string;
    textbook_type?: string;
    grade_level?: string;
    theme?: string;
    is_public?: boolean;
    game_id?: string;
  }): Promise<ApiResponse<WordCollection>> {
    try {
      const updateData: any = {}
      if (collectionData.name !== undefined) updateData.name = collectionData.name
      if (collectionData.description !== undefined) updateData.description = collectionData.description
      if (collectionData.category !== undefined) updateData.category = collectionData.category
      if (collectionData.textbook_type !== undefined) updateData.textbook_type = collectionData.textbook_type
      if (collectionData.grade_level !== undefined) updateData.grade_level = collectionData.grade_level
      if (collectionData.theme !== undefined) updateData.theme = collectionData.theme
      if (collectionData.is_public !== undefined) updateData.is_public = collectionData.is_public
      if (collectionData.game_id !== undefined) updateData.game_id = collectionData.game_id

      const { data, error } = await supabase
        .from('word_collections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase updateCollection error:', error)
        return {
          success: false,
          error: `更新教材失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: transformCollection(data),
        message: '更新教材成功'
      }
    } catch (error) {
      console.error('Unexpected error in updateCollection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 删除教材
  async deleteCollection(id: string): Promise<ApiResponse<void>> {
    try {
      // 先检查是否有词汇
      const { data: words, error: checkError } = await supabase
        .from('words')
        .select('id')
        .eq('collection_id', id)
        .limit(1)

      if (checkError) {
        console.error('Supabase check words error:', checkError)
        return {
          success: false,
          error: `检查教材词汇失败: ${checkError.message}`
        }
      }

      if (words && words.length > 0) {
        return {
          success: false,
          error: '该教材下还有词汇，请先删除所有词汇'
        }
      }

      // 删除教材
      const { error } = await supabase
        .from('word_collections')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase deleteCollection error:', error)
        return {
          success: false,
          error: `删除教材失败: ${error.message}`
        }
      }

      return {
        success: true,
        message: '删除教材成功'
      }
    } catch (error) {
      console.error('Unexpected error in deleteCollection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  async validateAnswer(wordId: number, answer: string): Promise<ApiResponse<{
    correct: boolean;
    message: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('answer')
        .eq('id', wordId)
        .maybeSingle()

      if (error) {
        console.error('Supabase validateAnswer error:', error)
        return {
          success: false,
          error: `验证答案失败: ${error.message}`
        }
      }

      if (!data) {
        return {
          success: false,
          error: `未找到ID为${wordId}的单词`
        }
      }

      const isCorrect = answer.toLowerCase().trim() === data.answer.toLowerCase().trim()

      return {
        success: true,
        data: {
          correct: isCorrect,
          message: isCorrect ? '回答正确！' : '回答错误，再试一次吧！'
        }
      }
    } catch (error) {
      console.error('Unexpected error in validateAnswer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  async getStudySession(params: {
    collectionId: string;
    sessionSize: number;
    studyMode: 'sequential' | 'random';
  }): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase.rpc('get_my_study_session', {
        p_collection_id: params.collectionId,
        p_session_size: params.sessionSize,
        p_study_mode: params.studyMode,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      const words = (data || []).map(transformWord)
      return { success: true, data: words }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }

  async recordSessionResults(results: Array<{ word_id: string; is_correct: boolean }>): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc('record_session_results', {
        p_session_results: results,
      })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }

  async getCollectionProgress(collectionId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('get_collection_progress', {
        p_collection_id: collectionId,
      })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }

  async resetCollectionProgress(collectionId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc('reset_collection_progress', {
        p_collection_id: collectionId,
      })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }

  // 获取首页数据 - 包含游戏信息、当前教材和学习进度
  async getHomepageData(): Promise<ApiResponse<any[]>> { // Keeping return type generic or adjust to HomepageGameGroup[] but allowing any[] for now to avoid strict type breaking if I missed something, actually better be strict if I imported the type.
    try {
      const { data, error } = await supabase.rpc('get_homepage_data_v2')

      if (error) {
        console.error('Supabase getHomepageData error:', error)
        return {
          success: false,
          error: `获取首页数据失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: data || [],
        message: `获取到${(data || []).length}个分组的首页数据`
      }
    } catch (error) {
      console.error('Unexpected error in getHomepageData:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 获取体验模式数据
  async getTrialGameData(): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('get_trial_game_data')

      if (error) {
        console.error('Supabase getTrialGameData error:', error)
        return {
          success: false,
          error: `获取试炼数据失败: ${error.message}`
        }
      }

      return {
        success: true,
        data: data || {},
        message: '获取试炼数据成功'
      }
    } catch (error) {
      console.error('Unexpected error in getTrialGameData:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
}
