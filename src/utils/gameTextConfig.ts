import { GameTextConfig } from '../types';

/**
 * 获取默认的游戏文本配置
 * 用于"单词"类游戏
 */
export function getDefaultTextConfig(): GameTextConfig {
    return {
        itemName: '单词',
        itemFieldLabel: '单词',
        definitionLabel: '定义',
        audioTextLabel: '音频文本',
        messages: {
            addSuccess: '添加{itemName}成功',
            addError: '添加{itemName}失败',
            updateSuccess: '更新{itemName}成功',
            updateError: '更新{itemName}失败',
            deleteConfirm: '确定要删除{itemName}"{name}"吗?',
            deleteSuccess: '删除{itemName}成功',
            deleteError: '删除{itemName}失败',
            loadError: '加载{itemName}失败',
            batchAddTitle: '批量添加{itemName}',
            masteredCount: '已掌握 {count} 个{itemName}',
            learningCount: '正在学习 {count} 个{itemName}',
        },
    };
}

/**
 * 格式化消息模板
 * 将模板中的变量替换为实际值
 * 
 * @param template 消息模板,如 "添加{itemName}成功"
 * @param variables 变量对象,如 { itemName: '单词', name: 'apple' }
 * @returns 格式化后的消息
 * 
 * @example
 * formatMessage('添加{itemName}成功', { itemName: '成语' })
 * // => '添加成语成功'
 * 
 * formatMessage('确定要删除{itemName}"{name}"吗?', { itemName: '单词', name: 'apple' })
 * // => '确定要删除单词"apple"吗?'
 */
export function formatMessage(template: string, variables: Record<string, string | number>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, String(value));
    }

    return result;
}

/**
 * 预定义的游戏文本配置
 */
export const PRESET_TEXT_CONFIGS: Record<string, GameTextConfig> = {
    // 单词游戏
    word: {
        itemName: '单词',
        itemFieldLabel: '单词',
        definitionLabel: '定义',
        audioTextLabel: '音频文本',
        messages: {
            addSuccess: '添加{itemName}成功',
            addError: '添加{itemName}失败',
            updateSuccess: '更新{itemName}成功',
            updateError: '更新{itemName}失败',
            deleteConfirm: '确定要删除{itemName}"{name}"吗?',
            deleteSuccess: '删除{itemName}成功',
            deleteError: '删除{itemName}失败',
            loadError: '加载{itemName}失败',
            batchAddTitle: '批量添加{itemName}',
            masteredCount: '已掌握 {count} 个{itemName}',
            learningCount: '正在学习 {count} 个{itemName}',
        },
    },

    // 成语游戏
    idiom: {
        itemName: '成语',
        itemFieldLabel: '成语',
        definitionLabel: '解释',
        audioTextLabel: '朗读文本',
        messages: {
            addSuccess: '添加{itemName}成功',
            addError: '添加{itemName}失败',
            updateSuccess: '更新{itemName}成功',
            updateError: '更新{itemName}失败',
            deleteConfirm: '确定要删除{itemName}"{name}"吗?',
            deleteSuccess: '删除{itemName}成功',
            deleteError: '删除{itemName}失败',
            loadError: '加载{itemName}失败',
            batchAddTitle: '批量添加{itemName}',
            masteredCount: '已掌握 {count} 个{itemName}',
            learningCount: '正在学习 {count} 个{itemName}',
        },
    },

    // 字谜游戏
    riddle: {
        itemName: '字谜',
        itemFieldLabel: '谜面',
        definitionLabel: '谜底',
        audioTextLabel: '提示文本',
        messages: {
            addSuccess: '添加{itemName}成功',
            addError: '添加{itemName}失败',
            updateSuccess: '更新{itemName}成功',
            updateError: '更新{itemName}失败',
            deleteConfirm: '确定要删除{itemName}"{name}"吗?',
            deleteSuccess: '删除{itemName}成功',
            deleteError: '删除{itemName}失败',
            loadError: '加载{itemName}失败',
            batchAddTitle: '批量添加{itemName}',
            masteredCount: '已掌握 {count} 个{itemName}',
            learningCount: '正在学习 {count} 个{itemName}',
        },
    },
};
