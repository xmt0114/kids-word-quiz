import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';
import { AudioButtonProps } from '../types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { cn } from '../lib/utils';

const AudioButton: React.FC<AudioButtonProps> = ({
  audioText,
  isPlaying: externalIsPlaying,
  onPlayStateChange,
  className,
  showTooltip = false,
}) => {
  const { 
    isPlaying: internalIsPlaying, 
    isSupported, 
    hasError, 
    errorMessage, 
    speak, 
    stop, 
    clearError 
  } = useSpeechSynthesis();

  const [showErrorTooltip, setShowErrorTooltip] = useState(false);
  const [showHoverTooltip, setShowHoverTooltip] = useState(false);

  // 使用外部状态或内部状态
  const isPlaying = externalIsPlaying ?? internalIsPlaying;

  const handleClick = () => {
    if (!isSupported) {
      setShowErrorTooltip(true);
      setTimeout(() => setShowErrorTooltip(false), 3000);
      return;
    }

    if (hasError) {
      // 清除错误后重试
      clearError();
    }

    if (isPlaying) {
      stop();
      onPlayStateChange?.(false);
    } else {
      speak({
        text: audioText,
        rate: 0.7,
        pitch: 1.1,
        volume: 1.0,
        lang: 'en-US',
      });
      onPlayStateChange?.(true);
    }
  };

  // 当内部播放结束时，更新外部状态
  useEffect(() => {
    if (!internalIsPlaying && externalIsPlaying !== undefined) {
      onPlayStateChange?.(false);
    }
  }, [internalIsPlaying, externalIsPlaying, onPlayStateChange]);

  // 当有错误时，显示错误提示一段时间
  useEffect(() => {
    if (hasError && errorMessage) {
      setShowErrorTooltip(true);
      const timer = setTimeout(() => {
        setShowErrorTooltip(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hasError, errorMessage]);

  const baseClasses = [
    'inline-flex items-center justify-center',
    'bg-gradient-to-r from-secondary-500 to-secondary-600',
    'text-text-inverse',
    'rounded-full',
    'shadow-button',
    'transition-all duration-fast',
    'focus:outline-none focus:ring-4 focus:ring-secondary-500 focus:ring-opacity-50',
    'active:scale-95',
    'hover:scale-110 hover:rotate-1',
    'relative',
  ];

  const sizeClasses = [
    'w-20 h-20 md:w-24 md:h-24',
  ];

  const animationClasses = isPlaying ? [
    'animate-pulse-gentle',
  ] : [];

  const errorClasses = hasError ? [
    'bg-gradient-to-r from-red-500 to-red-600',
    'animate-pulse',
  ] : [];

  const classes = cn(
    baseClasses,
    sizeClasses,
    animationClasses,
    errorClasses,
    className
  );

  if (!isSupported) {
    return (
      <div className="relative">
        <div
          className={cn(
            baseClasses,
            sizeClasses,
            'opacity-50 cursor-not-allowed'
          )}
          title="浏览器不支持语音播放"
        >
          <Volume2 size={32} />
        </div>
        {showErrorTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
            浏览器不支持语音播放
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className={classes}
        onClick={handleClick}
        aria-label={isPlaying ? '暂停播放' : '播放音频'}
        title={isPlaying ? '暂停播放' : '点击播放音频'}
        onMouseEnter={() => showTooltip && setShowHoverTooltip(true)}
        onMouseLeave={() => setShowHoverTooltip(false)}
      >
        {hasError ? (
          <AlertCircle size={40} />
        ) : isPlaying ? (
          <Pause size={40} />
        ) : (
          <Play size={40} />
        )}
        
        {/* 播放状态指示器 */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full border-4 border-white border-opacity-50 animate-ping" />
        )}
      </button>
      
      {/* 悬浮提示 */}
      {showTooltip && showHoverTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
          点击播放音频
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
      
      {/* 错误提示 */}
      {showErrorTooltip && errorMessage && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10 max-w-xs">
          {errorMessage}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
        </div>
      )}
    </div>
  );
};

export { AudioButton };