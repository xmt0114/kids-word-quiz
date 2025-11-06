import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { WordSelectionStrategy } from '../types';
import { ArrowLeft, ListOrdered, Shuffle } from 'lucide-react';
import { cn } from '../lib/utils';

interface StrategySelectionPageProps {
  onSelectStrategy: (strategy: WordSelectionStrategy) => void;
  onBack: () => void;
  collectionName?: string;
  wordCount?: number;
}

const StrategySelectionPage: React.FC<StrategySelectionPageProps> = ({
  onSelectStrategy,
  onBack,
  collectionName,
  wordCount
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<WordSelectionStrategy | null>(null);

  const strategies = [
    {
      id: 'sequential' as WordSelectionStrategy,
      name: '顺序选取',
      description: '按单词字母顺序依次出题',
      detail: '单词将按照A-Z的字母顺序排列，适合系统性学习',
      icon: ListOrdered,
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: 'random' as WordSelectionStrategy,
      name: '随机选取',
      description: '从词汇池中随机抽取题目',
      detail: '每次练习题目顺序都不同，增加趣味性和挑战性',
      icon: Shuffle,
      color: 'from-purple-400 to-purple-600',
    },
  ];

  const handleStrategySelect = (strategyId: WordSelectionStrategy) => {
    setSelectedStrategy(strategyId);
  };

  const handleConfirm = () => {
    if (selectedStrategy) {
      onSelectStrategy(selectedStrategy);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 p-sm md:p-lg">
      {/* 顶部导航 */}
      <div className="max-w-4xl mx-auto mb-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={24} />
          <span className="text-body font-semibold">返回</span>
        </button>
      </div>

      {/* 标题区域 */}
      <div className="text-center mb-xl">
        <h1 className="text-hero font-bold text-text-primary mb-md">
          选择出题策略
        </h1>
        <p className="text-h3 text-text-secondary">
          选择您喜欢的单词选取方式
        </p>
        
        {/* 教材信息 */}
        {collectionName && (
          <div className="mt-lg">
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200">
              <div className="text-center">
                <p className="text-body text-text-secondary mb-xs">当前教材</p>
                <p className="text-h3 font-bold text-text-primary">{collectionName}</p>
                {wordCount && (
                  <p className="text-body text-text-tertiary mt-xs">
                    共 {wordCount} 个单词
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* 策略选项 */}
      <div className="max-w-4xl mx-auto mb-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {strategies.map((strategy) => {
            const Icon = strategy.icon;
            const isSelected = selectedStrategy === strategy.id;
            
            return (
              <Card
                key={strategy.id}
                className={cn(
                  'cursor-pointer transition-all duration-normal border-4',
                  isSelected 
                    ? 'border-primary-500 bg-primary-50 scale-105 shadow-lg' 
                    : 'border-gray-200 hover:border-primary-300 hover:scale-102'
                )}
                onClick={() => handleStrategySelect(strategy.id)}
              >
                <div className="text-center">
                  <div className={cn(
                    'w-20 h-20 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center',
                    strategy.color
                  )}>
                    <Icon size={40} className="text-white" />
                  </div>
                  <h3 className="text-h2 font-bold text-text-primary mb-sm">
                    {strategy.name}
                  </h3>
                  <p className="text-body text-text-secondary mb-md">
                    {strategy.description}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-md">
                    <p className="text-small text-text-tertiary">
                      {strategy.detail}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 确认按钮 */}
      <div className="text-center">
        <Button
          size="large"
          onClick={handleConfirm}
          disabled={!selectedStrategy}
          className={cn(
            'min-w-[200px]',
            !selectedStrategy && 'opacity-50 cursor-not-allowed'
          )}
        >
          确认选择
        </Button>
      </div>
    </div>
  );
};

export { StrategySelectionPage };
