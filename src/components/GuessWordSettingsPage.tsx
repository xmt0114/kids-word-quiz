import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { QuizSettings, TTSSettings } from '../types';
import { useQuizSettings } from '../hooks/useLocalStorage';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { useAvailableVoices } from '../hooks/useAvailableVoices';
import { Volume2, Type, MousePointer, Edit3, Database, BookOpen, ListOrdered, Shuffle, RotateCcw, TrendingUp, Speaker } from 'lucide-react';
import { cn } from '../lib/utils';
import { wordAPI } from '../utils/api';

interface GuessWordSettingsPageProps {
  selectedCollectionId?: string;
}

const GuessWordSettingsPage: React.FC<GuessWordSettingsPageProps> = ({
  selectedCollectionId,
}) => {
  const navigate = useNavigate();
  const { settings, setSettings } = useQuizSettings();
  const { getProgressPercentage, getRemainingWords, formatLastUpdated, resetProgress, getProgress, updateProgress } = useLearningProgress();
  const { voices, isLoaded: isVoicesLoaded } = useAvailableVoices();
  const [selectedSettings, setSelectedSettings] = useState<QuizSettings>({
    questionType: 'text',
    answerType: 'choice',
    selectionStrategy: 'sequential',
    tts: {
      lang: 'en-US',
      rate: 0.8,
      pitch: 1.0,
      volume: 1.0,
    },
  });
  const [textbookInfo, setTextbookInfo] = useState<{ name: string; grade_level?: string | null; word_count?: number } | null>(null);

  // 初始化时同步 localStorage 中的设置
  useEffect(() => {
    // 从 localStorage 加载保存的设置
    setSelectedSettings({
      questionType: settings.questionType || 'text',
      answerType: settings.answerType || 'choice',
      selectionStrategy: settings.selectionStrategy || 'sequential',
      collectionId: settings.collectionId || selectedCollectionId || '11111111-1111-1111-1111-111111111111',
      tts: settings.tts || {
        lang: 'en-US',
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0,
      },
    });
  }, []);

  // 同步 collectionId 变化到 selectedSettings 和 localStorage
  useEffect(() => {
    if (selectedCollectionId && selectedCollectionId !== selectedSettings.collectionId) {
      const updatedSettings = {
        ...selectedSettings,
        collectionId: selectedCollectionId,
      };
      setSelectedSettings(updatedSettings);
      setSettings(updatedSettings); // 同时保存到 localStorage
    }
  }, [selectedCollectionId]);

  // 加载当前选择的教材信息
  useEffect(() => {
    // 优先使用 selectedCollectionId，其次从 localStorage 读取
    const collectionId = selectedCollectionId || localStorage.getItem('last-selected-textbook');

    if (collectionId) {
      wordAPI.getCollectionById(collectionId).then(response => {
        if (response.success && response.data) {
          setTextbookInfo({
            name: response.data.name,
            grade_level: response.data.grade_level,
            word_count: response.data.word_count
          });

          // 初始化学习进度（如果还没有的话）
          const currentProgress = getProgress(collectionId);
          if (!currentProgress && response.data.word_count > 0) {
            updateProgress(collectionId, 0, response.data.word_count);
          }
        }
      });
    } else {
      setTextbookInfo(null);
    }
  }, [selectedCollectionId]);

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

  const selectionStrategies = [
    {
      id: 'sequential' as const,
      name: '顺序选取',
      description: '按添加时间顺序依次出题',
      detail: '单词将按照添加的时间顺序排列，新添加的单词优先出现',
      icon: ListOrdered,
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: 'random' as const,
      name: '随机选取',
      description: '从词汇池中随机抽取题目',
      detail: '每次练习题目顺序都不同，增加趣味性和挑战性',
      icon: Shuffle,
      color: 'from-purple-400 to-purple-600',
    },
  ];

  const handleQuestionTypeSelect = (type: string) => {
    const newSettings = { ...selectedSettings, questionType: type as 'text' | 'audio' };
    setSelectedSettings(newSettings);
    setSettings(newSettings); // 同时保存到 localStorage
  };

  const handleAnswerTypeSelect = (type: string) => {
    const newSettings = { ...selectedSettings, answerType: type as 'choice' | 'fill' };
    setSelectedSettings(newSettings);
    setSettings(newSettings); // 同时保存到 localStorage
  };

  const handleStrategySelect = (strategy: string) => {
    const newSettings = { ...selectedSettings, selectionStrategy: strategy as 'sequential' | 'random' };
    setSelectedSettings(newSettings);
    setSettings(newSettings); // 同时保存到 localStorage
  };

  const handleTtsSettingChange = (key: keyof TTSSettings, value: string | number) => {
    const newSettings = {
      ...selectedSettings,
      tts: {
        ...selectedSettings.tts!,
        [key]: value,
      },
    };
    setSelectedSettings(newSettings);
    setSettings(newSettings); // 同时保存到 localStorage
  };

  const handleTtsTest = () => {
    // 首先取消任何正在进行的语音
    window.speechSynthesis.cancel();

    // 等待一小段时间确保之前的语音完全停止
    setTimeout(() => {
      // 测试朗读功能
      const testText = "This is a test of the text-to-speech feature.";
      const utterance = new SpeechSynthesisUtterance(testText);
      const ttsSettings = selectedSettings.tts!;

      // 设置基础参数
      utterance.lang = ttsSettings.lang;
      utterance.rate = ttsSettings.rate;
      utterance.pitch = ttsSettings.pitch;
      utterance.volume = ttsSettings.volume;

      // 如果选择了特定语音，尝试使用它
      // 直接从浏览器获取语音列表，确保名称匹配
      const availableVoices = window.speechSynthesis.getVoices();

      if (ttsSettings.voiceName && availableVoices.length > 0) {
        // 使用完全匹配（trim并比较）
        const selectedVoice = availableVoices.find(voice => {
          const trimmedName = voice.name.trim();
          const searchName = ttsSettings.voiceName!.trim();
          return trimmedName === searchName || trimmedName.includes(searchName) || searchName.includes(trimmedName);
        });

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else if (availableVoices.length === 0) {
        // 语音列表尚未加载
      }

      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const handleSaveSettings = () => {
    setSettings(selectedSettings); // 保存设置到 localStorage
    navigate('/'); // 返回主页
  };

  const handleDataManagement = () => {
    navigate('/guess-word/data');
  };

  // 判断是否为开发环境
  const isDevMode = import.meta.env.DEV;

  const handleSelectTextbook = () => {
    navigate('/textbook-selection');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 p-sm md:p-lg">
      {/* 顶部导航按钮 */}
      <div className="flex justify-between items-center mb-xl max-w-4xl mx-auto">
        <Button
          variant="secondary"
          onClick={handleBackToHome}
          className="flex items-center gap-sm"
        >
          <span>←</span>
          返回主页
        </Button>

        {/* 数据管理按钮 - 仅在开发环境显示 */}
        {isDevMode && (
          <Button
            variant="secondary"
            onClick={handleDataManagement}
            className="flex items-center gap-sm"
          >
            <Database size={20} />
            数据管理
          </Button>
        )}
      </div>

      {/* 页面标题 */}
      <div className="text-center mb-xl">
        <h1 className="text-hero font-bold text-text-primary mb-md animate-slide-in-right">
          猜单词游戏设置
        </h1>
        <p className="text-h2 text-text-secondary font-semibold">
          配置你的游戏参数
        </p>
        
        {/* 装饰元素 */}
        <div className="relative mt-lg">
          <div className="absolute -top-4 -left-8 w-16 h-16 bg-accent-500 rounded-full opacity-20 animate-float" />
          <div className="absolute -top-2 -right-12 w-12 h-12 bg-secondary-500 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-4 left-1/2 w-8 h-8 bg-primary-500 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* 教材选择区域 */}
      <div className="max-w-2xl mx-auto mb-xl">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-h3 font-bold text-text-primary">当前教材</h3>
                <p className="text-body text-text-secondary">
                  {textbookInfo ? (
                    <>
                      {textbookInfo.name}
                      {textbookInfo.grade_level && ` (${textbookInfo.grade_level}年级)`}
                    </>
                  ) : (
                    '默认教材'
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={handleSelectTextbook}
              className="flex items-center gap-sm"
            >
              <BookOpen size={20} />
              选择教材
            </Button>
          </div>

          {/* 学习进度信息 */}
          {textbookInfo && selectedSettings.collectionId && (
            <div className="mt-md pt-md border-t border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <TrendingUp size={20} className="text-blue-500" />
                  <div>
                    <p className="text-small font-semibold text-text-primary">
                      学习进度：{getProgressPercentage(selectedSettings.collectionId)}%
                    </p>
                    <p className="text-xs text-text-tertiary">
                      剩余 {getRemainingWords(selectedSettings.collectionId)} 个单词
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-md">
                  <p className="text-xs text-text-tertiary">
                    {formatLastUpdated(selectedSettings.collectionId)}
                  </p>
                  <Button
                    variant="secondary"
                    size="default"
                    onClick={() => resetProgress(selectedSettings.collectionId!)}
                    className="flex items-center gap-xs text-xs px-sm py-xs"
                  >
                    <RotateCcw size={14} />
                    重置
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 设置选项 */}
      <div className="max-w-4xl mx-auto space-y-xl">
        {/* 题干类型选择 */}
        <section>
          <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
            选择题目类型
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {questionTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedSettings.questionType === type.id;
              
              return (
                <Card
                  key={type.id}
                  className={cn(
                    'cursor-pointer transition-all duration-normal border-4',
                    isSelected 
                      ? 'border-primary-500 bg-primary-50 scale-105 shadow-lg' 
                      : 'border-gray-200 hover:border-primary-300 hover:scale-102'
                  )}
                  onClick={() => handleQuestionTypeSelect(type.id)}
                >
                  <div className="text-center">
                    <div className={cn(
                      'w-16 h-16 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center',
                      type.color
                    )}>
                      <Icon size={32} className="text-white" />
                    </div>
                    <h3 className="text-h3 font-bold text-text-primary mb-sm">
                      {type.name}
                    </h3>
                    <p className="text-body text-text-secondary">
                      {type.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 答题方式选择 */}
        <section>
          <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
            选择答题方式
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {answerTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedSettings.answerType === type.id;
              
              return (
                <Card
                  key={type.id}
                  className={cn(
                    'cursor-pointer transition-all duration-normal border-4',
                    isSelected 
                      ? 'border-primary-500 bg-primary-50 scale-105 shadow-lg' 
                      : 'border-gray-200 hover:border-primary-300 hover:scale-102'
                  )}
                  onClick={() => handleAnswerTypeSelect(type.id)}
                >
                  <div className="text-center">
                    <div className={cn(
                      'w-16 h-16 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center',
                      type.color
                    )}>
                      <Icon size={32} className="text-white" />
                    </div>
                    <h3 className="text-h3 font-bold text-text-primary mb-sm">
                      {type.name}
                    </h3>
                    <p className="text-body text-text-secondary">
                      {type.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 出题策略选择 */}
        <section>
          <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
            选择出题策略
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {selectionStrategies.map((strategy) => {
              const Icon = strategy.icon;
              const isSelected = selectedSettings.selectionStrategy === strategy.id;

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
                      'w-16 h-16 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center',
                      strategy.color
                    )}>
                      <Icon size={32} className="text-white" />
                    </div>
                    <h3 className="text-h3 font-bold text-text-primary mb-sm">
                      {strategy.name}
                    </h3>
                    <p className="text-body text-text-secondary mb-sm">
                      {strategy.description}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-sm">
                      <p className="text-small text-text-tertiary">
                        {strategy.detail}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 语音朗读设置 */}
        <section>
          <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
            语音朗读设置
          </h2>
          <Card className="p-lg">
            <div className="space-y-lg">
              {/* 语音引擎选择 */}
              <div>
                <label className="text-body font-bold text-text-primary mb-sm block">
                  语音引擎
                  {!isVoicesLoaded && <span className="text-xs text-text-tertiary ml-sm">(加载中...)</span>}
                </label>
                <select
                  value={selectedSettings.tts?.voiceName || ''}
                  onChange={(e) => {
                    const voiceName = e.target.value;
                    let newLang = selectedSettings.tts?.lang;

                    // 自动更新语言为选中语音的语言
                    if (voiceName) {
                      // 使用灵活匹配，处理名称差异
                      const selectedVoice = voices.find(voice => {
                        const trimmedName = voice.name.trim();
                        const searchName = voiceName.trim();
                        return trimmedName === searchName || trimmedName.includes(searchName) || searchName.includes(trimmedName);
                      });

                      if (selectedVoice) {
                        newLang = selectedVoice.lang;
                      }
                    }

                    // 一次性更新两个值，避免状态更新冲突
                    const newSettings = {
                      ...selectedSettings,
                      tts: {
                        ...selectedSettings.tts!,
                        voiceName: voiceName,
                        lang: newLang,
                      },
                    };
                    setSelectedSettings(newSettings);
                    setSettings(newSettings);
                  }}
                  className="w-full px-md py-sm border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                  disabled={!isVoicesLoaded}
                >
                  <option value="">默认语音（系统自动选择）</option>
                  {voices
                    .filter(voice => voice.lang.startsWith('en') || voice.lang.startsWith('zh'))
                    .map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.displayName}
                      </option>
                    ))}
                </select>
                {/* 显示当前选择的语音信息 */}
                {selectedSettings.tts?.voiceName && (
                  <p className="text-small text-text-tertiary mt-xs">
                    当前语音：
                    {(() => {
                      const voiceName = selectedSettings.tts!.voiceName!;
                      // 优先从 voices 数组中查找
                      const selectedVoice = voices.find(v => {
                        const trimmedName = v.name.trim();
                        const searchName = voiceName.trim();
                        return trimmedName === searchName || trimmedName.includes(searchName) || searchName.includes(trimmedName);
                      });
                      // 如果找到匹配的语音，显示完整信息；否则显示名称
                      return selectedVoice ? selectedVoice.displayName : voiceName;
                    })()}
                  </p>
                )}
                {/* 显示当前语言 */}
                <p className="text-small text-text-tertiary mt-xs">
                  语言：{selectedSettings.tts?.lang || 'en-US'}
                </p>
              </div>

              {/* 语速控制 */}
              <div>
                <div className="flex items-center justify-between mb-sm">
                  <label className="text-body font-bold text-text-primary">
                    语速
                  </label>
                  <span className="text-small text-text-secondary">
                    {selectedSettings.tts?.rate?.toFixed(1) || '0.8'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={selectedSettings.tts?.rate || 0.8}
                  onChange={(e) => handleTtsSettingChange('rate', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-text-tertiary mt-xs">
                  <span>慢</span>
                  <span>正常</span>
                  <span>快</span>
                </div>
              </div>

              {/* 音调控制 */}
              <div>
                <div className="flex items-center justify-between mb-sm">
                  <label className="text-body font-bold text-text-primary">
                    音调
                  </label>
                  <span className="text-small text-text-secondary">
                    {selectedSettings.tts?.pitch?.toFixed(1) || '1.0'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={selectedSettings.tts?.pitch || 1.0}
                  onChange={(e) => handleTtsSettingChange('pitch', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-text-tertiary mt-xs">
                  <span>低</span>
                  <span>正常</span>
                  <span>高</span>
                </div>
              </div>

              {/* 音量控制 */}
              <div>
                <div className="flex items-center justify-between mb-sm">
                  <label className="text-body font-bold text-text-primary">
                    音量
                  </label>
                  <span className="text-small text-text-secondary">
                    {Math.round((selectedSettings.tts?.volume || 1.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={selectedSettings.tts?.volume || 1.0}
                  onChange={(e) => handleTtsSettingChange('volume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-text-tertiary mt-xs">
                  <span>小</span>
                  <span>正常</span>
                  <span>大</span>
                </div>
              </div>

              {/* 测试按钮 */}
              <div className="pt-md border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={handleTtsTest}
                  className="w-full flex items-center justify-center gap-sm"
                >
                  <Speaker size={20} />
                  测试朗读效果
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 保存设置按钮 */}
        <section className="text-center mt-xl">
          <Button
            variant="success"
            size="large"
            onClick={handleSaveSettings}
            className="px-2xl py-md text-h2 font-bold shadow-lg hover:shadow-xl transition-all duration-normal"
          >
            保存设置
          </Button>
        </section>

      </div>
    </div>
  );
};

export { GuessWordSettingsPage };