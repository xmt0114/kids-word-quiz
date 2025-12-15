import React, { useState } from 'react';
import { Edit2, Check, X, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface WordData {
  id: number;
  word: string;
  definition: string;
  audioText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  answer: string;
  hint: string;
  word_order?: number;
  created_at?: string;
}

interface WordEditorProps {
  word: WordData;
  onChange: (field: keyof WordData, value: any) => void;
  errors?: Partial<Record<keyof WordData, string>>;
}

interface EditableFieldProps {
  label: string;
  value: any;
  field: keyof WordData;
  type?: 'text' | 'textarea' | 'number' | 'select';
  options?: { value: string; label: string }[];
  onChange: (field: keyof WordData, value: any) => void;
  error?: string;
  className?: string;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  field,
  type = 'text',
  options,
  onChange,
  error,
  className,
  isEditing = false,
  onStartEdit,
  onEndEdit
}) => {
  const [editValue, setEditValue] = useState(value);

  // 当value变化时更新editValue
  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = () => {
    setEditValue(value);
    onStartEdit?.();
  };

  const handleSave = () => {
    let processedValue = editValue;
    
    // 特殊处理不同类型的值
    if (type === 'number') {
      processedValue = editValue === '' ? null : Number(editValue);
    }
    
    onChange(field, processedValue);
    onEndEdit?.();
  };

  const handleCancel = () => {
    setEditValue(value);
    onEndEdit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = () => {
    if (type === 'select' && options) {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    }
    if (type === 'number') {
      return value ?? '-';
    }
    return value || '-';
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {/* 固定高度容器，避免编辑时高度变化 */}
      <div className="min-h-[52px] flex flex-col justify-center">
        {isEditing ? (
          <div className="space-y-2">
            <div className="relative">
              {type === 'textarea' ? (
                <textarea
                  value={editValue || ''}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "w-full p-3 pr-16 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    error ? "border-red-500" : "border-gray-300"
                  )}
                  rows={3}
                  autoFocus
                />
              ) : type === 'select' && options ? (
                <select
                  value={editValue || ''}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "w-full p-3 pr-16 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    error ? "border-red-500" : "border-gray-300"
                  )}
                  autoFocus
                >
                  {options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  value={editValue || ''}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "w-full p-3 pr-16 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    error ? "border-red-500" : "border-gray-300"
                  )}
                  autoFocus
                />
              )}
              {/* 编辑按钮固定在右侧 - 为select类型留出更多空间 */}
              <div className={cn(
                "absolute top-1/2 transform -translate-y-1/2 flex gap-1",
                type === 'select' ? "right-8" : "right-2"
              )}>
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="保存"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="取消"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        ) : (
          <div
            onClick={handleStartEdit}
            className={cn(
              "p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors group relative min-h-[52px] flex items-center",
              error ? "border border-red-500" : ""
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className={cn(
                type === 'number' && value ? "text-center" : "",
                !value && "text-gray-400"
              )}>
                {displayValue()}
              </span>
              <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-1 absolute -bottom-6 left-0">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const WordEditor: React.FC<WordEditorProps> = ({ word, onChange, errors }) => {
  const [currentEditingField, setCurrentEditingField] = useState<keyof WordData | null>(null);
  
  const difficultyOptions = [
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' }
  ];



  // 处理选项编辑时的实时更新（不删除选项）
  const handleOptionEdit = (index: number, newValue: string) => {
    const newOptions = [...(word.options || [])];
    
    // 确保数组有足够的长度
    while (newOptions.length <= index) {
      newOptions.push('');
    }
    
    // 直接更新选项值，不删除
    newOptions[index] = newValue;
    
    // 更新选项（不同步答案）
    onChange('options', newOptions);
  };

  // 处理选项保存确认（只有在确认保存空内容时才删除选项）
  const handleOptionSave = (index: number, value: string) => {
    const newOptions = [...(word.options || [])];
    
    if (!value.trim()) {
      // 用户确认保存空内容，删除这个选项
      newOptions.splice(index, 1);
      
      // 移除末尾的空选项
      while (newOptions.length > 0 && !newOptions[newOptions.length - 1]?.trim()) {
        newOptions.pop();
      }
      
      onChange('options', newOptions);
    }
    // 如果有内容，选项已经在编辑过程中更新了，不需要额外处理
  };

  // 处理选项删除（通过删除按钮）
  const handleOptionDelete = (index: number) => {
    const newOptions = [...(word.options || [])];
    
    newOptions.splice(index, 1);
    
    // 移除末尾的空选项
    while (newOptions.length > 0 && !newOptions[newOptions.length - 1]?.trim()) {
      newOptions.pop();
    }
    
    onChange('options', newOptions);
  };

  const handleFieldEdit = (field: keyof WordData) => {
    setCurrentEditingField(field);
  };

  const handleFieldEditEnd = () => {
    setCurrentEditingField(null);
  };

  return (
    <div className="space-y-6">
      {/* 基本信息行 */}
      <div className="grid grid-cols-4 gap-6">
        <EditableField
          label="序号"
          value={word.word_order}
          field="word_order"
          type="number"
          onChange={onChange}
          error={errors?.word_order}
          isEditing={currentEditingField === 'word_order'}
          onStartEdit={() => handleFieldEdit('word_order')}
          onEndEdit={handleFieldEditEnd}
        />
        <EditableField
          label="单词"
          value={word.word}
          field="word"
          onChange={onChange}
          error={errors?.word}
          isEditing={currentEditingField === 'word'}
          onStartEdit={() => handleFieldEdit('word')}
          onEndEdit={handleFieldEditEnd}
        />
        <EditableField
          label="难度"
          value={word.difficulty}
          field="difficulty"
          type="select"
          options={difficultyOptions}
          onChange={onChange}
          error={errors?.difficulty}
          isEditing={currentEditingField === 'difficulty'}
          onStartEdit={() => handleFieldEdit('difficulty')}
          onEndEdit={handleFieldEditEnd}
        />
        <EditableField
          label="答案"
          value={word.answer}
          field="answer"
          onChange={onChange}
          error={errors?.answer}
          isEditing={currentEditingField === 'answer'}
          onStartEdit={() => handleFieldEdit('answer')}
          onEndEdit={handleFieldEditEnd}
        />
      </div>

      {/* 定义和音频文本 */}
      <div className="grid grid-cols-2 gap-6">
        <EditableField
          label="定义"
          value={word.definition}
          field="definition"
          type="textarea"
          onChange={onChange}
          error={errors?.definition}
          isEditing={currentEditingField === 'definition'}
          onStartEdit={() => handleFieldEdit('definition')}
          onEndEdit={handleFieldEditEnd}
        />
        <EditableField
          label="音频文本"
          value={word.audioText}
          field="audioText"
          type="textarea"
          onChange={onChange}
          error={errors?.audioText}
          isEditing={currentEditingField === 'audioText'}
          onStartEdit={() => handleFieldEdit('audioText')}
          onEndEdit={handleFieldEditEnd}
        />
      </div>

      {/* 选项 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">选项</label>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, index) => {
            const optionValue = word.options?.[index] || '';
            const isEditing = currentEditingField === `option_${index}`;
            const [editingValue, setEditingValue] = useState(optionValue);
            
            // 当开始编辑时，初始化编辑值
            React.useEffect(() => {
              if (isEditing) {
                setEditingValue(optionValue);
              }
            }, [isEditing, optionValue]);
            
            return (
              <div key={index} className="min-h-[52px] flex flex-col justify-center">
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => {
                        setEditingValue(e.target.value);
                        // 移除实时更新，只在本地状态中更新
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // 保存更改
                          handleOptionEdit(index, editingValue);
                          handleOptionSave(index, editingValue);
                          setCurrentEditingField(null);
                        } else if (e.key === 'Escape') {
                          // 取消编辑，不保存更改
                          setCurrentEditingField(null);
                        }
                      }}
                      className="w-full p-2 pr-16 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                      autoFocus
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        onClick={() => {
                          // 保存更改
                          handleOptionEdit(index, editingValue);
                          handleOptionSave(index, editingValue);
                          setCurrentEditingField(null);
                        }}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="保存"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => {
                          // 取消编辑，不保存更改
                          setCurrentEditingField(null);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="取消"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors group relative min-h-[44px] flex items-center",
                      optionValue ? (
                        optionValue === word.answer ? 
                          "bg-green-50 border border-green-300" : 
                          "bg-blue-50 border border-blue-200"
                      ) : "bg-gray-50 border border-dashed border-gray-300"
                    )}
                  >
                    <div 
                      className="flex items-center justify-between w-full"
                      onClick={() => setCurrentEditingField(`option_${index}` as any)}
                    >
                      <span className={cn(
                        "text-sm flex-1",
                        optionValue ? (
                          optionValue === word.answer ? "text-green-800 font-medium" : "text-gray-800"
                        ) : "text-gray-400"
                      )}>
                        {optionValue ? (
                          <>
                            {String.fromCharCode(65 + index)}. {optionValue}
                            {optionValue === word.answer && <span className="ml-2 text-xs text-green-600">(答案)</span>}
                          </>
                        ) : (
                          `点击添加选项 ${String.fromCharCode(65 + index)}`
                        )}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={12} className="text-gray-400" />
                        {optionValue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOptionDelete(index);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="删除选项"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {errors?.options && (
          <p className="text-sm text-red-600 mt-2">{errors.options}</p>
        )}
      </div>

      {/* 提示 */}
      <EditableField
        label="提示"
        value={word.hint}
        field="hint"
        type="textarea"
        onChange={onChange}
        error={errors?.hint}
        isEditing={currentEditingField === 'hint'}
        onStartEdit={() => handleFieldEdit('hint')}
        onEndEdit={handleFieldEditEnd}
      />
    </div>
  );
};