
import React, { useEffect, useRef, useMemo } from 'react';
import { AttributionData } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AttributionChartProps {
  data: AttributionData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100 text-xs">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-gray-700">{`${payload[0].value.toFixed(1)}% contribution`}</p>
      </div>
    );
  }
  return null;
};

const AttributionChart: React.FC<AttributionChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const result = [
      {
        name: 'AI Base Knowledge',
        value: data.baseKnowledge,
        color: '#93c5fd' // blue-300
      }
    ];
    
    data.documents.forEach(doc => {
      result.push({
        name: doc.name,
        value: doc.contribution,
        color: '#fcd34d' // amber-300
      });
    });
    
    return result;
  }, [data]);

  return (
    <div className="w-full h-44 mt-3 animate-fade-in">
      <h3 className="text-sm font-medium mb-2">Source Attribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttributionChart;
