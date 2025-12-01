/**
 * 属性测试：代码清理完整性验证
 * 功能: guess-word-cleanup, 属性 8: 代码清理完整性
 * 验证: 需求 5.5, 6.3
 */

import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('代码清理完整性验证', () => {
  const srcDir = path.join(__dirname, '../../');
  
  test('属性 8: 代码库中不应存在guess_word特定的遗留代码', async () => {
    // 搜索所有源代码文件
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: srcDir,
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**',
        'coverage/**',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        'legacy-code-inventory.md',
        'temp_*.{ts,tsx}',
        '.kiro/**'
      ]
    });

    const legacyPatterns = [
      // 组件名称模式
      /GuessWordSettingsPage/g,
      /GuessWordGamePage/g,
      /GuessWordResultPage/g,
      /GuessWordSettingsSimple/g,
      /GuessWordSettingsMinimal/g,
      
      // 路由模式 (排除注释和字符串中的说明)
      /(?<!\/\/.*|\/\*[\s\S]*?\*\/.*|['"`].*?)\/guess-word\/(?!.*['"`])/g,
      
      // 导入语句模式
      /import.*GuessWord/g,
      
      // 导航调用模式 (排除已经更新为通用模式的)
      /navigate\s*\(\s*['"`]\/guess-word\//g,
      /to\s*=\s*['"`]\/guess-word\//g,
    ];

    const violations: Array<{file: string, line: number, content: string, pattern: string}> = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      
      // 跳过已知的遗留文件（这些文件将被删除）
      const legacyFiles = [
        'GuessWordSettingsPage.tsx',
        'GuessWordGamePage.tsx', 
        'GuessWordResultPage.tsx',
        'GuessWordSettingsSimple.tsx',
        'GuessWordSettingsMinimal.tsx',
        'HomePageSimple.tsx'
      ];
      
      if (legacyFiles.some(legacy => file.includes(legacy))) {
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        legacyPatterns.forEach((pattern, patternIndex) => {
          lines.forEach((line, lineIndex) => {
            const matches = line.match(pattern);
            if (matches) {
              // 排除一些已知的合法用例
              const isLegitimate = 
                // 注释中的说明
                line.trim().startsWith('//') ||
                line.trim().startsWith('*') ||
                // 字符串字面量中的说明
                /['"`].*guess-word.*['"`]/.test(line) ||
                // 已经更新为通用模式的代码
                /games\/\$\{gameId \|\| 'guess-word'\}/.test(line);

              if (!isLegitimate) {
                violations.push({
                  file,
                  line: lineIndex + 1,
                  content: line.trim(),
                  pattern: pattern.toString()
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
        .map(v => `${v.file}:${v.line} - "${v.content}" (匹配模式: ${v.pattern})`)
        .join('\n');
      
      expect(violations).toHaveLength(0);
      throw new Error(`发现 ${violations.length} 个遗留的guess_word特定代码:\n${violationReport}`);
    }
  });

  test('属性 8.1: 不应存在未使用的GuessWord组件文件', () => {
    const componentFiles = [
      'src/components/GuessWordSettingsPage.tsx',
      'src/components/GuessWordGamePage.tsx',
      'src/components/GuessWordResultPage.tsx',
      'src/components/GuessWordSettingsSimple.tsx',
      'src/components/GuessWordSettingsMinimal.tsx',
      'src/components/HomePageSimple.tsx'
    ];

    componentFiles.forEach(file => {
      const filePath = path.join(srcDir, file);
      const exists = fs.existsSync(filePath);
      
      expect(exists).toBe(false);
      if (exists) {
        throw new Error(`遗留组件文件仍然存在: ${file}`);
      }
    });
  });

  test('属性 8.2: App.tsx中不应存在guess-word特定路由', () => {
    const appPath = path.join(srcDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    const legacyRoutes = [
      '/guess-word/settings',
      '/guess-word/game', 
      '/guess-word/result',
      '/guess-word/data',
      '/guess-word/invite'
    ];

    legacyRoutes.forEach(route => {
      const hasRoute = content.includes(`path="${route}"`);
      expect(hasRoute).toBe(false);
      
      if (hasRoute) {
        throw new Error(`App.tsx中仍然存在遗留路由: ${route}`);
      }
    });
  });

  test('属性 8.3: 不应存在对已删除组件的导入', () => {
    const appPath = path.join(srcDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    const legacyImports = [
      'GuessWordSettingsPage',
      'GuessWordGamePage',
      'GuessWordResultPage'
    ];

    legacyImports.forEach(importName => {
      const hasImport = content.includes(importName);
      expect(hasImport).toBe(false);
      
      if (hasImport) {
        throw new Error(`App.tsx中仍然存在对已删除组件的导入: ${importName}`);
      }
    });
  });
});