/**
 * LiteracyAssessmentGame Component Exports
 * 儿童识字量测试游戏组件导出
 */

// 主页面组件
export { LiteracyAssessmentGamePage } from './LiteracyAssessmentGamePage';

// 子组件
export { AgeSelector } from './AgeSelector';
export { QuestionDisplay } from './QuestionDisplay';
export { LevelTransition } from './LevelTransition';
export { NormalDistributionChart } from './NormalDistributionChart';
export { ResultDisplay } from './ResultDisplay';

// Hook
export { useLiteracyAssessmentGame, loadSavedBirthDate } from './useLiteracyAssessmentGame';

// 类型定义
export type {
  GamePhase,
  GameState,
  AssessmentQuestion,
  AssessmentSession,
  LevelPacket,
  LevelInfo,
  PacketResult,
  AssessmentReport,
  ChartData,
  Conclusion,
  AgeSelectorProps,
  QuestionDisplayProps,
  LevelTransitionProps,
  ResultDisplayProps,
  NormalDistributionChartProps,
  UseLiteracyAssessmentGameReturn,
} from './types';
