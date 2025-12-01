/**
 * 属性测试：路由模式一致性验证
 * 功能: guess-word-cleanup, 属性 1: 路由模式一致性
 * 验证: 需求 2.1
 */

import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('路由模式一致性验证', () => {
  const srcDir = path.join(__dirname, '../../');
  
  test('属性 1: 所有游戏路由都应该遵循 /games/:gameId/* 模式', () => {
    const appPath = path.join(srcDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    // 检查不应该存在的游戏特定路由模式
    const gameSpecificRoutes = [
      '/guess-word/',
      '/word-match/',
      '/spelling-bee/',
      '/audio-quiz/'
    ];
    
    gameSpecificRoutes.forEach(route => {
      const hasGameSpecificRoute = content.includes(`path="${route}`);
      expect(hasGameSpecificRoute).toBe(false);
      
      if (hasGameSpecificRoute) {
        throw new Error(`发现游戏特定路由模式: ${route}，应该使用通用模式 /games/:gameId/*`);
      }
    });
    
    // 验证通用游戏路由存在
    const universalGameRoutes = [
      '/games/:gameId/settings',
      '/games/:gameId/play'
    ];
    
    universalGameRoutes.forEach(route => {
      const hasUniversalRoute = content.includes(`path="${route}"`);
      expect(hasUniversalRoute).toBe(true);
      
      if (!hasUniversalRoute) {
        throw new Error(`缺少通用游戏路由: ${route}`);
      }
    });
  });

  test('属性 1.1: 管理员路由应该使用统一的 /admin/* 模式', () => {
    const appPath = path.join(srcDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    // 检查管理员路由使用统一模式
    const adminRoutes = [
      '/admin/data',
      '/admin/invite'
    ];
    
    adminRoutes.forEach(route => {
      const hasAdminRoute = content.includes(`path="${route}"`);
      expect(hasAdminRoute).toBe(true);
      
      if (!hasAdminRoute) {
        throw new Error(`缺少统一的管理员路由: ${route}`);
      }
    });
    
    // 确保没有游戏特定的管理员路由
    const gameSpecificAdminRoutes = [
      '/guess-word/data',
      '/guess-word/invite'
    ];
    
    gameSpecificAdminRoutes.forEach(route => {
      const hasGameSpecificAdminRoute = content.includes(`path="${route}"`);
      expect(hasGameSpecificAdminRoute).toBe(false);
      
      if (hasGameSpecificAdminRoute) {
        throw new Error(`发现游戏特定的管理员路由: ${route}，应该使用统一模式 /admin/*`);
      }
    });
  });

  test('属性 1.2: 路由组件应该使用通用组件', () => {
    const appPath = path.join(srcDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    // 验证使用通用游戏组件
    const universalComponents = [
      'GameSettingsPage',
      'UniversalGamePage'
    ];
    
    universalComponents.forEach(component => {
      const hasComponent = content.includes(`element={<${component}`);
      expect(hasComponent).toBe(true);
      
      if (!hasComponent) {
        throw new Error(`路由配置中缺少通用组件: ${component}`);
      }
    });
    
    // 确保没有游戏特定组件的引用
    const gameSpecificComponents = [
      'GuessWordSettingsPage',
      'GuessWordGamePage',
      'GuessWordResultPage'
    ];
    
    gameSpecificComponents.forEach(component => {
      const hasGameSpecificComponent = content.includes(component);
      expect(hasGameSpecificComponent).toBe(false);
      
      if (hasGameSpecificComponent) {
        throw new Error(`路由配置中仍然引用游戏特定组件: ${component}`);
      }
    });
  });

  test('属性 1.3: 路由参数应该支持动态游戏ID', () => {
    const appPath = path.join(srcDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    // 验证路由参数模式
    const gameIdPattern = /:gameId/;
    const hasGameIdParam = gameIdPattern.test(content);
    
    expect(hasGameIdParam).toBe(true);
    
    if (!hasGameIdParam) {
      throw new Error('路由配置中缺少动态游戏ID参数 :gameId');
    }
    
    // 验证具体的路由参数使用
    const routePatterns = [
      '/games/:gameId/settings',
      '/games/:gameId/play'
    ];
    
    routePatterns.forEach(pattern => {
      const hasPattern = content.includes(pattern);
      expect(hasPattern).toBe(true);
      
      if (!hasPattern) {
        throw new Error(`路由配置中缺少动态路由模式: ${pattern}`);
      }
    });
  });

  test('属性 1.4: 验证路由配置的完整性', () => {
    const appPath = path.join(srcDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    // 验证必要的路由都存在
    const requiredRoutes = [
      '/',
      '/login',
      '/forgot-password',
      '/reset-password',
      '/textbook-selection',
      '/games/:gameId/settings',
      '/games/:gameId/play',
      '/admin/data',
      '/admin/invite',
      '*' // 通配符路由
    ];
    
    requiredRoutes.forEach(route => {
      const routePattern = route === '*' ? 'path="*"' : `path="${route}"`;
      const hasRoute = content.includes(routePattern);
      
      expect(hasRoute).toBe(true);
      
      if (!hasRoute) {
        throw new Error(`路由配置中缺少必要路由: ${route}`);
      }
    });
  });
});