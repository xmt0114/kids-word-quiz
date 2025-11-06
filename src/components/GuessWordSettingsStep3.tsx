import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
// 添加 cn 工具函数和 wordAPI
import { cn } from '../lib/utils';
import { wordAPI } from '../utils/api';

export const GuessWordSettingsStep3: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSettings, setSelectedSettings] = React.useState({
    questionType: 'text',
    answerType: 'choice',
    difficulty: 'easy',
  });

  const testAPI = async () => {
    console.log('测试 wordAPI:', wordAPI);
    console.log('测试 cn 函数:', cn);
  };

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

      {/* 测试 cn 函数 */}
      <Card className={cn('test-class')} style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '15px' }}>
          API 测试
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          wordAPI 和 cn 工具函数已加载
        </p>
        <button
          onClick={testAPI}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#4ecdc4',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          测试 API（查看控制台）
        </button>
      </Card>

      <div style={{ marginTop: '20px' }}>
        <Button
          onClick={() => navigate('/')}
          variant="primary"
          size="default"
        >
          返回首页
        </Button>
      </div>
    </div>
  );
};
