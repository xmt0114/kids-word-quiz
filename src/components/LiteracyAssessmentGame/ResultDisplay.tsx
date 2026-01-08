/**
 * ResultDisplay Component
 * 结果展示组件 - 显示测试结果和正态分布图
 */

import React from 'react';
import { RefreshCw, Share2, Download, TrendingUp, Award, Star, Compass, Home } from 'lucide-react';
import { NormalDistributionChart } from './NormalDistributionChart';
import { ResultDisplayProps, ASSESSMENT_LEVELS } from './types';

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  report,
  onRestart,
  onBack,
}) => {
  const { score, user_age, chart_data, conclusion } = report;
  const { user_percentile } = chart_data;

  // 根据百分位确定用户等级
  const userLevel = ASSESSMENT_LEVELS.find(
    level => user_percentile >= level.minPercentile && user_percentile < level.maxPercentile
  ) || ASSESSMENT_LEVELS[ASSESSMENT_LEVELS.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4 px-4 font-alimama">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* 主要结果卡片 */}
        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-2 md:p-3 border border-white/50 relative overflow-hidden">
          {/* 装饰性背景 */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-yellow-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl" />

          <div className="max-w-5xl mx-auto px-2 py-2 md:py-3">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold shadow-lg animate-bounce-subtle mb-3">
                <span>🎉 恭喜你完成测试！</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">识字量测评报告</h1>
            </div>

            <div className="mb-2 relative">
              <NormalDistributionChart
                chartData={chart_data}
                userScore={score}
                userAge={user_age}
              />
            </div>

            {/* 评价部分 */}
            <div className="relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r ${userLevel.iconColor} rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
              <div className={`relative bg-white rounded-3xl p-3 md:p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4`}>
                <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${userLevel.iconColor} rounded-2xl flex items-center justify-center shadow-lg rotate-3`}>
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className={`text-xl font-black ${userLevel.textColor}`}>{conclusion.level_title}</span>
                    <div className="h-1 w-6 bg-slate-200 hidden md:block rounded-full mx-1" />
                    <span className={`font-bold text-sm ${userLevel.textColor} opacity-80`}>
                      {score > chart_data.mean ? '你的识字量高于同龄人平均' : score < chart_data.mean ? '你的识字量低于同龄人平均' : '你的识字量达到同龄人平均'}
                      识字量（{Math.round(chart_data.mean)}字）
                    </span>
                  </div>
                  <p className="text-base text-slate-600 italic">
                    "{conclusion.text}"
                  </p>
                </div>
                {/* 操作按钮组 */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-500 font-medium rounded-xl hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all"
                    >
                      <Home className="w-4 h-4" />
                      <span>返回首页</span>
                    </button>
                  )}
                  <button
                    onClick={onRestart}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-md hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>重新测评</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 学习建议卡片 - 紧凑型 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Star, title: '多读绘本', color: 'bg-blue-100/50 text-blue-600', text: '每天坚持阅读精美绘本，在故事中潜移默化地积累词汇，让阅读成为快乐的习惯。' },
            { icon: Compass, title: '趣味识字', color: 'bg-green-100/50 text-green-600', text: '通过我们的趣味小游戏，不仅能巩固已有汉字，还能在快乐中解锁更多新知识。' },
            { icon: TrendingUp, title: '定期打卡', color: 'bg-purple-100/50 text-purple-600', text: '建议每3个月进行一次小测评，记录成长的点滴进步，让孩子看到改变的惊喜。' }
          ].map((item, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-sm transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        {/* 免责声明 */}
        <div className="text-center pb-8 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            * 本测评结果由系统自动计算生成，仅作为个性化学习参考之用。如有疑问可咨询专业的教育评估机构。
          </p>
        </div>
      </div>
    </div>
  );
};

