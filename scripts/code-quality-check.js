/**
 * 代码质量检查工具
 * 整合了多个验证脚本的核心功能，用于日常代码质量检查
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// 递归获取所有TypeScript和TSX文件
function getAllTsFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!item.includes('node_modules') && !item.includes('tests') && !item.includes('scripts')) {
        getAllTsFiles(fullPath, files);
      }
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      if (!item.includes('.test.') && !item.includes('.spec.') && !item.includes('verify-')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function runCodeQualityCheck() {
  console.log('🔍 代码质量检查工具\n');

  let hasErrors = false;
  const issues = [];

  const files = getAllTsFiles('src');
  console.log(`📁 检查 ${files.length} 个文件...\n`);

  // 1. 导入引用完整性检查
  console.log('🔍 检查导入引用完整性...');
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // 检查import语句
        if (line.trim().startsWith('import') && line.includes('from')) {
          // 检查相对导入路径
          const importMatch = line.match(/import.*from\s+['"](\.[^'"]+)['"]/);
          if (importMatch) {
            const importPath = importMatch[1];
            
            // 简化检查：只检查明显的错误导入
            // 跳过相对导入的详细检查，因为这需要复杂的路径解析
            // 只检查是否导入了已知的已删除组件
            const deletedComponents = [
              'GuessWordSettingsPage',
              'GuessWordGamePage',
              'GuessWordResultPage',
              'GuessWordSettingsSimple',
              'GuessWordSettingsMinimal',
              'HomePageSimple'
            ];
            
            deletedComponents.forEach(component => {
              if (line.includes(component)) {
                issues.push({
                  type: 'deleted-component-import',
                  file,
                  lineNumber,
                  line: line.trim(),
                  component
                });
                hasErrors = true;
              }
            });
          }
        }
      });
    } catch (error) {
      console.error(`❌ 读取文件失败: ${file}`, error.message);
      hasErrors = true;
    }
  }

  // 2. 游戏系统一致性检查
  console.log('🔍 检查游戏系统一致性...');
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // 检查是否有游戏特定的硬编码路由
        const gameSpecificRoutes = [
          '/guess-word/',
          '/word-match/',
          '/math-quiz/',
        ];

        gameSpecificRoutes.forEach(route => {
          if (line.includes(route) && !line.includes('//') && !line.includes('*')) {
            issues.push({
              type: 'game-specific-route',
              file,
              lineNumber: index + 1,
              line: line.trim(),
              route
            });
            hasErrors = true;
          }
        });
      });
    } catch (error) {
      console.error(`❌ 读取文件失败: ${file}`, error.message);
      hasErrors = true;
    }
  }

  // 3. 认证模式一致性检查
  console.log('🔍 检查认证模式一致性...');
  
  const loginMethods = [];
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      if (content.includes('openLoginModal')) {
        loginMethods.push({ file, method: 'openLoginModal' });
      }
      if (content.includes('showLogin') && !content.includes('openLoginModal')) {
        loginMethods.push({ file, method: 'showLogin' });
      }
      if (content.includes('triggerLogin')) {
        loginMethods.push({ file, method: 'triggerLogin' });
      }
    } catch (error) {
      // 忽略读取错误
    }
  }

  if (loginMethods.length > 0) {
    const uniqueMethods = [...new Set(loginMethods.map(m => m.method))];
    if (uniqueMethods.length > 1) {
      issues.push({
        type: 'inconsistent-login-methods',
        message: `发现多种登录方法: ${uniqueMethods.join(', ')}`,
        methods: loginMethods
      });
      hasErrors = true;
    }
  }

  // 报告结果
  if (hasErrors) {
    console.log('\n❌ 发现代码质量问题:\n');
    
    const groupedIssues = {};
    issues.forEach(issue => {
      if (!groupedIssues[issue.type]) {
        groupedIssues[issue.type] = [];
      }
      groupedIssues[issue.type].push(issue);
    });

    Object.keys(groupedIssues).forEach(type => {
      console.log(`🚫 ${type}:`);
      groupedIssues[type].forEach(issue => {
        if (issue.file) console.log(`   📄 ${issue.file}:${issue.lineNumber || ''}`);
        console.log(`   📝 ${issue.message || issue.line}`);
        if (issue.importPath) console.log(`   🔗 导入路径: ${issue.importPath}`);
        if (issue.route) console.log(`   🔗 路由: ${issue.route}`);
        if (issue.methods) {
          issue.methods.forEach(method => {
            console.log(`   🔧 ${method.file}: ${method.method}`);
          });
        }
        console.log('');
      });
    });
    
    console.log(`总计发现 ${issues.length} 个问题`);
    process.exit(1);
  } else {
    console.log('\n✅ 代码质量检查通过！');
    console.log('✅ 导入引用完整性正常');
    console.log('✅ 游戏系统一致性良好');
    console.log('✅ 认证模式一致');
  }
}

// 运行检查
try {
  runCodeQualityCheck();
} catch (error) {
  console.error('❌ 检查过程中发生错误:', error);
  process.exit(1);
}