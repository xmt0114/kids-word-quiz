import React from 'react';

export const GuessWordSettingsMinimal: React.FC = () => {
  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '36px', color: '#2d3748', marginBottom: '30px' }}>
        猜单词 - 游戏设置
      </h1>
      <p style={{ fontSize: '16px', color: '#4a5568' }}>
        这是 GuessWordSettingsPage 的最小版本。
      </p>
    </div>
  );
};
