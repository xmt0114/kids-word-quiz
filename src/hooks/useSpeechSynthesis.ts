import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeechSynthesisOptions } from '../types';

interface UseSpeechSynthesisReturn {
  isPlaying: boolean;
  isSupported: boolean;
  hasError: boolean;
  errorMessage: string | null;
  speak: (options: SpeechSynthesisOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  clearError: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 检查浏览器是否支持SpeechSynthesis
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (!supported) {
      setErrorMessage('您的浏览器不支持语音播放功能');
      setHasError(true);
    }
  }, []);

  // 清理错误状态
  const clearError = useCallback(() => {
    setHasError(false);
    setErrorMessage(null);
  }, []);

  const speak = useCallback((options: SpeechSynthesisOptions) => {
    if (!isSupported) {
      setErrorMessage('您的浏览器不支持语音播放功能');
      setHasError(true);
      return;
    }

    // 清除之前的错误
    clearError();

    // 停止当前播放
    window.speechSynthesis.cancel();

    // 清除之前的超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const utterance = new SpeechSynthesisUtterance(options.text);
    
    // 设置语音参数（适合儿童）
    utterance.rate = Math.max(0.5, Math.min(1.5, options.rate || 0.85)); // 限制范围
    utterance.pitch = Math.max(0.5, Math.min(2.0, options.pitch || 1.1)); // 限制范围
    utterance.volume = Math.max(0, Math.min(1, options.volume || 1.0)); // 限制范围
    utterance.lang = options.lang || 'en-US';

    utterance.onstart = () => {
      setIsPlaying(true);
      setHasError(false);
      setErrorMessage(null);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      utteranceRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    utterance.onerror = (event) => {
      setIsPlaying(false);
      utteranceRef.current = null;
      
      // 根据错误类型提供具体的错误信息
      let message = '语音播放失败';
      if (event.error) {
        switch (event.error) {
          case 'synthesis-unavailable':
            message = '语音合成服务不可用';
            break;
          case 'synthesis-failed':
            message = '语音合成失败';
            break;
          case 'audio-busy':
            message = '音频设备正忙，请稍后重试';
            break;
          case 'network':
            message = '网络错误导致语音播放失败';
            break;
          default:
            message = `语音播放错误: ${event.error}`;
        }
      }
      
      setErrorMessage(message);
      setHasError(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // 设置超时处理（防止永久挂起）
    timeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsPlaying(false);
        setErrorMessage('语音播放超时');
        setHasError(true);
        window.speechSynthesis.cancel();
      }
    }, 10000); // 10秒超时

    utteranceRef.current = utterance;
    
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setIsPlaying(false);
      setErrorMessage('启动语音播放时发生错误');
      setHasError(true);
      console.error('Speech synthesis speak error:', error);
    }
  }, [isSupported, clearError, isPlaying]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      utteranceRef.current = null;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      clearError();
    }
  }, [isSupported, clearError]);

  const pause = useCallback(() => {
    if (isSupported && isPlaying) {
      try {
        window.speechSynthesis.pause();
      } catch (error) {
        console.error('Speech synthesis pause error:', error);
        setErrorMessage('暂停语音播放失败');
        setHasError(true);
      }
    }
  }, [isSupported, isPlaying]);

  const resume = useCallback(() => {
    if (isSupported) {
      try {
        window.speechSynthesis.resume();
      } catch (error) {
        console.error('Speech synthesis resume error:', error);
        setErrorMessage('恢复语音播放失败');
        setHasError(true);
      }
    }
  }, [isSupported]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isPlaying,
    isSupported,
    hasError,
    errorMessage,
    speak,
    stop,
    pause,
    resume,
    clearError,
  };
}