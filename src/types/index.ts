// 数据验证工具
export interface Word {
  id: number;
  word: string;
  definition: string;
  audioText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  answer: string;
  hint: string;
  word_order?: number;
  created_at?: string;
}

export interface QuestionType {
  id: string;
  name: string;
  description: string;
}

export interface AnswerType {
  id: string;
  name: string;
  description: string;
}

export interface DifficultyLevel {
  id: string;
  name: string;
  color: string;
}

export interface WordData {
  words: Word[];
  questionTypes: QuestionType[];
  answerTypes: AnswerType[];
  difficultyLevels: DifficultyLevel[];
}

// 词汇集合（教材）类型
export interface WordCollection {
  id: string;
  name: string;
  description: string | null;
  category: string;
  textbook_type: string | null;
  grade_level: string | null;
  theme: string | null;
  is_public: boolean;
  word_count: number;
  created_at: string;
  game_id?: string;
}

// 游戏文本配置类型
export interface GameTextConfig {
  // 基础名称
  itemName: string;        // "单词" | "成语" | "字谜"

  // 字段标签
  itemFieldLabel: string;  // "单词" | "成语" | "谜面"
  definitionLabel: string; // "定义" | "解释" | "谜底"
  audioTextLabel: string;  // "音频文本" | "朗读文本" | "提示文本"

  // 提示信息模板(支持变量替换)
  messages: {
    addSuccess: string;       // "添加{itemName}成功"
    addError: string;         // "添加{itemName}失败"
    updateSuccess: string;    // "更新{itemName}成功"
    updateError: string;      // "更新{itemName}失败"
    deleteConfirm: string;    // "确定要删除{itemName}"{name}"吗?"
    deleteSuccess: string;    // "删除{itemName}成功"
    deleteError: string;      // "删除{itemName}失败"
    loadError: string;        // "加载{itemName}失败"
    batchAddTitle: string;    // "批量添加{itemName}"
    masteredCount: string;    // "已掌握 {count} 个{itemName}"
    learningCount: string;    // "正在学习 {count} 个{itemName}"
  };
}

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'guess_word' | 'fill_blank';
  language: 'en' | 'zh';
  default_config: QuizSettings;
  is_active: boolean;
  text_config?: GameTextConfig; // 文本配置(可选,用于自定义显示文本)
}

// 首页游戏数据类型 (基于新的 get_homepage_data API)
export interface HomepageGameData {
  id: string;
  icon: string;
  type: string;
  title: string;
  language: string;
  is_active: boolean;
  description: string;
  text_config: GameTextConfig;
  default_config: QuizSettings;
  collection: {
    id: string;
    name: string;
    total_count: number;
    learning_count: number;
    mastered_count: number;
    remaining_count: number;
  };
  created_at: string;
  updated_at: string;
}

// 教材下拉菜单状态
export interface TextbookDropdownState {
  isOpen: boolean;
  gameId: string | null;
  availableTextbooks: WordCollection[];
  isLoading: boolean;
}

// 词汇选取策略类型
export type WordSelectionStrategy = 'sequential' | 'random';

// TTS语音合成配置
export interface TTSSettings {
  lang: string;          // 语言，如 'en-US'
  rate: number;          // 语速，0.1-10，默认0.8
  pitch: number;         // 音调，0-2，默认1.0
  volume: number;        // 音量，0-1，默认1.0
  voiceName?: string;    // 语音引擎名称（可选）
}

// 应用状态类型
export interface QuizSettings {
  questionType: 'text' | 'audio';
  answerType: 'choice' | 'fill';
  collectionId?: string; // 选择的教材ID
  selectionStrategy?: WordSelectionStrategy; // 词汇选取策略
  tts?: TTSSettings;     // 语音朗读配置
  showPinyin?: boolean;  // 是否显示拼音（仅中文有效）
  gameMode?: 'practice' | 'exam'; // 游戏模式：练习模式(默认) | 考试模式
}

// 答题结果类型
export interface QuizAnswerResult {
  wordId: number;
  answer: string;
  isCorrect: boolean;
  timeSpent?: number; // 单题用时(秒)
}

