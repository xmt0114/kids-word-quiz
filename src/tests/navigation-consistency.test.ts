/**
 * 属性测试：导航一致性验证
 * 功能: guess-word-cleanup, 属性 3: 导航一致性
 * 验证: 需求 2.3
 */

import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('导航一致性验证', () => {
  const srcDir = path.join(__dirname, '../../');
  
  test('属性 3: 所有游戏都应该使用相同的导航模式', async () => {
    // 搜索所有组件文件
    const files = await glob('src/components/**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: [
        // 排除将要删除的遗留组件
        '**/GuessWord*.tsx',
        '**/HomePageSimple.tsx',
        // 排除测试文件
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}'
      ]
    });

    const violations: Array<{file: string, line: number, content: string}> = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, lineIndex) => {
          // 检查硬编码的游戏特定导航
          const gameSpecificNavPatterns = [
            /navigate\s*\(\s*['"`]\/guess-word\//,
            /to\s*=\s*['"`]\/guess-word\//,
            /href\s*=\s*['"`]\/guess-word\//
          ];

          gameSpecificNavPatterns.forEach(pattern => {
            if (pattern.test(line)) {
              // 排除一些合法的用例
              const isLegitimate = 
                // 注释中的说明
                line.trim().startsWith('//') ||
                line.trim().startsWith('*') ||
                // 已经更新为动态模式的代码
                /games\/\$\{gameId/.test(line);

              if (!isLegitimate) {
                violations.push({
                  file,
                  line: lineIndex + 1,
                  content: line.trim()
                });
              }
            }
          });
        });
      } catch (error) {
        console.warn(`无法读取文件 ${file}:`, error);
      }
    }

    // 如果发现违规，提供详细信息
    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - "${v.content}"`)
        .join('\n');
      
      expect(violations).toHaveLength(0);
      throw new Error(`发现 ${violations.length} 个硬编码的游戏特定导航:\n${violationReport}`);
    }
  });

  test('属性 3.1: 管理员导航应该使用统一的 /admin/* 模式', async () => {
    const files = await glob('src/components/**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: [
        '**/GuessWord*.tsx',
        '**/HomePageSimple.tsx',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}'
      ]
    });

    const violations: Array<{file: string, line: number, content: string}> = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, lineIndex) => {
          // 检查游戏特定的管理员导航
          const gameSpecificAdminPatterns = [
            /\/guess-word\/data/,
            /\/guess-word\/invite/
          ];

          gameSpecificAdminPatterns.forEach(pattern => {
            if (pattern.test(line)) {
              // 排除注释
              const isComment = 
                line.trim().startsWith('//') ||
                line.trim().startsWith('*');

              if (!isComment) {
                violations.push({
                  file,
                  line: lineIndex + 1,
                  content: line.trim()
                });
              }
            }
          });
        });
      } catch (error) {
        console.warn(`无法读取文件 ${file}:`, error);
      }
    }

    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - "${v.content}"`)
        .join('\n');
      
      expect(violations).toHaveLength(0);
      throw new Error(`发现 ${violations.length} 个游戏特定的管理员导航:\n${violationReport}`);
    }
  });

  test('属性 3.2: 通用组件应该使用动态游戏导航', () => {
    const universalComponents = [
      'src/components/UniversalGamePage.tsx',
      'src/components/GameSettingsPage.tsx',
      'src/components/UniversalResultPage.tsx'
    ];

    universalComponents.forEach(componentPath => {
      const filePath = path.join(srcDir, componentPath);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`通用组件文件不存在: ${componentPath}`);
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 验证使用动态游戏ID导航
      const hasDynamicNavigation = 
        /games\/\$\{gameId\}/.test(content) ||
        /\/games\/.*gameId/.test(content);
      
      expect(hasDynamicNavigation).toBe(true);
      
      if (!hasDynamicNavigation) {
        throw new Error(`通用组件 ${componentPath} 没有使用动态游戏导航`);
      }
    });
  });

  test('属性 3.3: 验证管理员导航使用统一模式', () => {
    const adminComponents = [
      'src/components/user/UserHeader.tsx',
      'src/components/GameSettingsPage.tsx'
    ];

    adminComponents.forEach(componentPath => {
      const filePath = path.join(srcDir, componentPath);
      
      if (!fs.existsSync(filePath)) {
        return; // 如果文件不存在，跳过
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 验证使用统一的管理员路由
      const hasUnifiedAdminRoutes = 
        content.includes('/admin/data') ||
        content.includes('/admin/invite');
      
      // 检查是否还有旧的游戏特定管理员路由
      const hasLegacyAdminRoutes = 
        content.includes('/guess-word/data') ||
        content.includes('/guess-word/invite');
      
      if (hasLegacyAdminRoutes) {
        throw new Error(`组件 ${componentPath} 仍然使用游戏特定的管理员路由`);
      }
      
      // 对于包含管理员功能的组件，应该使用统一路由
      if (content.includes('admin') && content.includes('navigate')) {
        expect(hasUnifiedAdminRoutes).toBe(true);
        
        if (!hasUnifiedAdminRoutes) {
          throw new Error(`组件 ${componentPath} 应该使用统一的管理员路由模式 /admin/*`);
        }
      }
    });
  });

  test('属性 3.4: 验证路由参数的正确使用', () => {
    const routeComponents = [
      'src/components/UniversalGamePage.tsx',
      'src/components/GameSettingsPage.tsx',
      'src/components/UniversalResultPage.tsx'
    ];

    routeComponents.forEach(componentPath => {
      const filePath = path.join(srcDir, componentPath);
      
      if (!fs.existsSync(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 验证使用 useParams 获取 gameId
      const usesParams = content.includes('useParams');
      const hasGameIdParam = content.includes('gameId');
      
      expect(usesParams && hasGameIdParam).toBe(true);
      
      if (!usesParams || !hasGameIdParam) {
        throw new Error(`组件 ${componentPath} 应该使用 useParams 获取 gameId 参数`);
      }
    });
  });
});