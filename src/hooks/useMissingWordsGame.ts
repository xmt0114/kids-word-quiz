/**
 * useMissingWordsGame Hook
 * "哪个词语不见了？" 游戏核心状态管理Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  GamePhase,
  GameMode,
  GameConfig,
  GameState,
  MissingWord,
  WordPosition,
  CurrentRound,
  UseMissingWordsGameReturn,
  WordRequestParams,
} from '../types/missingWordsGame';
import { DEFAULT_GAME_CONFIG } from '../types/missingWordsGame';
import {
  loadConfig,
  saveConfig,
  validateGameConfig,
  mergeConfig,
} from '../utils/missingWordsGameConfig';
import {
  initializeGameRound,
  executeWordHiding,
} from '../utils/wordGameLogic';
import { fetchWords } from '../services/wordDataService';
import { useMissingWordsGameAudio } from './useMissingWordsGameAudio';
import { useAppStore } from '../stores/appStore';
import { wordAPI } from '../utils/api';
import type { CategoryOption } from '../types/missingWordsGame';
import { letterWords } from '../data/mockWords';

/**
 * 核心游戏状态管理Hook
 */
export function useMissingWordsGame(): UseMissingWordsGameReturn {
  // ===== 音效管理 =====
  const audio = useMissingWordsGameAudio();

  // ===== 状态管理 =====

  // 初始化时加载保存的配置
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedConfig = loadConfig();
    return {
      phase: 'idle',
      mode: savedConfig.gameMode,
      config: savedConfig,
      currentRound: {
        words: [],
        hiddenWords: [],
        allWords: [],
        answerOptions: [],
        wordPositions: [],
        userAnswers: [],
        isCorrect: undefined,
      },
      observationTimeLeft: savedConfig.observationTime,
      showResult: false,
    };
  });

  // 分类管理
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('local_chinese');
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([
    { id: 'local_chinese', name: '汉字', requireMembership: false },
    { id: 'local_letters', name: '字母', requireMembership: false }
  ]);

  // 加载状态
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { session, profile } = useAppStore();

  // 计时器引用
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ===== 阶段转换管理 =====

  /**
   * 转换到指定游戏阶段
   * 集中管理阶段转换逻辑，确保转换的一致性
   */
  const transitionToPhase = useCallback((newPhase: GamePhase) => {
    setGameState(prev => {
      // 验证阶段转换的合法性
      const validTransitions: Record<GamePhase, GamePhase[]> = {
        idle: ['observation'],
        observation: ['curtain'],
        curtain: ['answer'],
        answer: ['result'],
        result: ['idle'],
      };

      const allowedPhases = validTransitions[prev.phase];
      if (!allowedPhases.includes(newPhase)) {
        console.warn(`Invalid phase transition: ${prev.phase} -> ${newPhase}`);
        return prev;
      }

      // 根据新阶段执行相应的清理或初始化
      switch (newPhase) {
        case 'observation':
          // 重置观察时间
          return {
            ...prev,
            phase: newPhase,
            observationTimeLeft: prev.config.observationTime,
            showResult: false,
          };

        case 'curtain':
          // 清除计时器
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return {
            ...prev,
            phase: newPhase,
          };

        case 'answer':
          return {
            ...prev,
            phase: newPhase,
          };

        case 'result':
          return {
            ...prev,
            phase: newPhase,
            showResult: true,
          };

        case 'idle':
          // 重置游戏状态
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return {
            ...prev,
            phase: newPhase,
            observationTimeLeft: prev.config.observationTime,
            showResult: false,
            currentRound: {
              words: [],
              hiddenWords: [],
              allWords: [],
              answerOptions: [],
              wordPositions: [],
              userAnswers: [],
              isCorrect: undefined,
            },
          };

        default:
          return prev;
      }
    });
  }, []);

  // ===== 清理计时器 =====

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ===== 核心方法 =====

  /**
   * 开始游戏
   */
  const startGame = useCallback(async (stageDimensions?: { width: number; height: number }) => {
    setIsLoadingWords(true);
    setLoadError(null);

    try {
      let finalWords: MissingWord[] = [];
      let allPotentialWords: MissingWord[] = [];
      let positions: WordPosition[] = [];

      const currentCategory = availableCategories.find(c => c.id === selectedCategoryId);

      if (selectedCategoryId === 'local_chinese' || (!currentCategory && selectedCategoryId !== 'local_letters')) {
        // 使用本地汉字
        const roundData = initializeGameRound(
          gameState.config,
          'chinese',
          stageDimensions?.width,
          stageDimensions?.height
        );
        finalWords = roundData.words;
        allPotentialWords = roundData.allWords;
        positions = roundData.positions;
      } else if (selectedCategoryId === 'local_letters') {
        // 使用本地字母
        const roundData = initializeGameRound(
          gameState.config,
          letterWords,
          stageDimensions?.width,
          stageDimensions?.height
        );
        finalWords = roundData.words;
        allPotentialWords = roundData.allWords;
        positions = roundData.positions;
      } else {
        // 从 API 安全获取
        if (wordAPI.getRandomWordsSecure) {
          const response = await wordAPI.getRandomWordsSecure({
            collection_ids: currentCategory.collections || [],
            count: gameState.config.wordCount + 5, // 多取几个作为干扰项
          });

          if (response.success && response.data) {
            const apiWords: MissingWord[] = response.data.map((w: any) => ({
              id: w.id.toString(),
              text: w.word,
              language: 'chinese', // 默认为中文，或者根据API返回判断
            }));

            const roundData = initializeGameRound(
              gameState.config,
              apiWords,
              stageDimensions?.width,
              stageDimensions?.height
            );
            finalWords = roundData.words;
            allPotentialWords = roundData.allWords;
            positions = roundData.positions;
          } else {
            // 处理错误，特别是会员过期
            const errorMsg = response.message === 'MEMBERSHIP_EXPIRED' || response.error === 'VIP_REQUIRED'
              ? 'MEMBERSHIP_EXPIRED'
              : (response.error || '获取单词失败');

            setLoadError(errorMsg);
            setIsLoadingWords(false);
            return;
          }
        }
      }

      // 播放开始游戏音效
      audio.playStart();

      // 更新游戏状态
      setGameState(prev => ({
        ...prev,
        currentRound: {
          words: finalWords,
          hiddenWords: [],
          allWords: allPotentialWords,
          answerOptions: [],
          wordPositions: positions,
          userAnswers: [],
          isCorrect: undefined,
        },
      }));

      // 转换到观察阶段
      transitionToPhase('observation');

      // 如果是挑战模式，启动倒计时
      if (gameState.mode === 'challenge') {
        startObservationTimer();
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      setLoadError('游戏初始化失败，请稍后重试');
    } finally {
      setIsLoadingWords(false);
    }
  }, [gameState.config, gameState.mode, transitionToPhase, audio, selectedCategoryId, availableCategories]);

  /**
   * 启动观察阶段倒计时（挑战模式）
   */
  const startObservationTimer = useCallback(() => {
    // 清除现有计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 启动新计时器
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = prev.observationTimeLeft - 1;

        if (newTimeLeft <= 0) {
          // 时间到，自动进入幕布阶段
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // 使用transitionToPhase确保正确的阶段转换
          setTimeout(() => transitionToPhase('curtain'), 0);
          return {
            ...prev,
            observationTimeLeft: 0,
          };
        }

        return {
          ...prev,
          observationTimeLeft: newTimeLeft,
        };
      });
    }, 1000);
  }, [transitionToPhase]);

  /**
   * 处理幕布完成（词语已隐藏）
   * 这个方法会在幕布动画完成后被调用
   */
  const handleCurtainComplete = useCallback(() => {
    setGameState(prev => {
      // 安全检查：如果不是幕布阶段，或者已经执行过隐藏逻辑（hiddenWords不为空），则直接返回
      if (prev.phase !== 'curtain' || prev.currentRound.hiddenWords.length > 0) {
        console.log('[useMissingWordsGame] handleCurtainComplete ignored to prevent duplication');
        return prev;
      }

      console.log('[useMissingWordsGame] Executing word hiding logic...');
      // 执行词语隐藏逻辑
      const { hiddenWords, remainingWords, answerOptions } = executeWordHiding(
        prev.currentRound.words,
        prev.currentRound.allWords.slice(prev.config.wordCount), // 干扰项
        prev.config
      );

      // 更新词语位置，只保留剩余词语的位置
      const remainingWordIds = new Set(remainingWords.map(w => w.id));
      const remainingPositions = prev.currentRound.wordPositions.filter(
        pos => remainingWordIds.has(pos.wordId)
      );

      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          words: remainingWords,
          hiddenWords,
          answerOptions,
          wordPositions: remainingPositions,
        },
      };
    });

    // 转换到答题阶段
    transitionToPhase('answer');
  }, [transitionToPhase]);

  /**
   * 处理观察完成（休闲模式手动触发）
   */
  const handleObservationComplete = useCallback(() => {
    // 播放点击音效
    audio.playClick();

    // 清除计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 进入幕布阶段
    transitionToPhase('curtain');

    // 播放幕布音效
    audio.playCurtain();
  }, [transitionToPhase, audio]);

  /**
   * 处理答案选择
   */
  const handleAnswerSelect = useCallback((wordId: string) => {
    // 播放点击音效
    audio.playClick();

    setGameState(prev => {
      const { userAnswers } = prev.currentRound;
      const { hiddenCount } = prev.config;

      let newAnswers: string[];

      if (hiddenCount === 1) {
        // 单选模式：直接替换
        newAnswers = [wordId];
      } else {
        // 多选模式：切换选择状态
        if (userAnswers.includes(wordId)) {
          newAnswers = userAnswers.filter(id => id !== wordId);
        } else {
          // 限制最多选择hiddenCount个
          if (userAnswers.length < hiddenCount) {
            newAnswers = [...userAnswers, wordId];
          } else {
            newAnswers = userAnswers;
          }
        }
      }

      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          userAnswers: newAnswers,
        },
      };
    });
  }, [audio]);

  /**
   * 提交答案（挑战模式）
   */
  const handleSubmitAnswer = useCallback(() => {
    setGameState(prev => {
      const { userAnswers, hiddenWords } = prev.currentRound;
      const hiddenWordIds = hiddenWords.map(w => w.id);

      // 检查答案是否正确
      const isCorrect =
        userAnswers.length === hiddenWordIds.length &&
        userAnswers.every(id => hiddenWordIds.includes(id));

      // 播放相应的音效
      if (isCorrect) {
        audio.playSuccess();
      } else {
        audio.playError();
      }

      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          isCorrect,
        },
      };
    });

    // 转换到结果阶段
    transitionToPhase('result');
  }, [transitionToPhase, audio]);

  /**
   * 显示答案（休闲模式）
   */
  const handleShowAnswer = useCallback(() => {
    // 播放点击音效
    audio.playClick();
    transitionToPhase('result');
  }, [transitionToPhase, audio]);

  /**
   * 更新游戏配置
   */
  const updateConfig = useCallback((newConfig: Partial<GameConfig>) => {
    setGameState(prev => {
      // 合并并验证新配置
      const mergedConfig = mergeConfig(prev.config, newConfig);

      // 验证配置
      const validation = validateGameConfig(mergedConfig);
      if (!validation.isValid) {
        console.error('配置验证失败:', validation.errors);
        return prev;
      }

      // 保存配置到本地存储
      const saved = saveConfig(mergedConfig);
      if (!saved) {
        console.error('保存配置失败');
      }

      return {
        ...prev,
        config: mergedConfig,
        mode: mergedConfig.gameMode,
        observationTimeLeft: mergedConfig.observationTime,
      };
    });
  }, []);

  /**
   * 重置游戏
   */
  const resetGame = useCallback(() => {
    transitionToPhase('idle');
  }, [transitionToPhase]);

  /**
   * 为未来扩展预留的数据加载方法
   */
  const loadWordsFromSource = useCallback(async (params: WordRequestParams) => {
    try {
      // 从数据源获取词语
      const words = await fetchWords(params);

      // 更新游戏状态（这里可以根据需要更新）
      console.log('Loaded words from source:', words.length);

      // 未来可以在这里更新游戏状态，使用加载的词语
      // setGameState(prev => ({ ...prev, ... }));

      return words;
    } catch (error) {
      console.error('Failed to load words from source:', error);
      throw error;
    }
  }, []);

  // ===== 返回值 =====

  return {
    // 游戏状态
    gamePhase: gameState.phase,
    gameMode: gameState.mode,
    config: gameState.config,

    // 词语数据
    currentWords: gameState.currentRound.words,
    hiddenWords: gameState.currentRound.hiddenWords,
    allWords: gameState.currentRound.allWords,
    answerOptions: gameState.currentRound.answerOptions,
    wordPositions: gameState.currentRound.wordPositions,

    // 计时器
    observationTimeLeft: gameState.observationTimeLeft,

    // 用户交互
    selectedAnswers: gameState.currentRound.userAnswers,
    showResult: gameState.showResult,
    isCorrect: gameState.currentRound.isCorrect,

    // 方法
    startGame,
    handleObservationComplete,
    handleCurtainComplete,
    handleAnswerSelect,
    handleSubmitAnswer,
    handleShowAnswer,
    updateConfig,
    resetGame,

    // 分类选择
    selectedCategoryId,
    setSelectedCategoryId,
    availableCategories,
    setAvailableCategories,

    // 状态检查
    isLoadingWords,
    loadError,

    loadWordsFromSource,
  };
}
