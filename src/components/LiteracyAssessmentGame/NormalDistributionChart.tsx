/**
 * NormalDistributionChart Component
 * 正态分布图组件 - 显示用户识字量在同龄人中的位置
 */

import React, { useMemo } from 'react';
import { NormalDistributionChartProps, ASSESSMENT_LEVELS } from './types';

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
    userAge,
}) => {
    const { mean, max_val, std_dev, user_percentile } = chartData;

    // 图表尺寸
    const width = 800;
    const height = 260; // 稍微降低高度
    const padding = { top: 15, right: 10, bottom: 70, left: 10 }; // 增加底部空间
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const levels = ASSESSMENT_LEVELS;

    // 根据百分位计算对应的X值
    const percentileToX = (percentile: number): number => {
        const z = invNorm(percentile / 100);
        return mean + z * std_dev;
    };

    // X轴范围逻辑：为了让正态分布曲线和等级分区填满整个图表区域，
    // 我们使用平均值正负3个标准差作为可视范围。
    // 左右两端的标签将分别固定显示为“用户年龄”和“最大值”。
    const visualRangeZ = 3;
    const xMin = mean - visualRangeZ * std_dev;
    const xMax = mean + visualRangeZ * std_dev;


    // 计算正态分布曲线点
    const curvePoints = useMemo(() => {
        const points: { x: number; y: number }[] = [];
        const numPoints = 120; // 增加点数使曲线更平滑

        for (let i = 0; i <= numPoints; i++) {
            // 为了平滑，我们计算从 mean-3std 到 mean+3std 的点，但在渲染时会被限制在 xMin 到 xMax
            const plotX = (mean - 3 * std_dev) + (6 * std_dev * (i / numPoints));
            const exponent = -Math.pow(plotX - mean, 2) / (2 * Math.pow(std_dev, 2));
            const y = (1 / (std_dev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
            points.push({ x: plotX, y });
        }
        return points;
    }, [mean, std_dev]);

    const maxY = Math.max(...curvePoints.map(p => p.y));

    // 坐标转换函数
    const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
    const scaleY = (y: number) => padding.top + chartHeight - (y / maxY) * chartHeight;

    // 过滤并转换路径点
    const filteredPoints = curvePoints.filter(p => p.x >= xMin && p.x <= xMax);
    // 生成SVG路径
    const curvePath = filteredPoints
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(point.x)} ${scaleY(point.y)}`)
        .join(' ');

    // 计算用户位置
    const userScaledX = scaleX(Math.min(Math.max(userScore, xMin), xMax));

    // 根据百分位确定用户等级
    const userLevel = levels.find(
        level => user_percentile >= level.minPercentile && user_percentile < level.maxPercentile
    ) || levels[levels.length - 1];

    // X轴刻度 - 左右两侧固定为要求显示的标签
    const xTicks = [
        { value: xMin, label: `${userAge}岁`, align: 'start' as const },
        { value: mean, label: `${Math.round(mean)}`, align: 'middle' as const },
        { value: xMax, label: `${Math.round(max_val)}`, align: 'end' as const },
    ];



    return (
        <div className="w-full font-alimama">
            {/* 统计信息卡片 - 恢复 */}
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50/50 backdrop-blur-sm rounded-[2rem] p-3 text-center border border-blue-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">你的识字量</p>
                    <p className="text-2xl font-black text-blue-600">{userScore}<span className="text-sm ml-1">字</span></p>
                </div>
                <div className="bg-green-50/50 backdrop-blur-sm rounded-[2rem] p-3 text-center border border-green-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                    <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">平均识字量</p>
                    <p className="text-2xl font-black text-green-600">{Math.round(mean)}<span className="text-sm ml-1">字</span></p>
                </div>
                <div className="bg-orange-50/50 backdrop-blur-sm rounded-[2rem] p-3 text-center border border-orange-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">百分位</p>
                    <p className="text-2xl font-black text-orange-600">{user_percentile < 1 ? '<1' : Math.round(user_percentile)}%</p>
                </div>
                {/* 等级卡片：使用 userLevel 对应的颜色 */}
                <div className={`${userLevel.bgColor}/50 backdrop-blur-sm rounded-[2rem] p-3 text-center border-2 border-dashed border-${userLevel.color.replace('#', '') === '94a3b8' ? 'slate-200' : 'current'} shadow-sm transition-all hover:shadow-md hover:-translate-y-1`}
                    style={{ borderColor: userLevel.color + '40' }}>
                    <p className={`text-xs font-bold ${userLevel.textColor} uppercase tracking-widest mb-1 opacity-70`}>等级</p>
                    <p className={`text-2xl font-black ${userLevel.textColor}`}>{userLevel.name}</p>
                </div>
            </div>

            {/* SVG图表 - 撑满宽度 */}
            <div className="w-full">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto select-none overflow-visible"
                >
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
                                    opacity={0.1}
                                />
                                {/* 百分位标签 */}
                                {level.maxPercentile < 100 && (
                                    <text
                                        x={x2}
                                        y={padding.top + 20}
                                        textAnchor="middle"
                                        className="text-[10px] font-bold"
                                        fill="#94a3b8"
                                    >
                                        {level.maxPercentile}%
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* 正态分布曲线下方渐变填充 */}
                    <defs>
                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    <path
                        d={`${curvePath} L ${scaleX(Math.min(xMax, filteredPoints[filteredPoints.length - 1].x))} ${padding.top + chartHeight} L ${scaleX(Math.max(xMin, filteredPoints[0].x))} ${padding.top + chartHeight} Z`}
                        fill="url(#curveGradient)"
                    />

                    {/* 正态分布曲线 */}
                    <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />

                    {/* X轴 */}
                    <line
                        x1={padding.left}
                        y1={padding.top + chartHeight}
                        x2={padding.left + chartWidth}
                        y2={padding.top + chartHeight}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                    />

                    {/* 等级色条 */}
                    {levels.map((level, index) => {
                        const startX = percentileToX(level.minPercentile);
                        const endX = percentileToX(level.maxPercentile);
                        const x1 = scaleX(Math.max(xMin, startX));
                        const x2 = scaleX(Math.min(xMax, endX));
                        const rectWidth = Math.max(0, x2 - x1);

                        if (rectWidth <= 0) return null;

                        return (
                            <g key={`bar-${index}`}>
                                <rect
                                    x={x1}
                                    y={padding.top + chartHeight + 10}
                                    width={rectWidth}
                                    height={12}
                                    rx={2}
                                    fill={level.color}
                                />
                                {/* 等级名称 */}
                                <text
                                    x={x1 + rectWidth / 2}
                                    y={padding.top + chartHeight + 40}
                                    textAnchor="middle"
                                    className="text-xs font-bold"
                                    fill="#475569"
                                >
                                    {level.name}
                                </text>
                            </g>
                        );
                    })}

                    {/* X轴刻度 */}
                    {xTicks.map((tick, index) => (
                        <text
                            key={index}
                            x={scaleX(tick.value)}
                            y={padding.top + chartHeight + 65} // 进一步下移，确保不重叠
                            textAnchor={tick.align === 'start' ? 'start' : tick.align === 'end' ? 'end' : 'middle'}
                            className="text-sm font-black"
                            fill="#8b5cf6"
                        >
                            {tick.label}
                        </text>
                    ))}

                    {/* 用户位置标记 - 只显示分数气泡，不显示"你的位置"标签 */}
                    <g>
                        {/* 垂直虚线 */}
                        <line
                            x1={userScaledX}
                            y1={padding.top}
                            x2={userScaledX}
                            y2={padding.top + chartHeight}
                            stroke="#4b5563"
                            strokeWidth={2}
                            strokeDasharray="4,4"
                            opacity={0.4}
                        />

                        {/* 分数气泡 (Tooltip) */}
                        <g transform={`translate(${userScaledX}, ${padding.top + chartHeight / 3})`}>
                            <rect
                                x={-35}
                                y={-34}
                                width={70}
                                height={38}
                                rx={14}
                                fill="#2563eb" // 深蓝 (Blue-600)
                                className="shadow-xl"
                            />
                            {/* 气泡小三角 */}
                            <path
                                d="M -7 4 L 0 12 L 7 4"
                                fill="#2563eb"
                            />
                            <text
                                x={0}
                                y={-8}
                                textAnchor="middle"
                                className="text-xl font-black"
                                fill="white"
                            >
                                {userScore}
                            </text>
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
};
