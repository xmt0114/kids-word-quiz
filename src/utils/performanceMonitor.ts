/**
 * 性能监控工具
 * 用于监控Zustand store的性能和重渲染情况
 */

interface PerformanceMetrics {
  stateUpdates: number;
  subscriptions: number;
  renderCount: number;
  lastUpdateTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    stateUpdates: 0,
    subscriptions: 0,
    renderCount: 0,
    lastUpdateTime: Date.now()
  };

  private subscribers: Set<(metrics: PerformanceMetrics) => void> = new Set();

  // 记录状态更新
  recordStateUpdate() {
    this.metrics.stateUpdates++;
    this.metrics.lastUpdateTime = Date.now();
    this.notifySubscribers();
  }

  // 记录订阅
  recordSubscription() {
    this.metrics.subscriptions++;
    this.notifySubscribers();
  }

  // 记录渲染
  recordRender() {
    this.metrics.renderCount++;
    this.notifySubscribers();
  }

  // 获取当前指标
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 重置指标
  reset() {
    this.metrics = {
      stateUpdates: 0,
      subscriptions: 0,
      renderCount: 0,
      lastUpdateTime: Date.now()
    };
    this.notifySubscribers();
  }

  // 订阅指标变化
  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      callback(this.getMetrics());
    });
  }

  // 生成性能报告
  generateReport(): string {
    const metrics = this.getMetrics();
    const uptime = Date.now() - metrics.lastUpdateTime;
    
    return `
性能监控报告 (Zustand Store)
================================
状态更新次数: ${metrics.stateUpdates}
订阅数量: ${metrics.subscriptions}
渲染次数: ${metrics.renderCount}
最后更新: ${new Date(metrics.lastUpdateTime).toLocaleString()}
运行时间: ${Math.round(uptime / 1000)}秒

性能指标:
- 平均更新频率: ${metrics.stateUpdates > 0 ? Math.round(uptime / metrics.stateUpdates / 1000) : 0}秒/次
- 渲染效率: ${metrics.stateUpdates > 0 ? Math.round(metrics.renderCount / metrics.stateUpdates * 100) : 0}% (渲染/更新比)
`;
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 开发环境下的性能监控Hook
export function usePerformanceMonitor() {
  if (process.env.NODE_ENV === 'development') {
    return performanceMonitor;
  }
  return null;
}