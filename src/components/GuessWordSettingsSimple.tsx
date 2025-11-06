import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const GuessWordSettingsSimple: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    questionType: 'text',
    answerType: 'choice',
    difficulty: 'easy',
  });

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f7fafc',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '36px', color: '#2d3748', marginBottom: '30px' }}>
        猜单词 - 游戏设置
      </h1>

      {/* 题型选择 */}
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '20px' }}>
          选择题型
        </h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => setSettings({...settings, questionType: 'text'})}
            style={{
              flex: 1,
              padding: '20px',
              fontSize: '16px',
              backgroundColor: settings.questionType === 'text' ? '#4ecdc4' : '#fff',
              color: settings.questionType === 'text' ? '#fff' : '#2d3748',
              border: '2px solid #4ecdc4',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            📝 文字题干
          </button>
          <button
            onClick={() => setSettings({...settings, questionType: 'audio'})}
            style={{
              flex: 1,
              padding: '20px',
              fontSize: '16px',
              backgroundColor: settings.questionType === 'audio' ? '#4ecdc4' : '#fff',
              color: settings.questionType === 'audio' ? '#fff' : '#2d3748',
              border: '2px solid #4ecdc4',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            🔊 音频题干
          </button>
        </div>
      </div>

      {/* 答题方式 */}
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '20px' }}>
          答题方式
        </h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => setSettings({...settings, answerType: 'choice'})}
            style={{
              flex: 1,
              padding: '20px',
              fontSize: '16px',
              backgroundColor: settings.answerType === 'choice' ? '#ff6b6b' : '#fff',
              color: settings.answerType === 'choice' ? '#fff' : '#2d3748',
              border: '2px solid #ff6b6b',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            ✅ 选择题
          </button>
          <button
            onClick={() => setSettings({...settings, answerType: 'fill'})}
            style={{
              flex: 1,
              padding: '20px',
              fontSize: '16px',
              backgroundColor: settings.answerType === 'fill' ? '#ff6b6b' : '#fff',
              color: settings.answerType === 'fill' ? '#fff' : '#2d3748',
              border: '2px solid #ff6b6b',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            ✏️ 填空题
          </button>
        </div>
      </div>

      {/* 难度选择 */}
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '20px' }}>
          选择难度
        </h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          {[
            { id: 'easy', name: '简单', color: '#4CAF50' },
            { id: 'medium', name: '中等', color: '#FF9800' },
            { id: 'hard', name: '困难', color: '#F44336' }
          ].map((level) => (
            <button
              key={level.id}
              onClick={() => setSettings({...settings, difficulty: level.id})}
              style={{
                flex: 1,
                padding: '15px',
                fontSize: '16px',
                backgroundColor: settings.difficulty === level.id ? level.color : '#fff',
                color: settings.difficulty === level.id ? '#fff' : '#2d3748',
                border: `2px solid ${level.color}`,
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              {level.name}
            </button>
          ))}
        </div>
      </div>

      {/* 按钮组 */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={() => navigate('/guess-word/game')}
          style={{
            flex: 2,
            padding: '20px',
            fontSize: '20px',
            fontWeight: 'bold',
            backgroundColor: '#4ecdc4',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45b7b8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4ecdc4'}
        >
          🎮 开始游戏
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            flex: 1,
            padding: '20px',
            fontSize: '16px',
            backgroundColor: '#fff',
            color: '#4a5568',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            cursor: 'pointer'
          }}
        >
          返回首页
        </button>
      </div>
    </div>
  );
};
