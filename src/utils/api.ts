// 后端API接口定义 - 预留接口
// 当需要集成真实后端时，可以直接使用这些接口

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WordApiResponse extends ApiResponse<any> {}

// 词汇集合（教材）类型
export interface WordCollection {
  id: string;
  name: string;
  description: string | null;
  category: string;
  textbook_type: string | null;
  grade_level: string | null;
  theme: string | null;
  is_public: boolean;
  word_count: number;
  created_at: string;
}

// API配置
export const API_CONFIG = {
  // 数据源配置：'local' 使用本地JSON，'supabase' 使用Supabase，'backend' 使用后端API
  DATA_SOURCE: 'supabase', // 使用Supabase后端

  // 后端API基础URL（当使用后端时）
  BASE_URL: import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',

  // API超时时间
  TIMEOUT: 10000,
};

// API接口定义
export interface WordAPI {
  getCollections?(): Promise<ApiResponse<WordCollection[]>>;
  getCollectionById?(collectionId: string): Promise<ApiResponse<WordCollection>>;
  
  getWords(filters?: {
    limit?: number;
    offset?: number;
    collectionId?: string;
    selectionStrategy?: 'sequential' | 'random';
    sortBy?: 'word' | 'created_at';
    sortOrder?: 'asc' | 'desc';
  }): Promise<WordApiResponse>;
  
  getWordById(id: number): Promise<WordApiResponse>;
  
  addWord(word: any): Promise<WordApiResponse>;

  batchAddWords?(words: any[]): Promise<ApiResponse<{ count: number }>>;

  updateWord(id: number, word: any): Promise<WordApiResponse>;

  deleteWord(id: number): Promise<WordApiResponse>;
  
  validateAnswer(wordId: number, answer: string): Promise<ApiResponse<{
    correct: boolean;
    message: string;
  }>>;
}

// 本地数据API实现
class LocalWordAPI implements WordAPI {
  private data: any = null;
  
  constructor() {
    this.loadData();
  }
  
  private async loadData() {
    try {
      const response = await fetch('/data/words.json');
      this.data = await response.json();
    } catch (error) {
      console.error('加载本地数据失败:', error);
      this.data = { words: [], questionTypes: [], answerTypes: [], difficultyLevels: [] };
    }
  }
  
  async getWords(filters?: {
    difficulty?: string;
    limit?: number;
    offset?: number;
  }): Promise<WordApiResponse> {
    await this.ensureDataLoaded();
    
    let words = [...this.data.words];
    
    if (filters?.difficulty) {
      words = words.filter((word: any) => word.difficulty === filters.difficulty);
    }
    
    if (filters?.offset) {
      words = words.slice(filters.offset);
    }
    
    if (filters?.limit) {
      words = words.slice(0, filters.limit);
    }
    
    return {
      success: true,
      data: words,
      message: `获取到${words.length}个单词`
    };
  }
  
  async getWordById(id: number): Promise<WordApiResponse> {
    await this.ensureDataLoaded();
    
    const word = this.data.words.find((w: any) => w.id === id);
    
    if (!word) {
      return {
        success: false,
        error: `未找到ID为${id}的单词`
      };
    }
    
    return {
      success: true,
      data: word,
      message: '获取单词成功'
    };
  }
  
  async addWord(word: any): Promise<WordApiResponse> {
    await this.ensureDataLoaded();
    
    // 设置音频文本默认值：默认与定义相同
    const wordWithDefaults = {
      ...word,
      audioText: word.audioText || word.definition
    };
    
    // 验证数据
    const errors = this.validateWord(wordWithDefaults);
    if (errors.length > 0) {
      return {
        success: false,
        error: `数据验证失败: ${errors.join(', ')}`
      };
    }
    
    // 添加新单词
    const newWord = {
      ...wordWithDefaults,
      id: Math.max(...this.data.words.map((w: any) => w.id)) + 1
    };
    
    this.data.words.push(newWord);
    
    // TODO: 在真实后端中，这里应该保存到数据库
    // 在本地模式下，数据只在内存中，重启后会丢失
    
    return {
      success: true,
      data: newWord,
      message: '添加单词成功'
    };
  }
  
