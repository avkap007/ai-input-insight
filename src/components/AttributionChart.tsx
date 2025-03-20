
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AttributionData } from '@/types';

interface AttributionChartProps {
  data: AttributionData;
}

const COLORS = ['#0088FE', '#FFBB28', '#FF8042', '#A28DFF', '#FF8A80', '#85D2C3'];

const AttributionChart: React.FC<AttributionChartProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  // Prepare data for the pie chart
  const chartData = [
    {
      name: 'Model Base Knowledge',
      value: data.baseKnowledge || 0,
      color: '#0088FE'
    },
    ...data.documents.map((doc, index) => ({
      name: doc.name || `Document ${index + 1}`,
      value: doc.contribution || 0,
      color: COLORS[(index + 1) % COLORS.length]
    }))
  ];

  // Filter out any items with 0 value
  const filteredData = chartData.filter(item => item.value > 0);

  // If there's no meaningful data, don't render the chart
  if (filteredData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h3 className="text-sm font-medium mb-2 text-gray-700">Response Attribution</h3>
      <div className="flex items-center justify-between">
        <div className="w-2/3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  // Handle the type safely - ensure value is a number before calling toFixed
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                  return isNaN(numValue) ? [value, 'Contribution'] : [`${numValue.toFixed(1)}%`, 'Contribution'];
                }}
                labelFormatter={(index) => filteredData[index].name}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/3">
          <div className="space-y-1.5">
            {filteredData.map((entry, index) => (
              <div key={index} className="flex items-center text-xs">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                <div className="truncate flex-1" title={entry.name}>
                  {entry.name.length > 20 ? `${entry.name.substring(0, 18)}...` : entry.name}
                </div>
                <div className="font-medium ml-1">{entry.value.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributionChart;
