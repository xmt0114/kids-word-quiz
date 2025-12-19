import React, { useMemo } from 'react';
import { pinyin, customPinyin } from 'pinyin-pro';

// 纠正特定的多音字词组（特别是诗词中的常见错误）
customPinyin({
    '朝辞': 'zhāo cí',
    '还来': 'huán lái', // 例如：还来就菊花
    '漫卷': 'màn juǎn', // 例如：漫卷诗书喜欲狂
    '单于': 'chán yú', // 例如：大漠孤烟直，长河落日圆（不对，是月黑雁飞高，单于夜遁逃）
});

interface PinyinTextProps {
    text: string;
    showPinyin?: boolean;
    className?: string;
    size?: 'small' | 'medium' | 'large' | 'xl';
    language?: 'zh' | 'en';
    style?: React.CSSProperties;
}

export const PinyinText: React.FC<PinyinTextProps> = ({
    text,
    showPinyin = false,
    className = '',
    size = 'medium',
    language,
    style
}) => {
    const sizeClasses = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-xl',
        xl: 'text-3xl'
    };

    // 如果不显示拼音，直接返回文本
    if (!showPinyin) {
        // 根据语言类型选择字体
        const fontStyle = language === 'zh' ? {
            fontFamily: '"KaiTi", "STKaiti", "SimSun", "Songti SC", serif',
        } : {};

        return (
            <span
                className={`${className || sizeClasses[size]}`}
                style={{ ...fontStyle, ...style }}
            >
                {text}
            </span>
        );
    }

    // 使用 pinyin-pro 获取详细的拼音数据
    const pinyinData = useMemo(() => {
        return pinyin(text, {
            type: 'all',
            toneType: 'symbol',
            nonZh: 'consecutive' // 非中文部分保持连贯
        });
    }, [text]);

    return (
        <div
            className={`inline-flex flex-wrap items-end gap-1 ${className || sizeClasses[size]}`}
            style={{
                fontFamily: '"KaiTi", "STKaiti", "SimSun", "Songti SC", serif',
                ...style
            }}
        >
            {pinyinData.map((item: any, index: number) => {
                // 判断是否是标点符号或非中文（拼音和原文相同，或者没有拼音）
                const isPunctuation = !item.pinyin || item.pinyin === item.origin;

                return (
                    <div
                        key={index}
                        className="inline-flex flex-col items-center"
                        style={{ width: 'fit-content' }}
                    >
                        {/* 拼音层 */}
                        <div
                            className="text-xs leading-tight whitespace-nowrap"
                            style={{
                                fontFamily: 'Arial, sans-serif',
                                color: '#666',
                                letterSpacing: '0px',
                                marginBottom: '2px'
                            }}
                        >
                            {isPunctuation ? '\u00A0' : item.pinyin}
                        </div>

                        {/* 汉字层 */}
                        <div className="leading-none">
                            {item.origin}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
