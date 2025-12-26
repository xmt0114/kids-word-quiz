/**
 * Word Data Service
 * 词语数据服务 - 为未来API集成预留接口
 */

import type { MissingWord, WordDataSource, WordRequestParams } from '../types/missingWordsGame';
import { getRandomWords } from '../data/mockWords';

/**
 * Mock数据源实现
 * 当前使用本地Mock数据，未来可以替换为API调用
 */
class MockWordDataSource implements WordDataSource {
  async getWords(params: WordRequestParams): Promise<MissingWord[]> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    // 从Mock数据中获取词语
    const { count, language } = params;
    
    let words: MissingWord[];
    if (language === 'mixed') {
      words = getRandomWords(count);
    } else if (language === 'chinese' || language === 'english') {
      words = getRandomWords(count, language);
    } else {
      words = getRandomWords(count);
    }

    return words;
  }
}

/**
 * API数据源实现（未来使用）
 * 这是一个示例实现，展示如何集成真实的API
 */
class ApiWordDataSource implements WordDataSource {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getWords(params: WordRequestParams): Promise<MissingWord[]> {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams({
        count: params.count.toString(),
        ...(params.language && { language: params.language }),
        ...(params.difficulty && { difficulty: params.difficulty }),
        ...(params.category && { category: params.category }),
      });

      // 发送API请求
      const response = await fetch(
        `${this.apiBaseUrl}/words?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.words || [];
    } catch (error) {
      console.error('Failed to fetch words from API:', error);
      // 降级到Mock数据
      return new MockWordDataSource().getWords(params);
    }
  }
}

/**
 * 数据源工厂
 * 根据配置选择使用Mock数据还是API数据
 */
class WordDataSourceFactory {
  private static instance: WordDataSource | null = null;
  private static useApi: boolean = false;
  private static apiBaseUrl: string = '/api';

  /**
   * 配置数据源
   */
  static configure(options: { useApi?: boolean; apiBaseUrl?: string }) {
    if (options.useApi !== undefined) {
      this.useApi = options.useApi;
    }
    if (options.apiBaseUrl) {
      this.apiBaseUrl = options.apiBaseUrl;
    }
    // 重置实例，下次获取时会创建新的
    this.instance = null;
  }

  /**
   * 获取数据源实例
   */
  static getInstance(): WordDataSource {
    if (!this.instance) {
      this.instance = this.useApi
        ? new ApiWordDataSource(this.apiBaseUrl)
        : new MockWordDataSource();
    }
    return this.instance;
  }

  /**
   * 重置数据源（用于测试）
   */
  static reset() {
    this.instance = null;
    this.useApi = false;
    this.apiBaseUrl = '/api';
  }
}

/**
 * 获取词语数据的便捷函数
 */
export async function fetchWords(params: WordRequestParams): Promise<MissingWord[]> {
  const dataSource = WordDataSourceFactory.getInstance();
  return dataSource.getWords(params);
}

/**
 * 配置词语数据源
 */
export function configureWordDataSource(options: {
  useApi?: boolean;
  apiBaseUrl?: string;
}) {
  WordDataSourceFactory.configure(options);
}

/**
 * 导出数据源类（用于高级用法）
 */
export { MockWordDataSource, ApiWordDataSource, WordDataSourceFactory };

/**
 * 默认导出便捷函数
 */
export default {
  fetchWords,
  configure: configureWordDataSource,
};
