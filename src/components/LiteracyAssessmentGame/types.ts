/**
 * Literacy Assessment Game Type Definitions
 * 儿童识字量测试游戏类型定义
 */

// ==================== Game Phase ====================

/**
 * 游戏阶段
 */
export type GamePhase =
  | 'age-selection'    // 年龄选择
  | 'assessment'       // 测试进行中
  | 'level-transition' // 等级过渡
  | 'final-transition' // 最终过渡
  | 'result';          // 结果展示

// ==================== Assessment Question ====================

/**
 * 测试题目
 */
export interface AssessmentQuestion {
  id: number;
  character: string;              // 正确答案（汉字）
  audio_prompt_text: string;      // 音频提示文本（用于TTS播放）
  confusion_options: string[];    // 混淆选项（最多3个）
}

// ==================== Level Info ====================

/**
 * 等级信息
 */
export interface LevelInfo {
  title: string;           // 等级标题，如"汉字启蒙"、"一年级"
  pass_message: string;    // 通过提示消息
  vocab_milestone: number; // 词汇量里程碑
}

// ==================== Level Packet ====================

/**
 * 等级题包配置
 */
export interface LevelPacketConfig {
  drop_threshold: number;  // 失败阈值（正确率低于此值直接失败）
  pass_threshold: number;  // 通过阈值（正确率高于此值直接通过）
}

/**
 * 等级题包
 */
export interface LevelPacket {
  level: number;                      // 等级编号
  config: LevelPacketConfig;          // 配置（阈值）
  base_set: AssessmentQuestion[];     // 基础题集
  rescue_set: AssessmentQuestion[];   // 急救题集
  level_info: LevelInfo;              // 等级信息
}

// ==================== Packet Result ====================

/**
 * 题包结果
 */
export interface PacketResult {
  level: number;    // 等级编号
  passed: boolean;  // 是否通过
  correct: number;  // 正确题数
  total: number;    // 总题数
}

// ==================== Assessment Session ====================

/**
 * 测试会话
 */
export interface AssessmentSession {
  sessionId: string;                // 会话ID
  birthDate: string;                // 出生日期（YYYY-MM-DD）
  currentPacketIndex: number;       // 当前题包索引
  packets: LevelPacket[];           // 所有题包
  allResults: PacketResult[];       // 所有结果
}

// ==================== Chart Data ====================

/**
 * 图表数据（正态分布）
 */
export interface ChartData {
  mean: number;              // 平均识字量
  max_val: number;           // 最高识字量
  std_dev: number;           // 标准差
  user_percentile: number;   // 用户百分位
}

// ==================== Conclusion ====================

/**
 * 结论信息
 */
export interface Conclusion {
  text: string;              // 结论文本
  level_title: string;       // 等级标题（如"大师级"）
  comparison_text: string;   // 对比文本
}

// ==================== Assessment Report ====================

/**
 * 测试报告
 */
export interface AssessmentReport {
  score: number;           // 识字量分数
  user_age: number;        // 用户年龄
  chart_data: ChartData;   // 图表数据
  conclusion: Conclusion;  // 结论信息
}

// ==================== Game State ====================

/**
 * 当前题集类型
 */
export type CurrentSetType = 'base' | 'rescue';

/**
 * 游戏状态
 */
export interface GameState {
  phase: GamePhase;                           // 当前阶段
  session: AssessmentSession | null;          // 测试会话
  currentQuestion: AssessmentQuestion | null; // 当前题目
  currentQuestionIndex: number;               // 当前题目索引
  currentSetType: CurrentSetType;             // 当前题集类型
  currentSetAnswers: boolean[];               // 当前题集的答案记录
  showFeedback: boolean;                      // 是否显示反馈
  isCorrect: boolean | null;                  // 当前答案是否正确
  report: AssessmentReport | null;            // 测试报告
  nextLevelData: SubmitPacketResponse | null; // 预加载的下一关数据
  isLoading: boolean;                         // 是否加载中
  error: string | null;                       // 错误信息
}

