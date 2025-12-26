/**
 * Type Validation for Missing Words Game
 * 类型定义验证文件 - 确保类型定义的完整性和正确性
 * 
 * 这个文件通过TypeScript的类型检查来验证类型定义
 * 如果类型定义有问题，编译时会报错
 */

import type {
  GameMode,
  GameConfig,
  WordLanguage,
  MissingWord,
  WordPosition,
  GamePhase,
  CurrentRound,
  GameState,
  WordRequestParams,
  WordDataSource,
  SoundType,
  AudioManager,
  WordCardProps,
  GameStageProps,
  CurtainEffectProps,
  GameControlsProps,
  GameConfigModalProps,
  TimerProps,
  AnswerOptionsProps,
  UseMissingWordsGameReturn,
  ConfigValidationResult,
  AnswerValidationResult,
} from '../missingWordsGame';

import { DEFAULT_GAME_CONFIG } from '../missingWordsGame';

// ===== 基础类型验证 =====

// 验证GameMode类型
const validGameModes: GameMode[] = ['casual', 'challenge'];
const testGameMode: GameMode = 'casual';

// 验证WordLanguage类型
const validLanguages: WordLanguage[] = ['chinese', 'english'];
const testLanguage: WordLanguage = 'chinese';

// 验证GamePhase类型
const validPhases: GamePhase[] = ['idle', 'observation', 'curtain', 'answer', 'result'];
const testPhase: GamePhase = 'idle';

// 验证SoundType类型
const validSoundTypes: SoundType[] = ['cardAppear', 'click', 'success', 'error', 'curtain'];
const testSoundType: SoundType = 'click';

// ===== 接口验证 =====

// 验证GameConfig接口
const testGameConfig: GameConfig = {
  gameMode: 'casual',
  wordCount: 4,
  hiddenCount: 1,
  observationTime: 5,
};

// 验证默认配置
const testDefaultConfig: GameConfig = DEFAULT_GAME_CONFIG;

// 验证MissingWord接口
const testWord: MissingWord = {
  id: '1',
  text: '苹果',
  language: 'chinese',
  category: 'fruit',
};

// 验证WordPosition接口
const testPosition: WordPosition = {
  wordId: '1',
  x: 100,
  y: 200,
  rotation: 15,
};

// 验证CurrentRound接口
const testRound: CurrentRound = {
  words: [testWord],
  hiddenWords: [],
  allWords: [testWord],
  answerOptions: [],
  wordPositions: [testPosition],
  userAnswers: [],
  isCorrect: undefined,
};

// 验证GameState接口
const testGameState: GameState = {
  phase: 'idle',
  mode: 'casual',
  config: testGameConfig,
  currentRound: testRound,
  observationTimeLeft: 5,
  showResult: false,
};

// 验证WordRequestParams接口
const testRequestParams: WordRequestParams = {
  count: 10,
  language: 'chinese',
  difficulty: 'easy',
  category: 'fruit',
};

// 验证WordDataSource接口
const testDataSource: WordDataSource = {
  getWords: async (params: WordRequestParams): Promise<MissingWord[]> => {
    return [testWord];
  },
};

// 验证AudioManager接口
const testAudioManager: AudioManager = {
  playCardAppear: () => {},
  playClick: () => {},
  playSuccess: () => {},
  playError: () => {},
  playCurtain: () => {},
};

// ===== 组件Props验证 =====

// 验证WordCardProps
const testWordCardProps: WordCardProps = {
  word: testWord,
  isVisible: true,
  position: testPosition,
  animationDelay: 100,
  className: 'test-class',
};

// 验证GameStageProps
const testGameStageProps: GameStageProps = {
  words: [testWord],
  wordPositions: [testPosition],
  gamePhase: 'observation',
  gameMode: 'casual',
  observationTimeLeft: 5,
  observationTotalTime: 5,
  onCurtainComplete: () => {},
  className: 'test-class',
};

// 验证CurtainEffectProps
const testCurtainProps: CurtainEffectProps = {
  isActive: true,
  onComplete: () => {},
  fullCoverage: true,
  className: 'test-class',
};

// 验证GameControlsProps
const testGameControlsProps: GameControlsProps = {
  gamePhase: 'observation',
  gameMode: 'casual',
  timeLeft: 5,
  answerOptions: [testWord],
  selectedAnswers: [],
  hiddenCount: 1,
  onObservationComplete: () => {},
  onAnswerSelect: (wordId: string) => {},
  onSubmitAnswer: () => {},
  onShowAnswer: () => {},
  onStartGame: () => {},
  className: 'test-class',
};

