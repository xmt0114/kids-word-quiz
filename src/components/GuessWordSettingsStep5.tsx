import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { cn } from '../lib/utils';
import { wordAPI } from '../utils/api';
import { useQuizSettings } from '../hooks/useLocalStorage';
import { QuizSettings } from '../types';
import { Volume2, Type, MousePointer, Edit3, Trophy, Database, BookOpen, ListOrdered, Shuffle } from 'lucide-react';

export const GuessWordSettingsStep5: React.FC = () => {
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

  // 测试 useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      setTestMessage('useEffect 已执行 - 模拟数据加载完成');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const questionTypes = [
    {
      id: 'text',
      name: '文字题干',
      description: '在屏幕上显示题目描述',
      icon: Type,
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: 'audio',
      name: '音频题干',
      description: '通过语音朗读题目描述',
      icon: Volume2,
      color: 'from-green-400 to-green-600',
    },
  ];

  const answerTypes = [
    {
      id: 'choice',
      name: '选择题',
      description: '从多个选项中选择正确答案',
      icon: MousePointer,
      color: 'from-purple-400 to-purple-600',
    },
    {
      id: 'fill',
      name: '填空题',
      description: '根据提示填写完整单词',
      icon: Edit3,
      color: 'from-orange-400 to-orange-600',
    },
  ];

  const testAPI = async () => {
    console.log('测试所有功能:', {
      wordAPI,
      cn,
      settings,
      selectedSettings,
      textbookInfo,
      questionTypes,
      answerTypes
    });

    // 测试所有图标组件
    console.log('测试图标组件:', {
      Volume2: typeof Volume2,
      Type: typeof Type,
      MousePointer: typeof MousePointer,
      Edit3: typeof Edit3,
      Trophy: typeof Trophy,
      Database: typeof Database,
      BookOpen: typeof BookOpen,
      ListOrdered: typeof ListOrdered,
      Shuffle: typeof Shuffle
    });
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '36px', color: '#2d3748', marginBottom: '30px' }}>
        猜单词 - 游戏设置 (Step 5)
      </h1>

      {/* 测试 useEffect */}
      <Card className={cn('test-class')} style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '15px' }}>
          Hook 测试
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          useEffect, useQuizSettings 测试
        </p>
        {testMessage && (
          <p style={{ fontSize: '14px', color: 'green', marginBottom: '10px' }}>
            ✓ {testMessage}
          </p>
        )}
      </Card>

      {/* 测试 Lucide React 图标 */}
      <Card style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '15px' }}>
          图标组件测试
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Lucide React 图标展示
        </p>

        {/* 题型选择 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', color: '#4a5568', marginBottom: '10px' }}>题型:</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {questionTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  style={{
                    padding: '15px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  <Icon size={32} style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{type.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{type.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 答题方式 */}
        <div>
          <h3 style={{ fontSize: '16px', color: '#4a5568', marginBottom: '10px' }}>答题方式:</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {answerTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  style={{
                    padding: '15px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  <Icon size={32} style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{type.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{type.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div style={{ marginTop: '20px' }}>
        <Button
          onClick={testAPI}
          variant="primary"
          size="default"
        >
          测试所有功能（查看控制台）
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
