import React from 'react';

export const SimpleTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontSize: '24px', color: 'red' }}>
      <h1>✅ React 正常工作！</h1>
      <p>如果看到这个页面，说明 React 和 Vite 都配置正确。</p>
      <p>问题可能出在 HomePage 组件或某个依赖项上。</p>
    </div>
  );
};