// 验证GameConfigModalProps
const testConfigModalProps: GameConfigModalProps = {
  isOpen: true,
  currentConfig: testGameConfig,
  onClose: () => {},
  onSave: (config: GameConfig) => {},
};

// 验证TimerProps
const testTimerProps: TimerProps = {
  timeLeft: 5,
  totalTime: 10,
  className: 'test-class',
};

// 验证AnswerOptionsProps
const testAnswerOptionsProps: AnswerOptionsProps = {
  options: [testWord],
  selectedAnswers: [],
  isMultiSelect: false,
  showResult: false,
  correctAnswers: ['1'],
  onSelect: (wordId: string) => {},
  disabled: false,
  className: 'test-class',
};

// ===== Hook返回类型验证 =====

// 验证UseMissingWordsGameReturn
const testHookReturn: UseMissingWordsGameReturn = {
  gamePhase: 'idle',
  gameMode: 'casual',
  config: testGameConfig,
  currentWords: [testWord],
  hiddenWords: [],
  allWords: [testWord],
  answerOptions: [],
  wordPositions: [testPosition],
  observationTimeLeft: 5,
  selectedAnswers: [],
  showResult: false,
  isCorrect: undefined,
  startGame: () => {},
  handleObservationComplete: () => {},
  handleCurtainComplete: () => {},
  handleAnswerSelect: (wordId: string) => {},
  handleSubmitAnswer: () => {},
  handleShowAnswer: () => {},
  updateConfig: (newConfig: Partial<GameConfig>) => {},
  resetGame: () => {},
  loadWordsFromSource: async (params: WordRequestParams) => { return []; },
};

// ===== 工具类型验证 =====

// 验证ConfigValidationResult
const testConfigValidation: ConfigValidationResult = {
  isValid: true,
  errors: [],
};

// 验证AnswerValidationResult
const testAnswerValidation: AnswerValidationResult = {
  isCorrect: true,
  correctAnswers: ['1'],
  userAnswers: ['1'],
  wrongAnswers: [],
  missedAnswers: [],
};

// ===== 边界值验证 =====

// 验证配置边界值
const minConfig: GameConfig = {
  gameMode: 'casual',
  wordCount: 3,  // 最小值
  hiddenCount: 1,  // 最小值
  observationTime: 3,  // 最小值
};

const maxConfig: GameConfig = {
  gameMode: 'challenge',
  wordCount: 8,  // 最大值
  hiddenCount: 3,  // 最大值
  observationTime: 10,  // 最大值
};

// ===== 类型兼容性验证 =====

// 验证Partial类型兼容性
const partialConfig: Partial<GameConfig> = {
  wordCount: 5,
};

// 验证可选属性
const wordWithoutCategory: MissingWord = {
  id: '2',
  text: 'apple',
  language: 'english',
  // category是可选的
};

const positionWithoutRotation: WordPosition = {
  wordId: '1',
  x: 100,
  y: 200,
  // rotation是可选的
};

// ===== 导出验证函数（用于运行时验证） =====

/**
 * 验证游戏配置是否有效
 */
export function validateGameConfig(config: GameConfig): ConfigValidationResult {
  const errors: string[] = [];

  if (config.wordCount < 3 || config.wordCount > 8) {
    errors.push('wordCount must be between 3 and 8');
  }

  if (config.hiddenCount < 1 || config.hiddenCount > 3) {
    errors.push('hiddenCount must be between 1 and 3');
  }

  if (config.observationTime < 3 || config.observationTime > 10) {
    errors.push('observationTime must be between 3 and 10');
  }

  if (config.hiddenCount > config.wordCount) {
    errors.push('hiddenCount cannot be greater than wordCount');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 验证词语对象是否有效
 */
export function validateWord(word: MissingWord): boolean {
  return (
    typeof word.id === 'string' &&
    word.id.length > 0 &&
    typeof word.text === 'string' &&
    word.text.length > 0 &&
    (word.language === 'chinese' || word.language === 'english')
  );
}

/**
 * 验证中文词语长度
 */
export function validateChineseWordLength(word: MissingWord): boolean {
  if (word.language !== 'chinese') return true;
  return word.text.length <= 4;
}

// 类型验证通过 - 如果这个文件能够编译通过，说明所有类型定义都是正确的
console.log('✓ All type definitions are valid');
