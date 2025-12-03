/**
 * **Feature: context-to-zustand-migration, Property 6: 配置获取一致性**
 * **Feature: context-to-zustand-migration, Property 7: 配置优先级正确性**
 * **Validates: Requirements 4.1, 4.5**
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { create } from 'zustand';

// Mock supabase to avoid import.meta issues in tests
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        data: [],
        error: null
      }))
    }))
  }
}));

import { createConfigSlice, ConfigSlice, AppConfig } from '../stores/slices/configSlice';

// 创建测试用的 store
const createTestStore = () => {
  return create<ConfigSlice>((set, get) => ({
    ...createConfigSlice(set, get)
  }));
};

// 生成器：创建有效的配置键
const configKeyArb = fc.oneof(
  fc.constant('app_settings'),
  fc.constant('default_stats'),
  fc.constant('game_constants'),
  fc.constant('default_collection_id'),
  fc.constant('tts_defaults'),
  fc.constant('supported_games'),
  fc.constant('guess_word_settings'),
  fc.constant('difficulty_levels'),
  fc.constant('question_types'),
  fc.constant('answer_types'),
  fc.constant('learning_strategies')
);

// 生成器：创建配置值
const configValueArb = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.array(fc.string()),
  fc.record({
    id: fc.string(),
    name: fc.string(),
    description: fc.string()
  })
);

// 生成器：创建配置对象
const configArb = fc.dictionary(configKeyArb, configValueArb);

describe('ConfigSlice Property Tests', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Property 6: 配置获取一致性', () => {
    it('对于任何配置数据需求，应该从配置slice获取而非其他来源', () => {
      fc.assert(
        fc.property(configKeyArb, configValueArb, (key, value) => {
          // 设置游客配置
          const guestConfig: AppConfig = { [key]: value };
          store.getState().setGuestConfig(guestConfig);

          // 获取配置应该返回设置的值
          const retrievedValue = store.getState().getConfig(key);
          
          // 配置获取应该一致
          expect(retrievedValue).toEqual(value);
        }),
        { numRuns: 100 }
      );
    });

    it('配置获取应该总是返回一致的结果', () => {
      fc.assert(
        fc.property(configArb, (config) => {
          // 设置配置
          store.getState().setGuestConfig(config);

          // 多次获取同一个配置项应该返回相同结果
          const keys = Object.keys(config);
          if (keys.length > 0) {
            const key = keys[0];
            const value1 = store.getState().getConfig(key);
            const value2 = store.getState().getConfig(key);
            
            expect(value1).toEqual(value2);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: 配置优先级正确性', () => {
    it('对于任何配置项，用户配置应该优先于游客配置，游客配置应该优先于内置默认值', () => {
      fc.assert(
        fc.property(
          configKeyArb,
          configValueArb,
          configValueArb,
          (key, guestValue, userValue) => {
            // 确保两个值不同，以便测试优先级
            if (guestValue === userValue) {
              return; // 跳过相同值的情况
            }

            // 清空配置开始测试
            store.getState().setGuestConfig(null);
            store.getState().setUserConfig(null);

            // 设置游客配置
            const guestConfig: AppConfig = { [key]: guestValue };
            store.getState().setGuestConfig(guestConfig);

            // 此时应该返回游客配置的值（如果没有内置默认值）或游客配置值
            let retrievedValue = store.getState().getConfig(key);
            expect(retrievedValue).toEqual(guestValue);

            // 设置用户配置
            const userConfig: AppConfig = { [key]: userValue };
            store.getState().setUserConfig(userConfig);

            // 此时应该返回用户配置的值（优先级更高）
            retrievedValue = store.getState().getConfig(key);
            expect(retrievedValue).toEqual(userValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('当用户配置为空时，应该回退到游客配置', () => {
      fc.assert(
        fc.property(configKeyArb, configValueArb, (key, guestValue) => {
          // 清空所有配置
          store.getState().setGuestConfig(null);
          store.getState().setUserConfig(null);

          // 设置游客配置
          const guestConfig: AppConfig = { [key]: guestValue };
          store.getState().setGuestConfig(guestConfig);

          // 确保用户配置为空
          store.getState().setUserConfig(null);

          // 应该返回游客配置的值
          const retrievedValue = store.getState().getConfig(key);
          expect(retrievedValue).toEqual(guestValue);
        }),
        { numRuns: 100 }
      );
    });

    it('当游客配置和用户配置都为空时，应该回退到内置默认值', () => {
      fc.assert(
        fc.property(configKeyArb, (key) => {
          // 清空所有配置
          store.getState().setGuestConfig(null);
          store.getState().setUserConfig(null);

          // 获取配置
          const retrievedValue = store.getState().getConfig(key);

          // 应该返回内置默认值（不应该是 undefined）
          // 对于已知的配置键，应该有内置默认值
          expect(retrievedValue).not.toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('配置类别一致性', () => {
    it('配置类别应该根据键名正确分类', () => {
      fc.assert(
        fc.property(configKeyArb, (key) => {
          const category = store.getState().getConfigCategory(key);
          
          // 验证类别是有效的
          expect(['app', 'games', 'universal', 'unknown']).toContain(category);
          
          // 验证特定键的类别
          if (['app_settings', 'default_stats', 'game_constants', 'default_collection_id', 'tts_defaults'].includes(key)) {
            expect(category).toBe('app');
          } else if (['supported_games', 'guess_word_settings'].includes(key)) {
            expect(category).toBe('games');
          } else if (['difficulty_levels', 'question_types', 'answer_types', 'learning_strategies'].includes(key)) {
            expect(category).toBe('universal');
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});