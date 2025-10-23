'use client';

import { useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface CRIESScore {
  completeness: number;
  reliability: number;
  integrity: number;
  effectiveness: number;
  security: number;
  overall?: number;
}

interface CRIESChartProps {
  scores: CRIESScore;
  animate?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  height?: number;
}

export default function CRIESChart({
  scores,
  animate = true,
  showTooltip = true,
  showLegend = false,
  height = 400
}: CRIESChartProps) {
  const [animatedScores, setAnimatedScores] = useState<CRIESScore>({
    completeness: 0,
    reliability: 0,
    integrity: 0,
    effectiveness: 0,
    security: 0
  });
  const [isPulsing, setIsPulsing] = useState(false);

  // Animate scores on mount or when scores change
  useEffect(() => {
    if (!animate) {
      setAnimatedScores(scores);
      return;
    }

    let frame = 0;
    const totalFrames = 30;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      
      setAnimatedScores({
        completeness: scores.completeness * progress,
        reliability: scores.reliability * progress,
        integrity: scores.integrity * progress,
        effectiveness: scores.effectiveness * progress,
        security: scores.security * progress
      });

      if (frame >= totalFrames) {
        clearInterval(interval);
        setAnimatedScores(scores);
        // Trigger pulse effect when animation completes
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 1000);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [scores, animate]);

  // Format data for Recharts
  const chartData = [
    {
      dimension: 'Completeness',
      value: animatedScores.completeness * 100,
      fullMark: 100,
      description: 'Response coverage and depth of analysis'
    },
    {
      dimension: 'Reliability',
      value: animatedScores.reliability * 100,
      fullMark: 100,
      description: 'Consistency and error rate evaluation'
    },
    {
      dimension: 'Integrity',
      value: animatedScores.integrity * 100,
      fullMark: 100,
      description: 'Hallucination, bias, and alignment checks'
    },
    {
      dimension: 'Effectiveness',
      value: animatedScores.effectiveness * 100,
      fullMark: 100,
      description: 'Task completion and goal achievement'
    },
    {
      dimension: 'Security',
      value: animatedScores.security * 100,
      fullMark: 100,
      description: 'Prompt injection and adversarial resistance'
    }
  ];

  // Get color based on score
  const getColor = (value: number) => {
    if (value >= 85) return '#4ade80'; // green-400
    if (value >= 70) return '#facc15'; // yellow-400
    return '#f87171'; // red-400
  };

  // Get gradient color for the radar fill
  const getGradientId = () => {
    const avgScore = (
      animatedScores.completeness +
      animatedScores.reliability +
      animatedScores.integrity +
      animatedScores.effectiveness +
      animatedScores.security
    ) / 5 * 100;

    if (avgScore >= 85) return 'url(#colorGreen)';
    if (avgScore >= 70) return 'url(#colorYellow)';
    return 'url(#colorRed)';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="font-bold text-white mb-1">{data.dimension}</p>
          <p className={`text-2xl font-bold mb-2 ${
            data.value >= 85 ? 'text-green-400' :
            data.value >= 70 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {data.value.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData}>
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorYellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#facc15" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#eab308" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
            </linearGradient>
          </defs>

          {/* Grid */}
          <PolarGrid 
            stroke="#374151" 
            strokeWidth={1}
          />

          {/* Angle Axis (Dimension Labels) */}
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            stroke="#4b5563"
          />

          {/* Radius Axis (Score Values) */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            stroke="#4b5563"
          />

          {/* Radar Area */}
          <Radar
            name="CRIES Score"
            dataKey="value"
            stroke={getColor(
              ((animatedScores.completeness +
                animatedScores.reliability +
                animatedScores.integrity +
                animatedScores.effectiveness +
                animatedScores.security) / 5) * 100
            )}
            fill={getGradientId()}
            fillOpacity={0.6}
            strokeWidth={2}
            className={isPulsing ? 'animate-pulse' : ''}
            animationDuration={animate ? 500 : 0}
          />

          {/* Tooltip */}
          {showTooltip && (
            <Tooltip content={<CustomTooltip />} />
          )}

          {/* Legend */}
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>

      {/* Overall Score Badge */}
      {scores.overall !== undefined && (
        <div className="absolute top-4 right-4 bg-gray-900/90 border border-gray-700 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-xs text-gray-400 mb-1">Overall</div>
          <div className={`text-3xl font-bold ${
            scores.overall >= 0.85 ? 'text-green-400' :
            scores.overall >= 0.70 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {(scores.overall * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="text-center p-2 bg-gray-900/50 rounded border border-gray-800"
          >
            <div className="text-xs text-gray-500 mb-1">
              {item.dimension.charAt(0)}
            </div>
            <div className={`text-sm font-bold ${
              item.value >= 85 ? 'text-green-400' :
              item.value >= 70 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {item.value.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