  async updateWord(id: number, word: any): Promise<WordApiResponse> {
    await this.ensureDataLoaded();
    
    const index = this.data.words.findIndex((w: any) => w.id === id);
    
    if (index === -1) {
      return {
        success: false,
        error: `未找到ID为${id}的单词`
      };
    }
    
    // 设置音频文本默认值：默认与定义相同
    const wordWithDefaults = {
      ...word,
      audioText: word.audioText || word.definition
    };
    
    // 验证数据
    const errors = this.validateWord({ ...wordWithDefaults, id });
    if (errors.length > 0) {
      return {
        success: false,
        error: `数据验证失败: ${errors.join(', ')}`
      };
    }
    
    this.data.words[index] = { ...wordWithDefaults, id };
    
    return {
      success: true,
      data: this.data.words[index],
      message: '更新单词成功'
    };
  }
  
  async deleteWord(id: number): Promise<WordApiResponse> {
    await this.ensureDataLoaded();
    
    const index = this.data.words.findIndex((w: any) => w.id === id);
    
    if (index === -1) {
      return {
        success: false,
        error: `未找到ID为${id}的单词`
      };
    }
    
    this.data.words.splice(index, 1);
    
    return {
      success: true,
      message: '删除单词成功'
    };
  }
  
  async validateAnswer(wordId: number, answer: string): Promise<ApiResponse<{
    correct: boolean;
    message: string;
  }>> {
    await this.ensureDataLoaded();
    
    const word = this.data.words.find((w: any) => w.id === wordId);
    
    if (!word) {
      return {
        success: false,
        error: `未找到ID为${wordId}的单词`
      };
    }
    
    const isCorrect = answer.toLowerCase().trim() === word.answer.toLowerCase().trim();
    
    return {
      success: true,
      data: {
        correct: isCorrect,
        message: isCorrect ? '回答正确！' : '回答错误，再试一次吧！'
      }
    };
  }
  
  private async ensureDataLoaded() {
    if (!this.data) {
      await this.loadData();
    }
  }
  
  private validateWord(word: any): string[] {
    const errors: string[] = [];
    
    if (!word.word) errors.push('单词不能为空');
    if (!word.definition) errors.push('定义不能为空');
    if (!['easy', 'medium', 'hard'].includes(word.difficulty)) {
      errors.push('难度必须是 easy、medium 或 hard');
    }
    if (!Array.isArray(word.options) || word.options.length < 3) {
      errors.push('选项必须至少包含3个');
    }
    if (!word.answer) errors.push('答案不能为空');
    if (word.options && !word.options.includes(word.answer)) {
      errors.push('答案必须在选项列表中');
    }
    
    return errors;
  }
}

// 后端API实现（预留）
class BackendWordAPI implements WordAPI {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async getWords(filters?: {
    difficulty?: string;
    limit?: number;
    offset?: number;
  }): Promise<WordApiResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const response = await fetch(`${this.baseURL}/words?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '获取单词失败');
      }
      
      return {
        success: true,
        data: data.words,
        message: `获取到${data.words.length}个单词`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }
  
  async getWordById(id: number): Promise<WordApiResponse> {
    try {
      const response = await fetch(`${this.baseURL}/words/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '获取单词失败');
      }
      
      return {
        success: true,
        data: data.word,
        message: '获取单词成功'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }
  
  async addWord(word: any): Promise<WordApiResponse> {
    try {
      const response = await fetch(`${this.baseURL}/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(word),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '添加单词失败');
      }
      
      return {
        success: true,
        data: data.word,
        message: '添加单词成功'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }
  
  async updateWord(id: number, word: any): Promise<WordApiResponse> {
    try {
      const response = await fetch(`${this.baseURL}/words/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(word),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '更新单词失败');
      }
      
      return {
        success: true,
        data: data.word,
        message: '更新单词成功'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }
  
  async deleteWord(id: number): Promise<WordApiResponse> {
    try {
      const response = await fetch(`${this.baseURL}/words/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '删除单词失败');
      }
      
      return {
        success: true,
        message: '删除单词成功'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }
  
  async validateAnswer(wordId: number, answer: string): Promise<ApiResponse<{
    correct: boolean;
    message: string;
  }>> {
    try {
      const response = await fetch(`${this.baseURL}/words/${wordId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '验证答案失败');
      }
      
      return {
        success: true,
        data: {
          correct: data.correct,
          message: data.message
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }
}

// 导出API实例
import { SupabaseWordAPI } from './supabaseApi';

export const wordAPI: WordAPI = API_CONFIG.DATA_SOURCE === 'supabase'
  ? new SupabaseWordAPI()
  : API_CONFIG.DATA_SOURCE === 'backend' 
    ? new BackendWordAPI(API_CONFIG.BASE_URL)
    : new LocalWordAPI();

// 导出API类（用于测试或自定义）
export { LocalWordAPI, BackendWordAPI };