// ==================== API Request/Response ====================

/**
 * 开始测试请求参数
 */
export interface StartAssessmentRequest {
  p_birth_date: string; // 出生日期（YYYY-MM-DD）
}

/**
 * 开始测试响应
 */
export interface StartAssessmentResponse {
  packets: LevelPacket[];
  session_id: string;
}

/**
 * 提交结果请求参数
 */
export interface SubmitPacketRequest {
  p_session_id: string;
  p_results: PacketResult[];
}

/**
 * 提交结果响应
 */
export interface SubmitPacketResponse {
  status: 'active' | 'completed';
  packets?: LevelPacket[];  // 如果status为active，包含新的题包
  report?: AssessmentReport; // 如果status为completed，包含最终报告
}

// ==================== Age Validation ====================

/**
 * 年龄验证结果
 */
export interface AgeValidationResult {
  isValid: boolean;
  age?: number;
  error?: string;
}

// ==================== Component Props ====================

/**
 * 年龄选择器组件Props
 */
export interface AgeSelectorProps {
  onStartAssessment: (birthDate: string) => void;
  onBack?: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * 题目展示组件Props
 */
export interface QuestionDisplayProps {
  question: AssessmentQuestion;
  options: string[];  // 选项数组（已随机排序）
  onAnswer: (answer: string) => void;
  showFeedback: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

/**
 * 等级过渡组件Props
 */
export interface LevelTransitionProps {
  levelInfo: LevelInfo;
  onComplete: () => void;
}

/**
 * 最终过渡组件Props
 */
export interface FinalTransitionProps {
  onComplete: () => void;
}

/**
 * 结果展示组件Props
 */
export interface ResultDisplayProps {
  report: AssessmentReport;
  onRestart: () => void;
  onBack?: () => void;
}

/**
 * 正态分布图组件Props
 */
export interface NormalDistributionChartProps {
  chartData: ChartData;
  userScore: number;
  userAge: number;
}

// ==================== Hook Return Type ====================

/**
 * useLiteracyAssessmentGame Hook 返回类型
 */
export interface UseLiteracyAssessmentGameReturn {
  // 状态
  gameState: GameState;

  // 方法
  startAssessment: (birthDate: string) => Promise<void>;
  submitAnswer: (answer: string) => void;
  nextQuestion: () => void;
  completeLevelTransition: () => void;
  completeFinalTransition: () => void;
  restartAssessment: () => void;

  // 辅助方法
  validateAge: (birthDate: string) => AgeValidationResult;
  getCurrentOptions: () => string[];
}

// ==================== Utility Types ====================

/**
 * 等级区间类型
 */
export type LevelTier = 'novice' | 'standard' | 'expert' | 'master';

/**
 * 等级区间信息
 */
export interface LevelTierInfo {
  name: string;
  minPercentile: number;
  maxPercentile: number;
  color: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

/**
 * 统一的等级配置
 */
export const ASSESSMENT_LEVELS: LevelTierInfo[] = [
  { name: '菜鸟级', minPercentile: 0, maxPercentile: 5, color: '#94a3b8', bgColor: 'bg-slate-50', textColor: 'text-slate-600', iconColor: 'from-slate-400 to-slate-500' },
  { name: '新手级', minPercentile: 5, maxPercentile: 20, color: '#60a5fa', bgColor: 'bg-blue-50', textColor: 'text-blue-600', iconColor: 'from-blue-400 to-blue-500' },
  { name: '标准级', minPercentile: 20, maxPercentile: 80, color: '#38bdf8', bgColor: 'bg-sky-50', textColor: 'text-sky-600', iconColor: 'from-sky-400 to-sky-500' },
  { name: '高手级', minPercentile: 80, maxPercentile: 95, color: '#4ade80', bgColor: 'bg-green-50', textColor: 'text-green-600', iconColor: 'from-green-400 to-green-500' },
  { name: '大师级', minPercentile: 95, maxPercentile: 100, color: '#facc15', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600', iconColor: 'from-yellow-400 to-yellow-500' },
];
