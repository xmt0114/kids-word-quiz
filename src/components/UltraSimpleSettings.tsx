import React from 'react';
import { Link } from 'react-router-dom';

export const UltraSimpleSettings: React.FC = () => {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '40px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#333' }}>
          猜单词 - 游戏设置
        </h1>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#555' }}>
            游戏说明
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#666' }}>
            这是猜单词游戏的设置页面。我们正在修复一些技术问题，
            暂时只能显示简化版本。
          </p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#e8f4f8',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#0066cc' }}>
            即将推出的功能：
          </h3>
          <ul style={{ fontSize: '16px', color: '#555', lineHeight: '1.8' }}>
            <li>选择题型（文字/音频）</li>
            <li>选择答题方式（选择题/填空题）</li>
            <li>选择难度（简单/中等/困难）</li>
            <li>选择教材</li>
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          borderTop: '1px solid #ddd',
          paddingTop: '30px'
        }}>
          <button
            disabled
            style={{
              flex: 2,
              padding: '15px',
              fontSize: '18px',
              backgroundColor: '#ccc',
              color: '#888',
              border: 'none',
              borderRadius: '8px',
              cursor: 'not-allowed'
            }}
          >
            开始游戏（即将开放）
          </button>

          <Link
            to="/"
            style={{
              flex: 1,
              padding: '15px',
              fontSize: '16px',
              textAlign: 'center',
              backgroundColor: '#fff',
              color: '#0066cc',
              border: '2px solid #0066cc',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};
