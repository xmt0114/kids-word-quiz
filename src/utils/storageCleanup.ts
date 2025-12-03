/**
 * localStorage清理工具
 * 
 * 用于清理迁移到后端后不再需要的localStorage数据
 */

/**
 * 清理旧的答题统计数据
 * 这些数据现在由后端的userProgress系统管理
 */
export function cleanupLegacyQuizStats() {
  const keysToRemove: string[] = [];
  
  // 查找所有quiz-stats相关的key
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('quiz-stats')) {
      keysToRemove.push(key);
    }
  }
  
  // 移除找到的key
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🧹 [StorageCleanup] 清理旧统计数据: ${key}`);
  });
  
  if (keysToRemove.length > 0) {
    console.log(`✅ [StorageCleanup] 清理完成，移除了 ${keysToRemove.length} 个旧统计数据`);
  } else {
    console.log(`ℹ️ [StorageCleanup] 没有找到需要清理的旧统计数据`);
  }
}

/**
 * 获取当前localStorage使用情况
 */
export function getStorageUsage() {
  const usage = {
    totalKeys: localStorage.length,
    otherKeys: [] as string[]
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      usage.otherKeys.push(key);
    }
  }
  
  return usage;
}

/**
 * 在开发环境中显示存储使用情况
 */
export function debugStorageUsage() {
  if (process.env.NODE_ENV === 'development') {
    const usage = getStorageUsage();
    console.group('📊 [StorageCleanup] localStorage使用情况');
    console.log('总键数:', usage.totalKeys);
    console.log('存储的键:', usage.otherKeys);
    console.groupEnd();
  }
}