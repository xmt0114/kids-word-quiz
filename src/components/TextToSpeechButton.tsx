import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { useQuizSettings } from '../stores/appStore';

interface TextToSpeechButtonProps {
  text?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  textRef?: React.RefObject<HTMLElement>;
}

const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({
  text,
  className,
  size = 'medium',
  textRef
}) => {
  const { settings } = useQuizSettings();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isVoicesLoaded, setIsVoicesLoaded] = useState(false);

  // 检测浏览器语音合成支持
  useEffect(() => {
    const checkSupport = () => {
      // 检查是否支持Speech Synthesis API
      const supported = 'speechSynthesis' in window;
      setIsSupported(supported);
      
      if (!supported) {
        console.log('🔇 浏览器不支持语音合成功能');
        return;
      }

      // 检查语音列表是否可用
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const hasEnglishVoices = voices.some(voice => 
          voice.lang.startsWith('en') || voice.lang.startsWith('EN')
        );
        
        if (voices.length > 0 && hasEnglishVoices) {
          setIsVoicesLoaded(true);
          console.log('✅ 语音朗读功能可用，找到', voices.length, '个语音引擎');
        } else if (voices.length > 0) {
          // 有语音但没有英语语音
          console.log('⚠️ 找到语音引擎但没有英语语音');
          setIsVoicesLoaded(false);
        }
      };

      // 立即检查一次
      checkVoices();

      // 监听语音列表加载事件（某些浏览器需要异步加载）
      const handleVoicesChanged = () => {
        checkVoices();
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

      // 3秒后再次检查（某些浏览器可能需要更长时间）
      const timeoutId = setTimeout(() => {
        checkVoices();
      }, 3000);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        clearTimeout(timeoutId);
      };
    };

    checkSupport();
  }, []);

  const handlePlay = () => {
    if (isPlaying) {
      // 如果正在播放，则停止播放
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // 优先从textRef读取文本，否则使用text属性
    let textToSpeak = '';
    if (textRef?.current) {
      textToSpeak = textRef.current.textContent || '';
    } else if (text) {
      textToSpeak = text;
    }

    if (!textToSpeak.trim()) {
      setHasError(true);
      setTimeout(() => setHasError(false), 2000);
      return;
    }

    // 检查浏览器是否支持语音合成
    if (!isSupported || !isVoicesLoaded) {
      setHasError(true);
      setTimeout(() => setHasError(false), 2000);
      return;
    }

    try {
      // 取消之前的播放
      window.speechSynthesis.cancel();

      // 等待一小段时间确保之前的语音完全停止
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        // 获取TTS设置（使用默认值或设置中的值）
        const ttsSettings = settings.tts || {
          lang: 'en-US',
          rate: 0.8,
          pitch: 1.0,
          volume: 1.0,
        };

        // 设置语音参数
        utterance.lang = ttsSettings.lang;
        utterance.rate = ttsSettings.rate;
        utterance.pitch = ttsSettings.pitch;
        utterance.volume = ttsSettings.volume;

        // 如果指定了语音名称，尝试设置
        if (ttsSettings.voiceName) {
          const voices = window.speechSynthesis.getVoices();

          // 使用灵活匹配（处理名称差异）
          const selectedVoice = voices.find(voice => {
            const trimmedName = voice.name.trim();
            const searchName = ttsSettings.voiceName!.trim();
            return trimmedName === searchName || trimmedName.includes(searchName) || searchName.includes(trimmedName);
          });

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        // 监听播放事件
        utterance.onstart = () => {
          setIsPlaying(true);
          setHasError(false);
        };

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = (e) => {
          console.error('语音播放错误:', e);
          setIsPlaying(false);
          setHasError(true);
          setTimeout(() => setHasError(false), 2000);
        };

        // 开始播放
        window.speechSynthesis.speak(utterance);
      }, 100);
    } catch (error) {
      console.error('语音播放失败:', error);
      setIsPlaying(false);
      setHasError(true);
      setTimeout(() => setHasError(false), 2000);
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 28;
      default:
        return 20;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8';
      case 'large':
        return 'w-12 h-12';
      default:
        return 'w-10 h-10';
    }
  };

  // 如果浏览器不支持语音合成或语音列表未加载完成，则不显示按钮
  if (!isSupported || !isVoicesLoaded) {
    return null;
  }

  return (
    <div className="relative inline-flex group">
      <button
        onClick={handlePlay}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all duration-200',
          'bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2',
          'active:scale-95',
          getButtonSize(),
          className
        )}
        title={isPlaying ? "停止朗读" : "点击朗读题目"}
        type="button"
      >
        {hasError ? (
          <VolumeX size={getIconSize()} className="text-red-500" />
        ) : isPlaying ? (
          <VolumeX size={getIconSize()} className="animate-pulse" />
        ) : (
          <Volume2 size={getIconSize()} />
        )}
      </button>

      {/* 悬浮提示 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {hasError ? "语音播放失败" : isPlaying ? "点击停止朗读" : "点击朗读题目"}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700"></div>
      </div>
    </div>
  );
};

export { TextToSpeechButton };