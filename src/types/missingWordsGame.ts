/**
 * Missing Words Game Type Definitions
 * "哪个词语不见了？" 游戏类型定义
 */

// ===== 游戏配置类型 =====

/**
 * 游戏模式
 * - casual: 休闲模式（不限时观察，手动触发消失）
 * - challenge: 挑战模式（限时观察，自动消失，需要答题）
 */
export type GameMode = 'casual' | 'challenge';

/**
 * 游戏配置接口
 */
export interface GameConfig {
  /** 游戏模式 */
  gameMode: GameMode;
  /** 每局需要观察的词语数量 (3-8) */
  wordCount: number;
  /** 每局随机消失的词语数量 (1-3) */
  hiddenCount: number;
  /** 挑战模式下的观察时间（秒）(3-10) */
  observationTime: number;
}

/**
 * 默认游戏配置
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  gameMode: 'casual',
  wordCount: 4,
  hiddenCount: 1,
  observationTime: 5,
};

// ===== 词语数据类型 =====

/**
 * 词语语言类型
 */
export type WordLanguage = 'chinese' | 'english';

/**
 * 词语接口
 */
export interface MissingWord {
  /** 词语唯一标识 */
  id: string;
  /** 词语文本 */
  text: string;
  /** 词语语言 */
  language: WordLanguage;
  /** 词语分类（可选） */
  category?: string;
}

/**
 * 词语位置信息
 */
export interface WordPosition {
  /** 词语ID */
  wordId: string;
  /** X坐标（百分比或像素） */
  x: number;
  /** Y坐标（百分比或像素） */
  y: number;
  /** 旋转角度（度） */
  rotation?: number;
}

// ===== 游戏状态类型 =====

/**
 * 游戏阶段
 * - idle: 空闲状态（游戏未开始）
 * - observation: 观察阶段（玩家观察词语）
 * - curtain: 幕布阶段（幕布遮挡，词语消失）
 * - answer: 答题阶段（玩家识别消失的词语）
 * - result: 结果阶段（显示答案和反馈）
 */
export type GamePhase = 'idle' | 'observation' | 'curtain' | 'answer' | 'result';

/**
 * 当前回合数据
 */
export interface CurrentRound {
  /** 当前显示的词语列表 */
  words: MissingWord[];
  /** 消失的词语列表 */
  hiddenWords: MissingWord[];
  /** 所有词语（包括干扰项） */
  allWords: MissingWord[];
  /** 答题选项（挑战模式） */
  answerOptions: MissingWord[];
  /** 词语位置信息 */
  wordPositions: WordPosition[];
  /** 用户选择的答案ID列表 */
  userAnswers: string[];
  /** 是否答对 */
  isCorrect?: boolean;
}

/**
 * 游戏状态接口
 */
export interface GameState {
  /** 当前游戏阶段 */
  phase: GamePhase;
  /** 游戏模式 */
  mode: GameMode;
  /** 游戏配置 */
  config: GameConfig;
  /** 当前回合数据 */
  currentRound: CurrentRound;
  /** 观察剩余时间（秒） */
  observationTimeLeft: number;
  /** 是否显示结果 */
  showResult: boolean;
}

// ===== 数据源接口（为未来扩展预留） =====

/**
 * 词语请求参数
 */
export interface WordRequestParams {
  /** 需要的词语数量 */
  count: number;
  /** 词语语言 */
  language?: WordLanguage | 'mixed';
  /** 难度级别 */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** 词语分类 */
  category?: string;
}

/**
 * 词语数据源接口（为未来API集成预留）
 */
export interface WordDataSource {
  /**
   * 获取词语列表
   * @param params 请求参数
   * @returns 词语列表
   */
  getWords(params: WordRequestParams): Promise<MissingWord[]>;
}

// ===== 音效管理类型 =====

/**
 * 音效类型
 */
export type SoundType = 
  | 'cardAppear'    // 卡片出现
  | 'click'         // 点击
  | 'success'       // 成功
  | 'error'         // 错误
  | 'curtain';      // 幕布

/**
 * 音效管理器接口
 */
export interface AudioManager {
  /** 播放卡片出现音效 */
  playCardAppear: () => void;
  /** 播放点击音效 */
  playClick: () => void;
  /** 播放成功音效 */
  playSuccess: () => void;
  /** 播放错误音效 */
  playError: () => void;
  /** 播放幕布音效 */
  playCurtain: () => void;
}

