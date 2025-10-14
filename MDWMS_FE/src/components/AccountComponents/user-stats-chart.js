import React from 'react';
import { DonutChart } from './donut-chart';

const UserStatsChart = () => {
  // Data for activity status chart
  const activityData = [
    { label: 'Active', value: 7 },
    { label: 'Inactive', value: 2 }
  ];

  // Data for employee classification chart
  const employeeData = [
    { label: 'NV Kho', value: 5 },
    { label: 'Quản lý', value: 4 }
  ];

  return (
    <div className="w-full p-8">
      <h2 className="text-xl font-semibold text-foreground mb-8">Thống kê người dùng</h2>
      <div className="flex justify-center items-start space-x-12">
        {/* Activity Status Chart */}
        <div className="flex-1 max-w-md">
          <DonutChart
            data={activityData}
            title="Trạng thái hoạt động"
            centerText="7/9"
            centerSubtext="Active"
            colors={['#10b981', '#06b6d4']}
          />
        </div>
        
        {/* Employee Classification Chart */}
        <div className="flex-1 max-w-md">
          <DonutChart
            data={employeeData}
            title="Phân loại nhân viên"
            centerText="9"
            centerSubtext="Tổng số"
            colors={['#10b981', '#06b6d4']}
          />
        </div>
      </div>
    </div>
  );
};

export { UserStatsChart };