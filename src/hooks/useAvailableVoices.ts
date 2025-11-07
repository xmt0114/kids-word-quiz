import { useState, useEffect } from 'react';

interface VoiceOption {
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
  displayName: string;
}

export function useAvailableVoices() {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();

      if (availableVoices.length === 0) {
        // 如果语音列表还未加载，延迟再次检查
        const timeoutId = setTimeout(loadVoices, 100);
        return () => clearTimeout(timeoutId);
      }

      // 转换为VoiceOption格式
      const voiceOptions: VoiceOption[] = availableVoices.map(voice => ({
        name: voice.name,
        lang: voice.lang,
        voice: voice,
        displayName: `${voice.name} (${voice.lang})${voice.default ? ' - 默认' : ''}`,
      }));

      setVoices(voiceOptions);
      setIsLoaded(true);
    };

    // 立即加载一次
    loadVoices();

    // 监听语音列表变化
    const handleVoicesChanged = () => {
      loadVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // 3秒后再次检查（某些浏览器需要更长时间）
    const timeoutId = setTimeout(loadVoices, 3000);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      clearTimeout(timeoutId);
    };
  }, []);

  return { voices, isLoaded };
}
