import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { cn } from '../lib/utils';
import { wordAPI } from '../utils/api';
import { useQuizSettings } from '../hooks/useLocalStorage';
import { QuizSettings } from '../types';

export const GuessWordSettingsStep4: React.FC = () => {
  const navigate = useNavigate();
  const { settings, setSettings } = useQuizSettings();
  const [selectedSettings, setSelectedSettings] = useState<QuizSettings>({
    questionType: 'text',
    answerType: 'choice',
    difficulty: 'easy',
    selectionStrategy: 'sequential',
  });
  const [textbookInfo, setTextbookInfo] = useState<{ name: string; grade_level?: string | null } | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');

  // 测试 useEffect - 模拟加载教材信息
  useEffect(() => {
    // 模拟异步加载
    const timer = setTimeout(() => {
      setTestMessage('useEffect 已执行 - 模拟数据加载完成');
      console.log('测试 useEffect hook:', {
        settings,
        selectedSettings,
        textbookInfo
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 测试 useQuizSettings hook
  useEffect(() => {
    console.log('测试 useQuizSettings:', {
      localStorageSettings: settings,
      setSettingsFunction: typeof setSettings
    });
  }, [settings, setSettings]);

  const testAPI = async () => {
    console.log('测试 wordAPI:', wordAPI);
    console.log('测试 cn 函数:', cn);
    console.log('测试 useQuizSettings:', { settings, setSettings });
    console.log('测试 QuizSettings 类型:', selectedSettings);

    if (textbookInfo) {
      console.log('教材信息:', textbookInfo);
    }
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '36px', color: '#2d3748', marginBottom: '30px' }}>
        猜单词 - 游戏设置 (Step 4)
      </h1>

      {/* 测试 useEffect */}
      <Card className={cn('test-class')} style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '15px' }}>
          Hook 测试
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          useEffect, useQuizSettings, QuizSettings 类型测试
        </p>
        {testMessage && (
          <p style={{ fontSize: '14px', color: 'green', marginBottom: '10px' }}>
            ✓ {testMessage}
          </p>
        )}
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
          <div>LocalStorage 设置: {JSON.stringify(settings)}</div>
          <div>选择的设置: {JSON.stringify(selectedSettings)}</div>
        </div>
      </Card>

      <div style={{ marginTop: '20px' }}>
        <Button
          onClick={testAPI}
          variant="primary"
          size="default"
        >
          测试所有 Hooks（查看控制台）
        </Button>
        <Button
          onClick={() => navigate('/')}
          variant="secondary"
          size="default"
          style={{ marginLeft: '10px' }}
        >
          返回首页
        </Button>
      </div>
    </div>
  );
};
