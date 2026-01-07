/**
 * API数据验证和转换工具
 * 用于验证和转换识字量测试API返回的数据
 */

import type { LevelPacket, AssessmentReport } from './types';

// ==================== 验证函数 ====================

/**
 * 验证题目数据
 */
function validateQuestion(question: any): boolean {
  if (!question || typeof question !== 'object') return false;
  
  return (
    typeof question.id === 'number' &&
    typeof question.character === 'string' &&
    question.character.length > 0 &&
    typeof question.audio_prompt_text === 'string' &&
    Array.isArray(question.confusion_options) &&
    question.confusion_options.length > 0 &&
    question.confusion_options.every((opt: any) => typeof opt === 'string')
  );
}

/**
 * 验证题包配置
 */
function validateConfig(config: any): boolean {
  if (!config || typeof config !== 'object') return false;
  
  return (
    typeof config.pass_threshold === 'number' &&
    config.pass_threshold >= 0 &&
    config.pass_threshold <= 1 &&
    typeof config.drop_threshold === 'number' &&
    config.drop_threshold >= 0 &&
    config.drop_threshold <= 1 &&
    config.drop_threshold < config.pass_threshold
  );
}

/**
 * 验证等级信息
 */
function validateLevelInfo(levelInfo: any): boolean {
  if (!levelInfo || typeof levelInfo !== 'object') return false;
  
  return (
    typeof levelInfo.title === 'string' &&
    typeof levelInfo.pass_message === 'string' &&
    typeof levelInfo.vocab_milestone === 'number'
  );
}

/**
 * 验证题包数据
 */
function validatePacket(packet: any): boolean {
  if (!packet || typeof packet !== 'object') return false;
  
  return (
    typeof packet.level === 'number' &&
    validateConfig(packet.config) &&
    Array.isArray(packet.base_set) &&
    packet.base_set.length > 0 &&
    packet.base_set.every(validateQuestion) &&
    validateLevelInfo(packet.level_info) &&
    Array.isArray(packet.rescue_set) &&
    packet.rescue_set.every(validateQuestion)
  );
}

/**
 * 验证图表数据
 */
function validateChartData(chartData: any): boolean {
  if (!chartData || typeof chartData !== 'object') return false;
  
  return (
    typeof chartData.mean === 'number' &&
    typeof chartData.max_val === 'number' &&
    typeof chartData.std_dev === 'number' &&
    typeof chartData.user_percentile === 'number' &&
    chartData.user_percentile >= 0 &&
    chartData.user_percentile <= 100
  );
}

/**
 * 验证结论数据
 */
function validateConclusion(conclusion: any): boolean {
  if (!conclusion || typeof conclusion !== 'object') return false;
  
  return (
    typeof conclusion.text === 'string' &&
    typeof conclusion.level_title === 'string' &&
    typeof conclusion.comparison_text === 'string'
  );
}

/**
 * 验证报告数据
 */
function validateReport(report: any): boolean {
  if (!report || typeof report !== 'object') return false;
  
  return (
    typeof report.score === 'number' &&
    typeof report.user_age === 'number' &&
    validateChartData(report.chart_data) &&
    validateConclusion(report.conclusion)
  );
}

// ==================== 转换函数 ====================

/**
 * 转换题包数据，添加默认值
 */
export function transformPacket(packet: any): LevelPacket | null {
  if (!validatePacket(packet)) {
    console.error('Invalid packet data:', packet);
    return null;
  }
  
  return {
    level: packet.level,
    config: {
      pass_threshold: packet.config.pass_threshold,
      drop_threshold: packet.config.drop_threshold,
    },
    base_set: packet.base_set.map((q: any) => ({
      id: q.id,
      character: q.character,
      audio_prompt_text: q.audio_prompt_text,
      confusion_options: q.confusion_options,
    })),
    level_info: {
      title: packet.level_info.title,
      pass_message: packet.level_info.pass_message,
      vocab_milestone: packet.level_info.vocab_milestone,
    },
    rescue_set: packet.rescue_set.map((q: any) => ({
      id: q.id,
      character: q.character,
      audio_prompt_text: q.audio_prompt_text,
      confusion_options: q.confusion_options,
    })),
  };
}

/**
 * 转换报告数据，添加默认值
 */
export function transformReport(report: any): AssessmentReport | null {
  if (!validateReport(report)) {
    console.error('Invalid report data:', report);
    return null;
  }
  
  return {
    score: report.score,
    user_age: report.user_age,
    chart_data: {
      mean: report.chart_data.mean,
      max_val: report.chart_data.max_val,
      std_dev: report.chart_data.std_dev,
      user_percentile: report.chart_data.user_percentile,
    },
    conclusion: {
      text: report.conclusion.text,
      level_title: report.conclusion.level_title,
      comparison_text: report.conclusion.comparison_text,
    },
  };
}

/**
 * 验证并转换开始测试的响应数据
 */
export function validateStartAssessmentResponse(data: any): {
  isValid: boolean;
  sessionId?: string;
  packets?: LevelPacket[];
  error?: string;
} {
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      error: '响应数据格式错误',
    };
  }
  
  if (typeof data.session_id !== 'string' || !data.session_id) {
    return {
      isValid: false,
      error: '缺少会话ID',
    };
  }
  
  if (!Array.isArray(data.packets) || data.packets.length === 0) {
    return {
      isValid: false,
      error: '缺少题包数据',
    };
  }
  
  const transformedPackets: LevelPacket[] = [];
  
  for (const packet of data.packets) {
    const transformed = transformPacket(packet);
    if (!transformed) {
      return {
        isValid: false,
        error: `题包数据验证失败: level ${packet?.level || 'unknown'}`,
      };
    }
    transformedPackets.push(transformed);
  }
  
  return {
    isValid: true,
    sessionId: data.session_id,
    packets: transformedPackets,
  };
}

/**
 * 验证并转换提交结果的响应数据
 */
export function validateSubmitPacketResponse(data: any): {
  isValid: boolean;
  status?: 'active' | 'completed';
  packets?: LevelPacket[];
  report?: AssessmentReport;
  error?: string;
} {
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      error: '响应数据格式错误',
    };
  }
  
  if (data.status !== 'active' && data.status !== 'completed') {
    return {
      isValid: false,
      error: '无效的状态值',
    };
  }
  
  if (data.status === 'active') {
    if (!Array.isArray(data.packets) || data.packets.length === 0) {
      return {
        isValid: false,
        error: '状态为active但缺少题包数据',
      };
    }
    
    const transformedPackets: LevelPacket[] = [];
    
    for (const packet of data.packets) {
      const transformed = transformPacket(packet);
      if (!transformed) {
        return {
          isValid: false,
          error: `题包数据验证失败: level ${packet?.level || 'unknown'}`,
        };
      }
      transformedPackets.push(transformed);
    }
    
    return {
      isValid: true,
      status: 'active',
      packets: transformedPackets,
    };
  } else {
    // status === 'completed'
    if (!data.report) {
      return {
        isValid: false,
        error: '状态为completed但缺少报告数据',
      };
    }
    
    const transformedReport = transformReport(data.report);
    if (!transformedReport) {
      return {
        isValid: false,
        error: '报告数据验证失败',
      };
    }
    
    return {
      isValid: true,
      status: 'completed',
      report: transformedReport,
    };
  }
}
