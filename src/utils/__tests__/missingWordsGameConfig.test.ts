/**
 * Property Tests for Missing Words Game Configuration
 * Feature: missing-words-game, Property 2: Configuration Boundary Validation
 * Validates: Requirements 2.3, 2.4, 2.5
 * 
 * 配置管理属性测试
 * 验证配置边界值和默认值的正确性
 */

import type { GameConfig } from '../../types/missingWordsGame';
import { DEFAULT_GAME_CONFIG } from '../../types/missingWordsGame';
import {
  validateGameConfig,
  loadConfig,
  saveConfig,
  clearConfig,
  applyConfigConstraints,
  mergeConfig,
} from '../missingWordsGameConfig';

/**
 * 测试辅助函数：生成随机配置
 */
function generateRandomConfig(): GameConfig {
  return {
    gameMode: Math.random() > 0.5 ? 'casual' : 'challenge',
    wordCount: Math.floor(Math.random() * 10) + 1, // 1-10
    hiddenCount: Math.floor(Math.random() * 5) + 1, // 1-5
    observationTime: Math.floor(Math.random() * 15) + 1, // 1-15
  };
}

/**
 * 测试辅助函数：生成有效配置
 */
function generateValidConfig(): GameConfig {
  const wordCount = Math.floor(Math.random() * 6) + 3; // 3-8
  const hiddenCount = Math.min(
    Math.floor(Math.random() * 3) + 1, // 1-3
    wordCount
  );
  
  return {
    gameMode: Math.random() > 0.5 ? 'casual' : 'challenge',
    wordCount,
    hiddenCount,
    observationTime: Math.floor(Math.random() * 8) + 3, // 3-10
  };
}

/**
 * Property 2: Configuration Boundary Validation
 * 
 * 对于任何游戏配置输入，系统应该强制执行有效范围
 * (n: 3-8, k: 1-3, t: 3-10) 并应用正确的默认值 (n=4, k=1, t=5)
 */
