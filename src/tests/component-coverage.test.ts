/**
 * 属性测试：组件功能覆盖验证
 * 功能: guess-word-cleanup, 属性 4: 组件功能覆盖
 * 验证: 需求 3.2
 */

import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('组件功能覆盖验证', () => {
  const srcDir = path.join(__dirname, '../../');
  
  test('属性 4: 通用组件应该覆盖所有被移除组件的功能', () => {
    // 验证通用组件存在且功能完整
    const universalComponents = [
      {
        path: 'src/components/GameSettingsPage.tsx',
        requiredFeatures: [
          'useParams', // 支持动态gameId
          'gameId', // 获取游戏ID参数
          'useQuizSettings', // 设置管理
          'questionType', // 题目类型设置
          'answerType', // 答题方式设置
          'selectionStrategy', // 出题策略设置
          'tts', // 语音设置
          'textbook', // 教材选择
          'progress', // 学习进度
        ]
      },
      {
        path: 'src/components/UniversalGamePage.tsx',
        requiredFeatures: [
          'useParams', // 支持动态gameId
          'gameId', // 获取游戏ID参数
          'useQuiz', // 游戏逻辑
          'TextToSpeechButton', // 语音播放
          'PinyinText', // 拼音显示
          'AutoSizeText', // 自适应文本
          'OptionButton', // 选择题按钮
          'Input', // 填空题输入
          'ProgressBar', // 进度条
          'StarExplosion', // 特效
        ]
      },
      {
        path: 'src/components/UniversalResultPage.tsx',
        requiredFeatures: [
          'useParams', // 支持动态gameId
          'gameId', // 获取游戏ID参数
          'QuizResult', // 结果显示
          'accuracy', // 准确率
          'correctAnswers', // 正确答案数
          'totalQuestions', // 总题数
          'handleRestart', // 重新开始
          'handleContinueGame', // 继续游戏
        ]
      }
    ];

    universalComponents.forEach(component => {
      const filePath = path.join(srcDir, component.path);
      
      // 验证文件存在
      expect(fs.existsSync(filePath)).toBe(true);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`通用组件文件不存在: ${component.path}`);
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 验证必要功能存在
      component.requiredFeatures.forEach(feature => {
        const hasFeature = content.includes(feature);
        expect(hasFeature).toBe(true);
        
        if (!hasFeature) {
          throw new Error(`通用组件 ${component.path} 缺少必要功能: ${feature}`);
        }
      });
    });
  });

  test('属性 4.1: GameSettingsPage应该支持guess-word游戏', () => {
    const filePath = path.join(srcDir, 'src/components/GameSettingsPage.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 验证支持guess-word游戏的特定功能
    const guessWordFeatures = [
      'guess-word', // 游戏ID支持
      'useParams', // 动态参数支持
      'gameId', // 游戏ID参数
      'questionType', // 题目类型
      'answerType', // 答题方式
      'selectionStrategy', // 选择策略
      'tts', // 语音设置
    ];

    guessWordFeatures.forEach(feature => {
      const hasFeature = content.includes(feature);
      expect(hasFeature).toBe(true);
      
      if (!hasFeature) {
        throw new Error(`GameSettingsPage 缺少 guess-word 游戏支持功能: ${feature}`);
      }
    });
  });

  test('属性 4.2: UniversalGamePage应该支持guess-word游戏', () => {
    const filePath = path.join(srcDir, 'src/components/UniversalGamePage.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 验证支持guess-word游戏的特定功能
    const guessWordFeatures = [
      'useParams', // 动态参数支持
      'gameId', // 游戏ID参数
      'useQuiz', // 游戏逻辑
      'initializeQuiz', // 初始化游戏
      'submitAnswer', // 提交答案
      'getCurrentQuestion', // 获取当前题目
      'TextToSpeechButton', // 语音播放
      'OptionButton', // 选择题
      'Input', // 填空题
    ];

    guessWordFeatures.forEach(feature => {
      const hasFeature = content.includes(feature);
      expect(hasFeature).toBe(true);
      
      if (!hasFeature) {
        throw new Error(`UniversalGamePage 缺少 guess-word 游戏支持功能: ${feature}`);
      }
    });
  });

  test('属性 4.3: UniversalResultPage应该支持guess-word游戏结果', () => {
    const filePath = path.join(srcDir, 'src/components/UniversalResultPage.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 验证结果页面的必要功能
    const resultFeatures = [
      'useParams', // 动态参数支持
      'gameId', // 游戏ID参数
      'QuizResult', // 结果类型
      'accuracy', // 准确率
      'correctAnswers', // 正确答案
      'totalQuestions', // 总题数
      'handleRestart', // 重新开始
      'handleContinueGame', // 继续游戏
      'navigate', // 导航功能
    ];

    resultFeatures.forEach(feature => {
      const hasFeature = content.includes(feature);
      expect(hasFeature).toBe(true);
      
      if (!hasFeature) {
        throw new Error(`UniversalResultPage 缺少必要功能: ${feature}`);
      }
    });
  });

  test('属性 4.4: 验证被删除的组件文件确实不存在', () => {
    const deletedComponents = [
      'src/components/GuessWordSettingsPage.tsx',
      'src/components/GuessWordGamePage.tsx',
      'src/components/GuessWordResultPage.tsx',
      'src/components/GuessWordSettingsSimple.tsx',
      'src/components/GuessWordSettingsMinimal.tsx',
      'src/components/HomePageSimple.tsx'
    ];

    deletedComponents.forEach(componentPath => {
      const filePath = path.join(srcDir, componentPath);
      const exists = fs.existsSync(filePath);
      
      expect(exists).toBe(false);
      
      if (exists) {
        throw new Error(`组件文件仍然存在，应该被删除: ${componentPath}`);
      }
    });
  });

  test('属性 4.5: 验证通用组件的游戏兼容性', () => {
    // 验证通用组件能够处理不同的游戏类型
    const gameSettingsPath = path.join(srcDir, 'src/components/GameSettingsPage.tsx');
    const universalGamePath = path.join(srcDir, 'src/components/UniversalGamePage.tsx');
    
    const gameSettingsContent = fs.readFileSync(gameSettingsPath, 'utf-8');
    const universalGameContent = fs.readFileSync(universalGamePath, 'utf-8');
    
    // 验证支持多种游戏类型的特征
    const multiGameFeatures = [
      'gameId', // 动态游戏ID
      'gameInfo', // 游戏信息
      'language', // 多语言支持
      'default_config', // 默认配置
    ];

    [gameSettingsContent, universalGameContent].forEach((content, index) => {
      const componentName = index === 0 ? 'GameSettingsPage' : 'UniversalGamePage';
      
      multiGameFeatures.forEach(feature => {
        const hasFeature = content.includes(feature);
        if (!hasFeature) {
          throw new Error(`${componentName} 缺少多游戏支持功能: ${feature}`);
        }
      });
    });
  });
});
    