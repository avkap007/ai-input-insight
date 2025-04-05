
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AttributionData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

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
      name: 'AI Base Knowledge',
      value: data.baseKnowledge || 0,
      color: '#0088FE'
    },
    ...data.documents.map((doc, index) => ({
      name: doc.name || `Document ${index + 1}`,
      value: doc.contribution || 0,
      color: COLORS[(index + 1) % COLORS.length]
    }))
  ];

  // Filter out any items with very low value (< 0.1%) for display clarity
  const filteredData = chartData.filter(item => item.value > 0.1);

  // If there's no meaningful data, don't render the chart
  if (filteredData.length === 0) {
    return null;
  }

  const formatTooltipValue = (value: any) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)}%`;
    }
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      return `${parseFloat(value).toFixed(1)}%`;
    }
    return value;
  };

  return (
    <Card className="overflow-hidden mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          Source Attribution
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="ml-2 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2 max-w-xs">
                  <p className="text-xs font-medium">Source Attribution</p>
                  <p className="text-xs">
                    This chart shows how much each document contributed to the AI's response, based on the influence settings and content relevance.
                  </p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ value }) => value > 5 ? `${Math.round(value)}%` : ''}
                  labelLine={false}
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => {
                    return [formatTooltipValue(value), 'Contribution'];
                  }}
                  labelFormatter={(index: number) => filteredData[index].name}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2">
            <div className="space-y-2 p-2">
              {filteredData.map((entry, index) => (
                <div key={index} className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate flex-1 max-w-[150px]" title={entry.name}>
                          {entry.name.length > 18 ? `${entry.name.substring(0, 16)}...` : entry.name}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {entry.name}
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                  <div className="font-medium ml-1 flex-shrink-0">{formatTooltipValue(entry.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttributionChart;
