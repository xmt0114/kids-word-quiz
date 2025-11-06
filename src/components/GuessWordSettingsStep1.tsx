import React from 'react';
import { useNavigate } from 'react-router-dom';

export const GuessWordSettingsStep1: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSettings, setSelectedSettings] = React.useState({
    questionType: 'text',
    answerType: 'choice',
    difficulty: 'easy',
  });

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

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', color: '#4a5568', marginBottom: '10px' }}>
          当前设置：
        </p>
        <ul style={{ fontSize: '14px', color: '#666', marginLeft: '20px' }}>
          <li>题型: {selectedSettings.questionType}</li>
          <li>答题方式: {selectedSettings.answerType}</li>
          <li>难度: {selectedSettings.difficulty}</li>
        </ul>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: '#4ecdc4',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        返回首页
      </button>
    </div>
  );
};
