import React from 'react';

export const HomePageSimple: React.FC = () => {
  const games = [
    {
      id: 'guess-word',
      name: '猜单词',
      description: '通过定义猜测单词，提升词汇量',
      difficulty: '初级到高级',
    },
    {
      id: 'word-match',
      name: '单词配对',
      description: '将单词与定义进行匹配训练',
      difficulty: '中级',
      comingSoon: true
    },
    {
      id: 'audio-quiz',
      name: '听力挑战',
      description: '通过听力识别和拼写单词',
      difficulty: '中级到高级',
      comingSoon: true
    }
  ];

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '48px', color: '#2d3748', marginBottom: '20px' }}>
          英语学习游戏中心
        </h1>
        <p style={{ fontSize: '24px', color: '#4a5568' }}>
          选择你喜欢的游戏开始学习
        </p>
      </div>

      {/* 游戏列表 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px'
      }}>
        {games.map((game) => (
          <div
            key={game.id}
            style={{
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '30px',
              backgroundColor: '#fff',
              transition: 'all 0.3s ease',
            }}
          >
            <h3 style={{ fontSize: '24px', color: '#2d3748', marginBottom: '10px' }}>
              {game.name}
            </h3>
            <p style={{ fontSize: '16px', color: '#4a5568', marginBottom: '15px' }}>
              {game.description}
            </p>
            <div style={{ fontSize: '14px', color: '#718096' }}>
              难度: {game.difficulty}
            </div>
            {game.comingSoon && (
              <div style={{
                marginTop: '15px',
                padding: '5px 10px',
                backgroundColor: '#ffd43b',
                color: '#2d3748',
                borderRadius: '8px',
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                即将推出
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