export interface QuizState {
  settings: QuizSettings;
  currentQuestionIndex: number;
  questions: Word[];
  answers: (string | null)[];
  results?: QuizAnswerResult[]; // 答题结果记录
  isCompleted: boolean;
  score: number;
  startTime?: number; // 游戏开始时间戳
  currentQuestionStartTime?: number; // 当前题目开始时间戳
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  accuracy: number;
  wrongAnswers?: Word[];
}

// 增强的游戏结果页面数据接口
export interface QuestionResult {
  questionIndex: number;
  question: Word;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number; // 单题用时(秒)
}

export interface GradeInfo {
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  color: string;
  bgColor: string;
  description: string;
  celebrationLevel: 'high' | 'medium' | 'low';
}

export interface EnhancedQuizResult extends QuizResult {
  timeSpent?: number;           // 游戏总用时(秒)
  averageTimePerQuestion?: number; // 平均每题用时(秒)
  longestStreak?: number;       // 最长连续正确记录
  questionResults?: QuestionResult[]; // 每题详细结果
  startTime?: number;           // 游戏开始时间戳
  endTime?: number;             // 游戏结束时间戳
}

// 组件Props类型
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'default' | 'large';
  disabled?: boolean;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export interface AudioButtonProps {
  audioText: string;
  isPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  className?: string;
  showTooltip?: boolean;
}
// 选项按钮属性
export interface OptionButtonProps {
  option: React.ReactNode;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  hint?: string;
  isCorrect?: boolean;
  isWrong?: boolean;
  disabled?: boolean;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

// 游戏结果页面组件Props类型
export interface CompactHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export interface GradeDisplayCardProps {
  gradeInfo: GradeInfo;
  accuracy: number;
  showCelebration: boolean;
  className?: string;
}

export interface DetailedStatsGridProps {
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  timeSpent?: number;
  averageTimePerQuestion?: number;
  longestStreak?: number;
  className?: string;
}

export interface QuestionCircleProps {
  questionNumber: number;
  isCorrect: boolean;
  question: Word;
  userAnswer: string;
  animationDelay: number;
  className?: string;
  onHover?: (question: Word, userAnswer: string) => void;
}

export interface QuestionOverviewSectionProps {
  questionResults: QuestionResult[];
  className?: string;
}

// Speech Synthesis类型
export interface SpeechSynthesisOptions {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WordApiResponse extends ApiResponse<any> { }

// 动画类型
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// 主题类型
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

// 统计计算结果类型
export interface DetailedStats {
  averageTimePerQuestion?: number;
  longestStreak: number;
  formattedTime?: string;
  accuracyDisplay: string; // 格式化的准确率显示 (如 "85% (17/20)")
}

// 时间格式化选项
export interface TimeFormatOptions {
  showHours?: boolean;
  showMilliseconds?: boolean;
  format?: 'mm:ss' | 'h:mm:ss' | 'compact';
}

// 悬浮提示内容类型
export interface TooltipContent {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent?: string;
}

// ===== 会员状态相关类型 =====

// 会员状态类型
export type MembershipStatus = 'active' | 'expired' | 'unknown';

// 会员状态信息
export interface MembershipInfo {
  status: MembershipStatus;
  expiresAt?: Date;
  isExpired: boolean;
  daysRemaining?: number;
}

// 续费接口参数
export interface RenewalRequest {
  activationCode: string;
}

// 续费接口响应
export interface RenewalResponse {
  success: boolean;
  message: string;
  newExpiryDate?: string;
}

// 会员状态图标组件Props
export interface MembershipStatusIconProps {
  status: MembershipStatus;
  className?: string;
}

// 用户下拉菜单组件Props（UserProfile从authSlice导入）
export interface UserDropdownMenuProps {
  user: any; // 将在组件中从authSlice导入UserProfile类型
  membershipInfo: MembershipInfo;
  onRenewal?: () => void;
  onClose?: () => void;
}

// 续费模态框组件Props
export interface MembershipRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newExpiryDate: string) => void;
}

