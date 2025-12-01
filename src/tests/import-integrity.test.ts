/**
 * **Feature: guess-word-cleanup, Property 5: 导入引用完整性**
 * **Validates: Requirements 3.3**
 * 
 * 属性测试：验证所有代码文件中不存在对已移除组件的导入引用
 */

import { describe, test, expect } from '@jest/globals';
import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Property 5: 导入引用完整性', () => {
  test('should not have any imports referencing removed GuessWord components', async () => {
    // 获取所有TypeScript和TSX文件
    const files = await glob('src/**/*.{ts,tsx}', {
      ignore: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**'
      ]
    });

    // 已移除的组件列表
    const removedComponents = [
      'GuessWordSettingsPage',
      'GuessWordGamePage',
      'GuessWordResultPage',
      'GuessWordSettingsSimple',
      'GuessWordSettingsMinimal',
      'HomePageSimple'
    ];

    const invalidImports: Array<{ file: string; line: string; component: string }> = [];

    // 检查每个文件
    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // 检查import语句
        if (line.trim().startsWith('import') && line.includes('from')) {
          removedComponents.forEach(component => {
            if (line.includes(component)) {
              invalidImports.push({
                file,
                line: line.trim(),
                component
              });
            }
          });
        }
      });
    }

    // 验证没有无效的导入
    if (invalidImports.length > 0) {
      const errorMessage = invalidImports
        .map(({ file, line, component }) => 
          `File: ${file}\nLine: ${line}\nComponent: ${component}`
        )
        .join('\n\n');
      
      expect.fail(`Found invalid imports to removed components:\n\n${errorMessage}`);
    }

    expect(invalidImports).toHaveLength(0);
  });

  test('should not have any dynamic imports referencing removed components', async () => {
    // 获取所有TypeScript和TSX文件
    const files = await glob('src/**/*.{ts,tsx}', {
      ignore: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**'
      ]
    });

    // 已移除的组件列表
    const removedComponents = [
      'GuessWordSettingsPage',
      'GuessWordGamePage', 
      'GuessWordResultPage',
      'GuessWordSettingsSimple',
      'GuessWordSettingsMinimal',
      'HomePageSimple'
    ];

    const invalidDynamicImports: Array<{ file: string; line: string; component: string }> = [];

    // 检查每个文件
    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // 检查动态import语句 (import(), lazy(), 等)
        if (line.includes('import(') || line.includes('lazy(')) {
          removedComponents.forEach(component => {
            if (line.includes(component)) {
              invalidDynamicImports.push({
                file,
                line: line.trim(),
                component
              });
            }
          });
        }
      });
    }

    // 验证没有无效的动态导入
    if (invalidDynamicImports.length > 0) {
      const errorMessage = invalidDynamicImports
        .map(({ file, line, component }) => 
          `File: ${file}\nLine: ${line}\nComponent: ${component}`
        )
        .join('\n\n');
      
      expect.fail(`Found invalid dynamic imports to removed components:\n\n${errorMessage}`);
    }

    expect(invalidDynamicImports).toHaveLength(0);
  });

  test('should not have any JSX references to removed components', async () => {
    // 获取所有TSX文件
    const files = await glob('src/**/*.tsx', {
      ignore: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**'
      ]
    });

    // 已移除的组件列表
    const removedComponents = [
      'GuessWordSettingsPage',
      'GuessWordGamePage',
      'GuessWordResultPage', 
      'GuessWordSettingsSimple',
      'GuessWordSettingsMinimal',
      'HomePageSimple'
    ];

    const invalidJSXReferences: Array<{ file: string; line: string; component: string }> = [];

    // 检查每个文件
    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        removedComponents.forEach(component => {
          // 检查JSX标签使用 <ComponentName 或 </ComponentName>
          const jsxPattern = new RegExp(`</?${component}[\\s>]`, 'g');
          if (jsxPattern.test(line)) {
            invalidJSXReferences.push({
              file,
              line: line.trim(),
              component
            });
          }
        });
      });
    }

    // 验证没有无效的JSX引用
    if (invalidJSXReferences.length > 0) {
      const errorMessage = invalidJSXReferences
        .map(({ file, line, component }) => 
          `File: ${file}\nLine: ${line}\nComponent: ${component}`
        )
        .join('\n\n');
      
      expect.fail(`Found invalid JSX references to removed components:\n\n${errorMessage}`);
    }

    expect(invalidJSXReferences).toHaveLength(0);
  });

  test('should have all current imports pointing to existing files', async () => {
    // 获取所有TypeScript和TSX文件
    const files = await glob('src/**/*.{ts,tsx}', {
      ignore: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**'
      ]
    });

    const brokenImports: Array<{ file: string; importPath: string; line: string }> = [];

    // 检查每个文件
    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // 匹配相对导入语句
        const importMatch = line.match(/import.*from\s+['"](\.[^'"]+)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];
          
          // 解析相对路径
          const fileDir = file.substring(0, file.lastIndexOf('/'));
          let resolvedPath = join(fileDir, importPath);
          
          // 尝试不同的文件扩展名
          const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx'];
          let exists = false;
          
          for (const ext of possibleExtensions) {
            try {
              const testPath = join(process.cwd(), resolvedPath + ext);
              readFileSync(testPath);
              exists = true;
              break;
            } catch {
              // 文件不存在，继续尝试下一个扩展名
            }
          }
          
          if (!exists) {
            brokenImports.push({
              file,
              importPath,
              line: line.trim()
            });
          }
        }
      });
    }

    // 验证没有损坏的导入
    if (brokenImports.length > 0) {
      const errorMessage = brokenImports
        .map(({ file, importPath, line }) => 
          `File: ${file}\nImport: ${importPath}\nLine: ${line}`
        )
        .join('\n\n');
      
      expect.fail(`Found broken import references:\n\n${errorMessage}`);
    }

    expect(brokenImports).toHaveLength(0);
  });
});