import React from 'react';

const DonutChart = ({ data, title, centerText, centerSubtext, colors = ['#3b82f6', '#10b981'] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
    
    cumulativePercentage += percentage;

    const radius = 75;
    const innerRadius = 50;
    const centerX = 100;
    const centerY = 100;

    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = percentage > 50 ? 1 : 0;

    const pathData = [
      `M ${centerX + innerRadius * Math.cos(startAngleRad)} ${centerY + innerRadius * Math.sin(startAngleRad)}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${centerX + innerRadius * Math.cos(endAngleRad)} ${centerY + innerRadius * Math.sin(endAngleRad)}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${centerX + innerRadius * Math.cos(startAngleRad)} ${centerY + innerRadius * Math.sin(startAngleRad)}`
    ].join(' ');

    return {
      ...item,
      pathData,
      percentage: Math.round(percentage)
    };
  });

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-base font-medium text-foreground mb-6 text-center">{title}</h3>
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              fill={colors[index % colors.length]}
              className="transition-all duration-500 ease-out hover:opacity-80"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-foreground">{centerText}</div>
          <div className="text-sm text-muted-foreground">{centerSubtext}</div>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-muted-foreground">
              {segment.label} ({segment.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { DonutChart };