export function runConfigurationBoundaryTests(): void {
  console.log('\n=== Property 2: Configuration Boundary Validation ===\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: 默认配置应该有效
  console.log('Test 1: 默认配置验证');
  try {
    const validation = validateGameConfig(DEFAULT_GAME_CONFIG);
    if (validation.isValid) {
      console.log('✓ 默认配置有效');
      console.log(`  wordCount: ${DEFAULT_GAME_CONFIG.wordCount} (expected: 4)`);
      console.log(`  hiddenCount: ${DEFAULT_GAME_CONFIG.hiddenCount} (expected: 1)`);
      console.log(`  observationTime: ${DEFAULT_GAME_CONFIG.observationTime} (expected: 5)`);
      passedTests++;
    } else {
      console.log('✗ 默认配置无效:', validation.errors);
      failedTests++;
    }
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // Test 2: 边界值测试 - 最小值
  console.log('\nTest 2: 最小边界值验证');
  try {
    const minConfig: GameConfig = {
      gameMode: 'casual',
      wordCount: 3,
      hiddenCount: 1,
      observationTime: 3,
    };
    const validation = validateGameConfig(minConfig);
    if (validation.isValid) {
      console.log('✓ 最小边界值配置有效');
      passedTests++;
    } else {
      console.log('✗ 最小边界值配置无效:', validation.errors);
      failedTests++;
    }
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // Test 3: 边界值测试 - 最大值
  console.log('\nTest 3: 最大边界值验证');
  try {
    const maxConfig: GameConfig = {
      gameMode: 'challenge',
      wordCount: 8,
      hiddenCount: 3,
      observationTime: 10,
    };
    const validation = validateGameConfig(maxConfig);
    if (validation.isValid) {
      console.log('✓ 最大边界值配置有效');
      passedTests++;
    } else {
      console.log('✗ 最大边界值配置无效:', validation.errors);
      failedTests++;
    }
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // Test 4: 超出范围的值应该被拒绝
  console.log('\nTest 4: 超出范围值验证');
  try {
    const invalidConfigs = [
      { ...DEFAULT_GAME_CONFIG, wordCount: 2 }, // 太小
      { ...DEFAULT_GAME_CONFIG, wordCount: 9 }, // 太大
      { ...DEFAULT_GAME_CONFIG, hiddenCount: 0 }, // 太小
      { ...DEFAULT_GAME_CONFIG, hiddenCount: 4 }, // 太大
      { ...DEFAULT_GAME_CONFIG, observationTime: 2 }, // 太小
      { ...DEFAULT_GAME_CONFIG, observationTime: 11 }, // 太大
    ];

    let allInvalid = true;
    for (const config of invalidConfigs) {
      const validation = validateGameConfig(config);
      if (validation.isValid) {
        console.log('✗ 应该无效的配置被认为有效:', config);
        allInvalid = false;
      }
    }

    if (allInvalid) {
      console.log('✓ 所有超出范围的值都被正确拒绝');
      passedTests++;
    } else {
      failedTests++;
    }
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // Test 5: hiddenCount不能大于wordCount
  console.log('\nTest 5: hiddenCount <= wordCount 验证');
  try {
    const invalidConfig: GameConfig = {
      gameMode: 'casual',
      wordCount: 3,
      hiddenCount: 4, // 大于wordCount
      observationTime: 5,
    };
    const validation = validateGameConfig(invalidConfig);
    if (!validation.isValid && validation.errors.some(e => e.includes('不能大于'))) {
      console.log('✓ 正确拒绝 hiddenCount > wordCount 的配置');
      passedTests++;
    } else {
      console.log('✗ 未能正确拒绝 hiddenCount > wordCount 的配置');
      failedTests++;
    }
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // Test 6: 约束应用测试
  console.log('\nTest 6: 配置约束应用验证');
  try {
    const outOfRangeConfig = {
      wordCount: 15, // 超出范围
      hiddenCount: 10, // 超出范围
      observationTime: 20, // 超出范围
    };
    const constrained = applyConfigConstraints(outOfRangeConfig);
    
    if (
      constrained.wordCount! <= 8 &&
      constrained.hiddenCount! <= 3 &&
      constrained.observationTime! <= 10
    ) {
      console.log('✓ 配置约束正确应用');
      console.log(`  wordCount: ${outOfRangeConfig.wordCount} -> ${constrained.wordCount}`);
      console.log(`  hiddenCount: ${outOfRangeConfig.hiddenCount} -> ${constrained.hiddenCount}`);
      console.log(`  observationTime: ${outOfRangeConfig.observationTime} -> ${constrained.observationTime}`);
      passedTests++;
    } else {
      console.log('✗ 配置约束未正确应用');
      failedTests++;
    }
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // Test 7: 配置保存和加载
  console.log('\nTest 7: 配置持久化验证');
  try {
    // 清除现有配置
    clearConfig();
    
    // 保存有效配置
    const testConfig = generateValidConfig();
    const saved = saveConfig(testConfig);
    
    if (!saved) {
      console.log('✗ 配置保存失败');
      failedTests++;
    } else {
      // 加载配置
      const loaded = loadConfig();
      
      if (
        loaded.gameMode === testConfig.gameMode &&
        loaded.wordCount === testConfig.wordCount &&
        loaded.hiddenCount === testConfig.hiddenCount &&
        loaded.observationTime === testConfig.observationTime
      ) {
        console.log('✓ 配置正确保存和加载');
        passedTests++;
      } else {
        console.log('✗ 加载的配置与保存的不匹配');
        console.log('  保存:', testConfig);
        console.log('  加载:', loaded);
        failedTests++;
      }
    }
    
    // 清理
    clearConfig();
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // Test 8: 随机配置验证（属性测试）
  console.log('\nTest 8: 随机配置属性测试 (100次迭代)');
  try {
    let validCount = 0;
    let invalidCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const randomConfig = generateRandomConfig();
      const validation = validateGameConfig(randomConfig);
      
      // 检查验证结果的一致性
      const isInRange = 
        randomConfig.wordCount >= 3 && randomConfig.wordCount <= 8 &&
        randomConfig.hiddenCount >= 1 && randomConfig.hiddenCount <= 3 &&
        randomConfig.observationTime >= 3 && randomConfig.observationTime <= 10 &&
        randomConfig.hiddenCount <= randomConfig.wordCount;

      if (validation.isValid === isInRange) {
        validCount++;
      } else {
        invalidCount++;
        if (invalidCount <= 3) { // 只显示前3个错误
          console.log(`  不一致: config=${JSON.stringify(randomConfig)}, isValid=${validation.isValid}, shouldBe=${isInRange}`);
        }
      }
    }

    if (invalidCount === 0) {
      console.log(`✓ 所有${iterations}次随机配置验证结果一致`);
      passedTests++;
    } else {
      console.log(`✗ ${invalidCount}/${iterations} 次验证结果不一致`);
      failedTests++;
    }
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // Test 9: 配置合并测试
  console.log('\nTest 9: 配置合并验证');
  try {
    const baseConfig = DEFAULT_GAME_CONFIG;
    const updates = { wordCount: 6 };
    const merged = mergeConfig(baseConfig, updates);
    
    if (
      merged.wordCount === 6 &&
      merged.gameMode === baseConfig.gameMode &&
      merged.hiddenCount === baseConfig.hiddenCount &&
      merged.observationTime === baseConfig.observationTime
    ) {
      console.log('✓ 配置正确合并');
      passedTests++;
    } else {
      console.log('✗ 配置合并失败');
      failedTests++;
    }
  } catch (error) {
    console.log('✗ 测试失败:', error);
    failedTests++;
  }

  // 总结
  console.log('\n=== 测试总结 ===');
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`总计: ${passedTests + failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n✓ 所有配置边界验证测试通过！');
  } else {
    console.log(`\n✗ ${failedTests} 个测试失败`);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runConfigurationBoundaryTests();
}
