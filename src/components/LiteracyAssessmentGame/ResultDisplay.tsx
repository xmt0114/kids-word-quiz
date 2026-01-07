/**
 * ResultDisplay Component
 * 结果展示组件 - 显示测试结果和正态分布图
 */

import React from 'react';
import { RefreshCw, Share2, Download, TrendingUp } from 'lucide-react';
import { NormalDistributionChart } from './NormalDistributionChart';
import type { ResultDisplayProps } from './types';

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  report,
  onRestart,
}) => {
  const { score, user_age, chart_data, conclusion } = report;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 主要结果卡片 */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-4">
          {/* 正态分布图 */}
          <div className="mb-4">
            <NormalDistributionChart
              chartData={chart_data}
              userScore={score}
              userAge={user_age}
            />
          </div>

          {/* 评价 - 移到图表下方 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  评价
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  {conclusion.text}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {conclusion.comparison_text}
                </p>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-base font-bold rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105 active:scale-95 transition-all transform"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新测试</span>
            </button>

            <button
              onClick={() => {
                alert('分享功能即将上线！');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 text-base font-bold rounded-xl shadow-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:scale-105 active:scale-95 transition-all transform"
            >
              <Share2 className="w-4 h-4" />
              <span>分享结果</span>
            </button>

            <button
              onClick={() => {
                alert('下载功能即将上线！');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 text-base font-bold rounded-xl shadow-lg border-2 border-gray-300 hover:border-green-500 hover:text-green-600 hover:scale-105 active:scale-95 transition-all transform"
            >
              <Download className="w-4 h-4" />
              <span>下载报告</span>
            </button>
          </div>
        </div>

        {/* 建议卡片 */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">📚</span>
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              继续阅读
            </h3>
            <p className="text-sm text-gray-600">
              多读书可以帮助你认识更多的汉字，提高识字量
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">✍️</span>
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              多写多练
            </h3>
            <p className="text-sm text-gray-600">
              通过写字练习可以加深对汉字的记忆和理解
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">🎮</span>
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              定期测试
            </h3>
            <p className="text-sm text-gray-600">
              建议每3-6个月测试一次，跟踪你的进步
            </p>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-4 text-gray-500 text-xs">
          <p>测试结果仅供参考，实际识字量可能因测试环境和状态有所差异</p>
        </div>
      </div>
    </div>
  );
};
