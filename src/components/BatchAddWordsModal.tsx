import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface BatchWordData {
  word: string;
  definition: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  answer: string;
  hint: string;
  audioText?: string;
  errors?: string[];
  isValid?: boolean;
}

interface BatchAddWordsModalProps {
  isOpen: boolean;
  collectionId: string;
  onClose: () => void;
  onSubmit: (words: BatchWordData[]) => Promise<void>;
}

const BatchAddWordsModal: React.FC<BatchAddWordsModalProps> = ({
  isOpen,
  collectionId,
  onClose,
  onSubmit,
}) => {
  const [csvText, setCsvText] = useState('');
  const [batchWords, setBatchWords] = useState<BatchWordData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    total: number;
    valid: number;
    invalid: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  // CSV格式示例
  const csvExample = `word,definition,options,answer,hint,audioText
apple,苹果,"苹果;香蕉;橙子;西瓜","苹果",,"苹果"
cat,猫,"狗;猫;鸟;鱼","猫","meow sound","猫"
dog,狗,"猫;狗;鸟;鱼","狗","barks loudly","狗"`;

  // 下载CSV模板
  const downloadTemplate = () => {
    const csvContent = csvExample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '单词批量导入模板.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 解析CSV文本
  const parseCSV = (text: string): BatchWordData[] => {
    console.log('原始CSV文本:', JSON.stringify(text));
    
    // 更严格的空行过滤：移除所有空行和只包含空白字符的行
    const lines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0; // 只保留非空行
    });
    
    console.log('过滤后的行数:', lines.length);
    console.log('过滤后的行内容:', lines);
    
    const words: BatchWordData[] = [];

    // 跳过表头，从第二行开始
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log(`处理第${i + 1}行:`, line);
      
      // 再次检查，确保行不为空
      if (!line) {
        console.log(`第${i + 1}行为空，跳过`);
        continue; // 跳过空行
      }

      try {
        // 简单的CSV解析，处理引号内的逗号
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim()); // 添加最后一部分

        console.log(`第${i + 1}行解析结果:`, parts);

        if (parts.length < 5) {
          console.log(`第${i + 1}行字段不足:`, parts.length);
          words.push({
            word: '',
            definition: '',
            difficulty: 'easy',
            options: [],
            answer: '',
            hint: '',
            audioText: '',
            errors: [`第${i + 1}行：字段不足，至少需要word,definition,options,answer,audioText`],
            isValid: false,
          });
          continue;
        }

        // 支持带difficulty和不带difficulty的两种格式
        let word: string, definition: string, difficulty: string, optionsStr: string, answer: string, hint: string, audioText: string;

        if (parts.length >= 7) {
          // 包含difficulty列: word,definition,difficulty,options,answer,hint,audioText
          [word, definition, difficulty, optionsStr, answer, hint, audioText] = parts;
        } else {
          // 不包含difficulty列: word,definition,options,answer,hint,audioText
          [word, definition, optionsStr, answer, hint, audioText] = parts;
          difficulty = 'easy'; // 默认难度
        }

        // 解析选项，处理引号包围的选项
        const cleanOptionsStr = optionsStr.replace(/^"|"$/g, ''); // 移除首尾引号
        const options = cleanOptionsStr.split(';').map(opt => opt.trim()).filter(opt => opt);

        console.log(`第${i + 1}行解析的选项:`, options);

        const wordData: BatchWordData = {
          word: word?.trim() || '',
          definition: definition?.trim() || '',
          difficulty: (difficulty?.trim() as 'easy' | 'medium' | 'hard') || 'easy',
          options,
          answer: answer?.trim() || '',
          hint: hint?.trim() || '',
          audioText: audioText?.trim() || '',
          errors: [],
          isValid: true,
        };

        console.log(`第${i + 1}行解析结果:`, wordData);

        // 验证单个单词
        const errors = validateWord(wordData);
        wordData.errors = errors;
        wordData.isValid = errors.length === 0;

        words.push(wordData);
      } catch (error) {
        console.error(`第${i + 1}行解析异常:`, error);
        words.push({
          word: '',
          definition: '',
          difficulty: 'easy',
          options: [],
          answer: '',
          hint: '',
          audioText: '',
          errors: [`第${i + 1}行：解析错误 - ${error instanceof Error ? error.message : '未知错误'}`],
          isValid: false,
        });
      }
    }

    console.log('最终解析结果:', words);
    return words;
  };

  // 验证单个单词
  const validateWord = (word: BatchWordData): string[] => {
    const errors: string[] = [];

    if (!word.word.trim()) {
      errors.push('单词不能为空');
    }

    if (!word.definition.trim()) {
      errors.push('定义不能为空');
    }

    if (!word.audioText.trim()) {
      errors.push('音频文本不能为空');
    }

    if (!['easy', 'medium', 'hard'].includes(word.difficulty)) {
      errors.push('难度必须是easy、medium或hard');
    }

    const validOptions = word.options.filter(opt => opt.trim());
    if (validOptions.length < 3) {
      errors.push('至少需要3个选项');
    }

    if (!word.answer.trim()) {
      errors.push('答案不能为空');
    } else if (!validOptions.includes(word.answer)) {
      errors.push('答案必须是选项之一');
    }

    return errors;
  };

  // 验证所有单词
  const validateAllWords = () => {
    const validatedWords = batchWords.map(word => {
      const errors = validateWord(word);
      return {
        ...word,
        errors,
        isValid: errors.length === 0,
      };
    });

    setBatchWords(validatedWords);

    const validCount = validatedWords.filter(w => w.isValid).length;
    const invalidCount = validatedWords.length - validCount;

    setValidationResults({
      total: validatedWords.length,
      valid: validCount,
      invalid: invalidCount,
      errors: validatedWords.flatMap(w => w.errors || []),
    });
  };

  // 提交批量添加（包含解析逻辑）
  const handleSubmit = async () => {
    if (!csvText.trim()) {
      alert('请输入CSV内容');
      return;
    }

    setIsSubmitting(true);
    try {
      // 先解析CSV
      const cleanText = csvText.replace(/\n\s*\n/g, '\n').trim();
      const parsedWords = parseCSV(cleanText);
      
      // 验证解析结果
      const validatedWords = parsedWords.map(word => {
        const errors = validateWord(word);
        return {
          ...word,
          errors,
          isValid: errors.length === 0,
        };
      });

      setBatchWords(validatedWords);

      const validCount = validatedWords.filter(w => w.isValid).length;
      const invalidCount = validatedWords.length - validCount;

      const results = {
        total: validatedWords.length,
        valid: validCount,
        invalid: invalidCount,
        errors: validatedWords.flatMap(w => w.errors || []),
      };

      setValidationResults(results);

      // 如果没有有效词汇，显示验证结果并停止
      if (validCount === 0) {
        return;
      }

      // 如果有有效词汇，直接提交
      const validWords = validatedWords.filter(word => word.isValid);
      await onSubmit(validWords);
      onClose();
      
      // 重置状态
      setBatchWords([]);
      setCsvText('');
      setValidationResults(null);
    } catch (error) {
      console.error('批量添加失败:', error);
      alert('批量添加失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 animate-fade-in"
        onClick={onClose}
      />

      {/* 模态框 */}
      <div className="relative bg-white rounded-lg shadow-2xl p-xl max-w-4xl w-full my-8 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-lg sticky top-0 bg-white pb-md border-b border-gray-200">
          <h2 className="text-h2 font-bold text-text-primary">批量添加词汇</h2>
          <button
            className="p-sm hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* CSV格式说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-md mb-lg">
          <h4 className="font-bold text-blue-800 mb-sm">CSV格式说明：</h4>
          <ul className="text-small text-blue-700 space-y-xs">
            <li>• 支持两种表头格式：</li>
            <li>&nbsp;&nbsp;- word,definition,options,answer,hint,audioText（推荐）</li>
            <li>&nbsp;&nbsp;- word,definition,difficulty,options,answer,hint,audioText（兼容旧格式）</li>
            <li>• difficulty列可选，如果不提供将自动设为easy</li>
            <li>• options用分号(;)分隔多个选项</li>
            <li>• answer必须是options中的一个</li>
            <li>• audioText为音频文本，hint为提示（hint可为空）</li>
            <li>• 避免在数据末尾添加空行</li>
          </ul>
          <Button
            variant="secondary"
            className="mt-sm"
            onClick={downloadTemplate}
          >
            <Download size={16} className="mr-xs" />
            下载模板
          </Button>
        </div>

        {/* CSV输入区域 */}
        <div className="mb-lg">
          <h3 className="text-h3 font-bold mb-md">CSV导入</h3>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full h-64 px-md py-sm border-2 border-gray-300 rounded-lg text-small font-mono"
            placeholder={csvExample}
          />
        </div>

        {/* 验证结果 */}
        {validationResults && (
          <div className="mb-lg">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-md">
              <h4 className="font-bold mb-sm">验证结果</h4>
              <div className="flex gap-md text-small">
                <span className="text-gray-600">总计: {validationResults.total}</span>
                <span className="text-green-600">有效: {validationResults.valid}</span>
                <span className="text-red-600">无效: {validationResults.invalid}</span>
              </div>
              {validationResults.errors.length > 0 && (
                <div className="mt-sm">
                  <h5 className="font-bold text-red-600 mb-xs">错误列表：</h5>
                  <div className="text-small text-red-500 max-h-32 overflow-y-auto">
                    {validationResults.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-md justify-end pt-md border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !csvText.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="mr-xs animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="mr-xs" />
                提交
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { BatchAddWordsModal };