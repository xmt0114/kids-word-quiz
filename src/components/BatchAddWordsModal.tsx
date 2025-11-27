import React, { useState } from 'react';
import { X, Download, CheckCircle, Loader, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { toast } from 'sonner';

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
  lineNumber?: number; // 添加行号信息
}

interface BatchAddWordsModalProps {
  isOpen: boolean;
  collectionId: string;
  onClose: () => void;
  onSubmit: (words: BatchWordData[], onProgress?: (progress: {
    current: number;
    total: number;
    batchNumber: number;
    totalBatches: number;
  }) => void) => Promise<BatchWordData[]>;
}

const BatchAddWordsModal: React.FC<BatchAddWordsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [csvText, setCsvText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormatExpanded, setIsFormatExpanded] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    successCount: number;
    failedCount: number;
  } | null>(null);
  const [submitProgress, setSubmitProgress] = useState<{
    current: number;
    total: number;
    batchNumber: number;
    totalBatches: number;
    failedWords: BatchWordData[];
  } | null>(null);
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
    // 更严格的空行过滤：移除所有空行和只包含空白字符的行
    const lines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0; // 只保留非空行
    });

    const words: BatchWordData[] = [];

    // 跳过表头，从第二行开始
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // 再次检查，确保行不为空
      if (!line) {
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

        if (parts.length < 5) {
          words.push({
            word: '',
            definition: '',
            difficulty: 'easy',
            options: [],
            answer: '',
            hint: '',
            audioText: '',
            errors: [`字段不足，至少需要word,definition,options,answer,audioText`],
            isValid: false,
            lineNumber: i + 1,
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
          lineNumber: i + 1,
        };

        // 验证单个单词
        const errors = validateWord(wordData);
        wordData.errors = errors;
        wordData.isValid = errors.length === 0;

        words.push(wordData);
      } catch (error) {
        words.push({
          word: '',
          definition: '',
          difficulty: 'easy',
          options: [],
          answer: '',
          hint: '',
          audioText: '',
          errors: [`解析错误 - ${error instanceof Error ? error.message : '未知错误'}`],
          isValid: false,
          lineNumber: i + 1,
        });
      }
    }

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
    } else {
      // 不区分大小写检查答案是否在选项中
      const normalizedAnswer = word.answer.trim().toLowerCase();
      const normalizedOptions = validOptions.map(opt => opt.toLowerCase());
      if (!normalizedOptions.includes(normalizedAnswer)) {
        errors.push('答案必须是选项之一');
      }
    }

    return errors;
  };


  // 检查CSV格式（仅验证，不提交）
  const handleCheckFormat = () => {
    if (!csvText.trim()) {
      alert('请输入CSV内容');
      return;
    }

    try {
      // 解析CSV
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

      const validCount = validatedWords.filter(w => w.isValid).length;
      const invalidCount = validatedWords.length - validCount;

      // 生成错误信息（修复空单词和重复计算问题）
      const errorList: string[] = [];
      validatedWords.forEach(w => {
        if (w.errors && w.errors.length > 0) {
          const wordDisplay = w.word || `第${w.lineNumber}行`;
          w.errors.forEach(err => {
            errorList.push(`单词"${wordDisplay}": ${err}`);
          });
        }
      });

      const results = {
        total: validatedWords.length,
        valid: validCount,
        invalid: invalidCount,
        errors: errorList,
      };

      setValidationResults(results);
      toast.success(`格式检查完成：共${validatedWords.length}个单词，其中${validCount}个有效，${invalidCount}个无效`);
      toast.info('错误信息支持复制，便于查看');
    } catch (error) {
      console.error('格式检查失败:', error);
      alert('格式检查失败，请重试');
    }
  };

  // 提交批量添加（包含解析逻辑）
  const handleSubmit = async () => {
    if (!csvText.trim()) {
      alert('请输入CSV内容');
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(null);
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

      const validCount = validatedWords.filter(w => w.isValid).length;
      const invalidCount = validatedWords.length - validCount;

      // 生成错误信息（修复空单词和重复计算问题）
      const errorList: string[] = [];
      validatedWords.forEach(w => {
        if (w.errors && w.errors.length > 0) {
          const wordDisplay = w.word || `第${w.lineNumber}行`;
          w.errors.forEach(err => {
            errorList.push(`单词"${wordDisplay}": ${err}`);
          });
        }
      });

      const results = {
        total: validatedWords.length,
        valid: validCount,
        invalid: invalidCount,
        errors: errorList,
      };

      setValidationResults(results);

      // 如果没有有效词汇，显示验证结果并停止
      if (validCount === 0) {
        return;
      }

      // 如果有有效词汇，提交并返回失败的单词
      const validWords = validatedWords.filter(word => word.isValid);

      // 初始化进度
      setSubmitProgress({
        current: 0,
        total: validWords.length,
        batchNumber: 0,
        totalBatches: 0,
        failedWords: [],
      });

      // 定义进度回调
      const onProgress = (progress: {
        current: number;
        total: number;
        batchNumber: number;
        totalBatches: number;
      }) => {
        setSubmitProgress(prev => prev ? {
          ...prev,
          ...progress,
        } : null);
      };

      // 调用onSubmit并获取失败的单词
      const failedWords = await onSubmit(validWords, onProgress);

      if (failedWords && failedWords.length > 0) {
        // 有失败的单词，更新CSV文本保留失败单词
        const failedCsvText = generateFailedWordsCsv(failedWords);
        setCsvText(failedCsvText);

        // 重新解析失败单词
        const reParsedWords = parseCSV(failedCsvText);
        const reValidatedWords = reParsedWords.map(word => ({
          ...word,
          errors: [`提交失败，请检查后重试`],
          isValid: true,
        }));

        // 更新验证结果
        const reResults = {
          total: reValidatedWords.length,
          valid: reValidatedWords.length,
          invalid: 0,
          errors: reValidatedWords.map(w => {
            // 保留原有的验证错误，如果还有的话
            if (w.errors && w.errors.length > 0 && !w.errors[0].includes('提交失败')) {
              return `单词"${w.word}": ${w.errors[0]}`;
            }
            return `单词"${w.word}"提交失败`;
          }),
        };
        setValidationResults(reResults);

        setSubmitProgress({
          current: validWords.length - failedWords.length,
          total: validWords.length,
          batchNumber: 0,
          totalBatches: 0,
          failedWords,
        });

        // 显示提交结果（不自动关闭）
        setSubmitResult({
          success: false,
          message: `部分提交成功`,
          successCount: validWords.length - failedWords.length,
          failedCount: failedWords.length,
        });
      } else {
        // 所有单词都成功提交（不自动关闭）
        setSubmitResult({
          success: true,
          message: `所有单词提交成功！`,
          successCount: validWords.length,
          failedCount: 0,
        });

        // 不关闭模态框，让用户自己选择
        // 用户可以点击"继续添加"或"关闭"
      }
    } catch (error) {
      console.error('批量添加失败:', error);
      alert('批量添加失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 关闭模态框并重置状态
  const handleClose = () => {
    setCsvText('');
    setValidationResults(null);
    setSubmitProgress(null);
    setSubmitResult(null);
    onClose();
  };

  // 继续添加更多单词
  const handleContinueAdding = () => {
    setCsvText('');
    setValidationResults(null);
    setSubmitProgress(null);
    setSubmitResult(null);
  };

  // 生成失败单词的CSV文本
  const generateFailedWordsCsv = (failedWords: BatchWordData[]): string => {
    const header = 'word,definition,options,answer,hint,audioText\n';
    const lines = failedWords.map(word => {
      const optionsStr = word.options.join(';');
      const hint = word.hint || '';
      const audioText = word.audioText || word.definition;
      return `"${word.word}","${word.definition}","${optionsStr}","${word.answer}","${hint}","${audioText}"`;
    });
    return header + lines.join('\n');
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

        {/* CSV格式说明 - 可折叠 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg mb-lg overflow-hidden">
          <button
            onClick={() => setIsFormatExpanded(!isFormatExpanded)}
            className="w-full flex items-center justify-between p-md hover:bg-blue-100 transition-colors rounded-lg"
          >
            <h4 className="font-bold text-blue-800">CSV格式说明</h4>
            {isFormatExpanded ? (
              <ChevronUp size={20} className="text-blue-600" />
            ) : (
              <ChevronDown size={20} className="text-blue-600" />
            )}
          </button>
          <div
            className="transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              maxHeight: isFormatExpanded ? '500px' : '0px',
              opacity: isFormatExpanded ? 1 : 0,
            }}
          >
            <div className="px-md pb-md">
              <ul className="text-small text-blue-700 space-y-xs mb-sm">
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
          </div>
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

        {/* 提交进度 */}
        {isSubmitting && submitProgress && (
          <div className="mb-lg">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-md">
              <h4 className="font-bold mb-sm text-blue-800">提交进度</h4>
              <div className="flex items-center gap-md mb-sm">
                <div className="flex-1 bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${(submitProgress.current / submitProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-small font-bold text-blue-700 whitespace-nowrap">
                  {submitProgress.current} / {submitProgress.total}
                </span>
              </div>
              <div className="text-small text-blue-600">
                {submitProgress.batchNumber > 0 && (
                  <span>正在提交第 {submitProgress.batchNumber} 批，共 {submitProgress.totalBatches} 批</span>
                )}
                {submitProgress.failedWords.length > 0 && (
                  <span className="text-red-600 ml-md">
                    失败: {submitProgress.failedWords.length} 个单词
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 提交结果 */}
        {submitResult && (
          <div className="mb-lg">
            <div className={`border-2 rounded-lg p-md ${submitResult.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-sm mb-sm">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${submitResult.success ? 'bg-green-500' : 'bg-yellow-500'}`}>
                  <CheckCircle size={20} className="text-white" />
                </div>
                <h4 className={`font-bold ${submitResult.success ? 'text-green-800' : 'text-yellow-800'}`}>
                  {submitResult.message}
                </h4>
              </div>
              <div className="text-small space-y-xs">
                <div className={submitResult.success ? 'text-green-700' : 'text-yellow-700'}>
                  <span className="font-bold">成功:</span> {submitResult.successCount} 个单词
                </div>
                {!submitResult.success && (
                  <div className="text-red-700">
                    <span className="font-bold">失败:</span> {submitResult.failedCount} 个单词（已保留在文本框中，请检查后重试）
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                  <div className="flex items-center justify-between mb-xs">
                    <h5 className="font-bold text-red-600">错误详情（可复制）：</h5>
                    <button
                      onClick={() => {
                        const errorText = validationResults.errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n');
                        navigator.clipboard.writeText(errorText).then(() => {
                          toast.success('错误信息已复制到剪贴板');
                        });
                      }}
                      className="text-xs px-xs py-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    >
                      复制全部
                    </button>
                  </div>
                  <pre
                    className="text-small text-red-700 bg-red-50 p-xs rounded border-l-2 border-red-500 max-h-40 overflow-y-auto whitespace-pre-wrap break-words select-text"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#ef4444 #f3f4f6',
                      userSelect: 'text',
                    }}
                  >
                    {validationResults.errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-md justify-end pt-md border-t border-gray-200">
          {submitResult ? (
            // 提交完成后的按钮
            <>
              <Button variant="secondary" onClick={handleContinueAdding}>
                继续添加
              </Button>
              <Button variant="primary" onClick={handleClose}>
                关闭
              </Button>
            </>
          ) : (
            // 提交前的按钮
            <>
              <Button variant="secondary" onClick={onClose}>
                取消
              </Button>
              <Button
                variant="secondary"
                onClick={handleCheckFormat}
                disabled={!csvText.trim()}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
              >
                <Search size={16} className="mr-xs" />
                检查格式
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { BatchAddWordsModal };