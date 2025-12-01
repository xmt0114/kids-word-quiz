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
}

// 答题结果类型
export interface QuizAnswerResult {
  wordId: number;
  answer: string;
  isCorrect: boolean;
}

export interface QuizState {
  settings: QuizSettings;
  currentQuestionIndex: number;
  questions: Word[];
  answers: (string | null)[];
  results?: QuizAnswerResult[]; // 答题结果记录
  isCompleted: boolean;
  score: number;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  accuracy: number;
  wrongAnswers?: Word[];
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