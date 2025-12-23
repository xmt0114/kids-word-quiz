/**
 * TTS 工具类
 * 提供统一的浏览器语音合成支持检测
 */

/**
 * 检查当前浏览器是否支持 SpeechSynthesis
 */
export const isTTSSupported = (): boolean => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

/**
 * 异步检查是否有可用的语音引擎
 * 有些浏览器虽然支持 API，但可能没有任何安装的语音引擎
 */
export const hasAvailableVoices = async (): Promise<boolean> => {
    if (!isTTSSupported()) return false;

    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(true);
            return;
        }

        // 如果当前没有，监听变化事件
        const handleVoicesChanged = () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            const updatedVoices = window.speechSynthesis.getVoices();
            resolve(updatedVoices.length > 0);
        };

        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        // 2秒超时兜底
        setTimeout(() => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            resolve(window.speechSynthesis.getVoices().length > 0);
        }, 2000);
    });
};