// ===== 组件Props类型 =====

/**
 * WordCard组件Props
 */
export interface WordCardProps {
  /** 词语数据 */
  word: MissingWord;
  /** 是否可见 */
  isVisible: boolean;
  /** 位置信息 */
  position: WordPosition;
  /** 动画延迟（毫秒） */
  animationDelay: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * GameStage组件Props
 */
export interface GameStageProps {
  /** 词语列表 */
  words: MissingWord[];
  /** 词语位置列表 */
  wordPositions: WordPosition[];
  /** 游戏阶段 */
  gamePhase: GamePhase;
  /** 游戏模式 */
  gameMode: GameMode;
  /** 观察剩余时间（秒） */
  observationTimeLeft: number;
  /** 观察总时间（秒） */
  observationTotalTime: number;
  /** 幕布完成回调 */
  onCurtainComplete: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * CurtainEffect组件Props
 */
export interface CurtainEffectProps {
  /** 是否激活幕布效果 */
  isActive: boolean;
  /** 完成回调 */
  onComplete: () => void;
  /** 确保幕布完全遮挡舞台 */
  fullCoverage: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * GameControls组件Props
 */
export interface GameControlsProps {
  /** 游戏阶段 */
  gamePhase: GamePhase;
  /** 游戏模式 */
  gameMode: GameMode;
  /** 剩余时间 */
  timeLeft: number;
  /** 答题选项 */
  answerOptions: MissingWord[];
  /** 已选择的答案 */
  selectedAnswers: string[];
  /** 消失的词语数量（用于判断单选/多选） */
  hiddenCount: number;
  /** 观察完成回调 */
  onObservationComplete: () => void;
  /** 答案选择回调 */
  onAnswerSelect: (wordId: string) => void;
  /** 提交答案回调 */
  onSubmitAnswer: () => void;
  /** 显示答案回调 */
  onShowAnswer: () => void;
  /** 开始游戏回调 */
  onStartGame: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * GameConfigModal组件Props
 */
export interface GameConfigModalProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 当前配置 */
  currentConfig: GameConfig;
  /** 关闭回调 */
  onClose: () => void;
  /** 保存回调 */
  onSave: (config: GameConfig) => void;
}

/**
 * Timer组件Props
 */
export interface TimerProps {
  /** 剩余时间（秒） */
  timeLeft: number;
  /** 总时间（秒） */
  totalTime: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * AnswerOptions组件Props
 */
export interface AnswerOptionsProps {
  /** 选项列表 */
  options: MissingWord[];
  /** 已选择的答案 */
  selectedAnswers: string[];
  /** 是否为多选模式 */
  isMultiSelect: boolean;
  /** 是否显示结果 */
  showResult: boolean;
  /** 正确答案列表 */
  correctAnswers: string[];
  /** 选择回调 */
  onSelect: (wordId: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ===== Hook返回类型 =====

/**
 * useMissingWordsGame Hook返回类型
 */
export interface UseMissingWordsGameReturn {
  // 游戏状态
  gamePhase: GamePhase;
  gameMode: GameMode;
  config: GameConfig;
  
  // 词语数据
  currentWords: MissingWord[];
  hiddenWords: MissingWord[];
  allWords: MissingWord[];
  answerOptions: MissingWord[];
  wordPositions: WordPosition[];
  
  // 计时器
  observationTimeLeft: number;
  
  // 用户交互
  selectedAnswers: string[];
  showResult: boolean;
  isCorrect: boolean | undefined;
  
  // 方法
  startGame: () => void;
  handleObservationComplete: () => void;
  handleCurtainComplete: () => void;
  handleAnswerSelect: (wordId: string) => void;
  handleSubmitAnswer: () => void;
  handleShowAnswer: () => void;
  updateConfig: (newConfig: Partial<GameConfig>) => void;
  resetGame: () => void;
  
  // 为未来扩展预留的数据获取方法
  loadWordsFromSource?: (params: WordRequestParams) => Promise<MissingWord[]>;
}

// ===== 工具类型 =====

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errors: string[];
}

/**
 * 答案验证结果
 */
export interface AnswerValidationResult {
  /** 是否正确 */
  isCorrect: boolean;
  /** 正确答案列表 */
  correctAnswers: string[];
  /** 用户答案列表 */
  userAnswers: string[];
  /** 错误的答案列表 */
  wrongAnswers: string[];
  /** 遗漏的答案列表 */
  missedAnswers: string[];
}
