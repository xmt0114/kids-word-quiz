/**
 * NormalDistributionChart Component
 * 正态分布图组件 - 显示用户识字量在同龄人中的位置
 */

import React, { useMemo } from 'react';
import type { NormalDistributionChartProps } from './types';

// 正态分布逆函数（近似）- 根据百分位计算对应的z值
const invNorm = (p: number): number => {
  // 使用近似公式计算正态分布逆函数
  if (p <= 0) return -3;
  if (p >= 1) return 3;
  
  const a1 = -3.969683028665376e1;
  const a2 = 2.209460984245205e2;
  const a3 = -2.759285104469687e2;
  const a4 = 1.383577518672690e2;
  const a5 = -3.066479806614716e1;
  const a6 = 2.506628277459239e0;
  
  const b1 = -5.447609879822406e1;
  const b2 = 1.615858368580409e2;
  const b3 = -1.556989798598866e2;
  const b4 = 6.680131188771972e1;
  const b5 = -1.328068155288572e1;
  
  const c1 = -7.784894002430293e-3;
  const c2 = -3.223964580411365e-1;
  const c3 = -2.400758277161838e0;
  const c4 = -2.549732539343734e0;
  const c5 = 4.374664141464968e0;
  const c6 = 2.938163982698783e0;
  
  const d1 = 7.784695709041462e-3;
  const d2 = 3.224671290700398e-1;
  const d3 = 2.445134137142996e0;
  const d4 = 3.754408661907416e0;
  
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  
  let q, r;
  
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
           (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
};


export const NormalDistributionChart: React.FC<NormalDistributionChartProps> = ({
  chartData,
  userScore,
}) => {
  const { mean, max_val, std_dev, user_percentile } = chartData;

  // 图表尺寸
  const width = 800;
  const height = 350;
  const padding = { top: 40, right: 40, bottom: 100, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 定义等级区间 - 按照参考图对称分布
  const levels = [
    { name: '菜鸟级', minPercentile: 0, maxPercentile: 5, color: '#94a3b8' },    // slate-400
    { name: '新手级', minPercentile: 5, maxPercentile: 20, color: '#93c5fd' },   // blue-300
    { name: '标准入门级', minPercentile: 20, maxPercentile: 80, color: '#7dd3fc' }, // sky-300
    { name: '高手级', minPercentile: 80, maxPercentile: 95, color: '#86efac' },  // green-300
    { name: '大师级', minPercentile: 95, maxPercentile: 100, color: '#fbbf24' }, // yellow-400
  ];

  // 根据百分位计算对应的X值
  const percentileToX = (percentile: number): number => {
    const z = invNorm(percentile / 100);
    return mean + z * std_dev;
  };

  // X轴范围：使用正态分布的±3个标准差
  const xMin = Math.max(0, mean - 3 * std_dev);
  const xMax = mean + 3 * std_dev;

  // 计算正态分布曲线点
  const curvePoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const numPoints = 100;

    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + (xMax - xMin) * (i / numPoints);
      const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(std_dev, 2));
      const y = (1 / (std_dev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      points.push({ x, y });
    }
    return points;
  }, [mean, std_dev, xMin, xMax]);

  const maxY = Math.max(...curvePoints.map(p => p.y));

  // 坐标转换函数
  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - (y / maxY) * chartHeight;

  // 生成SVG路径
  const curvePath = curvePoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(point.x)} ${scaleY(point.y)}`)
    .join(' ');

  // 计算用户位置
  const userScaledX = scaleX(Math.min(Math.max(userScore, xMin), xMax));

  // 根据百分位确定用户等级
  const userLevel = levels.find(
    level => user_percentile >= level.minPercentile && user_percentile < level.maxPercentile
  ) || levels[levels.length - 1];

  // X轴刻度
  const xTicks = [
    { value: xMin, label: `${Math.round(xMin)}` },
    { value: mean, label: `平均${Math.round(mean)}` },
    { value: max_val, label: `最高${Math.round(max_val)}` },
  ];


  return (
    <div className="w-full">
      {/* 统计信息 */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">你的识字量</p>
          <p className="text-xl font-bold text-blue-600">{userScore}字</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">平均识字量</p>
          <p className="text-xl font-bold text-green-600">{Math.round(mean)}字</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">百分位</p>
          <p className="text-xl font-bold text-yellow-600">{user_percentile}%</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">等级</p>
          <p className="text-xl font-bold text-purple-600">{userLevel.name}</p>
        </div>
      </div>

      {/* SVG图表 */}
      <div className="bg-white rounded-2xl shadow-lg p-4 overflow-x-auto">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto">
          {/* 背景区域（等级分区） */}
          {levels.map((level, index) => {
            const startX = percentileToX(level.minPercentile);
            const endX = percentileToX(level.maxPercentile);
            const x1 = scaleX(Math.max(xMin, startX));
            const x2 = scaleX(Math.min(xMax, endX));
            const rectWidth = Math.max(0, x2 - x1);

            return (
              <g key={index}>
                <rect
                  x={x1}
                  y={padding.top}
                  width={rectWidth}
                  height={chartHeight}
                  fill={level.color}
                  opacity={0.3}
                />
                {/* 百分位标签 */}
                {level.maxPercentile < 100 && (
                  <text
                    x={x2}
                    y={padding.top + chartHeight / 2}
                    textAnchor="middle"
                    className="text-xs"
                    fill="#6b7280"
                  >
                    {level.maxPercentile}%
                  </text>
                )}
              </g>
            );
          })}

          {/* 正态分布曲线 */}
          <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth={3} />

          {/* 填充曲线下方区域 */}
          <path
            d={`${curvePath} L ${scaleX(xMax)} ${padding.top + chartHeight} L ${scaleX(xMin)} ${padding.top + chartHeight} Z`}
            fill="#3b82f6"
            opacity={0.15}
          />

          {/* X轴 */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="#9ca3af"
            strokeWidth={2}
          />

          {/* 等级色条 */}
          {levels.map((level, index) => {
            const startX = percentileToX(level.minPercentile);
            const endX = percentileToX(level.maxPercentile);
            const x1 = scaleX(Math.max(xMin, startX));
            const x2 = scaleX(Math.min(xMax, endX));
            const rectWidth = Math.max(0, x2 - x1);

            return (
              <g key={`bar-${index}`}>
                <rect
                  x={x1}
                  y={padding.top + chartHeight + 2}
                  width={rectWidth}
                  height={8}
                  fill={level.color}
                />
                {/* 等级名称 */}
                <text
                  x={x1 + rectWidth / 2}
                  y={padding.top + chartHeight + 28}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill="#374151"
                >
                  {level.name}
                </text>
              </g>
            );
          })}

          {/* X轴刻度 */}
          {xTicks.map((tick, index) => (
            <g key={index}>
              <text
                x={scaleX(tick.value)}
                y={padding.top + chartHeight + 55}
                textAnchor="middle"
                className="text-sm"
                fill="#6b7280"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* X轴标签 */}
          <text
            x={padding.left + chartWidth / 2}
            y={height - 10}
            textAnchor="middle"
            className="text-sm font-semibold"
            fill="#374151"
          >
            识字量（字）
          </text>

          {/* 用户位置标记 - 只显示分数气泡，不显示"你的位置"标签 */}
          <g>
            {/* 垂直虚线 */}
            <line
              x1={userScaledX}
              y1={padding.top}
              x2={userScaledX}
              y2={padding.top + chartHeight}
              stroke={userLevel.color}
              strokeWidth={2}
              strokeDasharray="4,4"
            />

            {/* 分数气泡 */}
            <g>
              <rect
                x={userScaledX - 30}
                y={padding.top + chartHeight / 3}
                width={60}
                height={28}
                rx={4}
                fill="#4b5563"
              />
              {/* 气泡小三角 */}
              <polygon
                points={`${userScaledX - 6},${padding.top + chartHeight / 3 + 28} ${userScaledX + 6},${padding.top + chartHeight / 3 + 28} ${userScaledX},${padding.top + chartHeight / 3 + 36}`}
                fill="#4b5563"
              />
              <text
                x={userScaledX}
                y={padding.top + chartHeight / 3 + 19}
                textAnchor="middle"
                className="text-sm font-bold"
                fill="white"
              >
                {userScore}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* 图例说明 */}
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {levels.map((level, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: level.color }} />
            <span className="text-xs text-gray-700">
              {level.name} ({level.minPercentile}-{level.maxPercentile}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
