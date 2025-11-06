import React from 'react';
import { useNavigate } from 'react-router-dom';
// 导入 Card 和 Button 组件
import { Card } from './Card';
import { Button } from './Button';

export const GuessWordSettingsStep2: React.FC = () => {
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

      {/* 使用 Card 组件 */}
      <Card style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '15px' }}>
          题型选择
        </h2>
        <p style={{ fontSize: '14px', color: '#666' }}>
          文字题干
        </p>
      </Card>

      {/* 使用 Button 组件 */}
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
