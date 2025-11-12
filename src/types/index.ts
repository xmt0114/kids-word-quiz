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

export interface OptionButtonProps {
  option: string;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  onClick: () => void;
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

export interface WordApiResponse extends ApiResponse<any> {}

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