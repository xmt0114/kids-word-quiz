/**
 * useMissingWordsGameAudio Hook
 * "哪个词语不见了？"游戏音效管理Hook
 * 
 * 职责：
 * - 封装游戏音效的播放逻辑
 * - 提供场景化的音效触发方法
 * - 使用全局soundSlice管理音效
 */

import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

/**
 * 音效管理Hook返回类型
 */
export interface UseMissingWordsGameAudioReturn {
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
  /** 播放开始游戏音效 */
  playStart: () => void;
  /** 播放倒计时音效 */
  playCountdown: () => void;
  /** 播放悬停音效 */
  playHover: () => void;
}

/**
 * Missing Words Game 音效管理Hook
 * 
 * 使用全局soundSlice来播放音效，提供游戏特定的音效方法
 */
export function useMissingWordsGameAudio(): UseMissingWordsGameAudioReturn {
  // 从全局store获取playSound方法
  const playSound = useAppStore((state) => state.playSound);

  /**
   * 播放卡片出现音效
   * 场景：词语卡片出现在舞台上时
   */
  const playCardAppear = useCallback(() => {
    playSound('pop'); // 使用pop音效表示卡片出现
  }, [playSound]);

  /**
   * 播放点击音效
   * 场景：用户点击按钮或选项时
   */
  const playClick = useCallback(() => {
    playSound('click');
  }, [playSound]);

  /**
   * 播放成功音效
   * 场景：用户答对题目时
   */
  const playSuccess = useCallback(() => {
    playSound('correct');
  }, [playSound]);

  /**
   * 播放错误音效
   * 场景：用户答错题目时
   */
  const playError = useCallback(() => {
    playSound('wrong');
  }, [playSound]);

  /**
   * 播放倒计时音效
   * 场景：挑战模式观察时间最后3秒
   */
  const playCountdown = useCallback(() => {
    playSound('toggle');
  }, [playSound]);

  /**
   * 播放幕布音效
   * 场景：幕布合拢或拉开时
   */
  const playCurtain = useCallback(() => {
    playSound('toggle'); // 使用toggle音效表示幕布动作
  }, [playSound]);

  /**
   * 播放开始游戏音效
   * 场景：点击"开始游戏"按钮时
   */
  const playStart = useCallback(() => {
    playSound('start');
  }, [playSound]);

  /**
   * 播放悬停音效
   * 场景：鼠标悬停在交互元素上时
   */
  const playHover = useCallback(() => {
    playSound('hover');
  }, [playSound]);

  return {
    playCardAppear,
    playClick,
    playSuccess,
    playError,
    playCurtain,
    playStart,
    playHover,
    playCountdown,
  };
}
