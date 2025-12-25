export const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.map((month, index) => {
    // Generate decreasing counts for past months
    const count = Math.max(5, Math.floor(Math.random() * 50) + 10 - (currentMonth - index) * 2);
    return {
      name: month,
      reports: count,
      resolved: Math.floor(count * (0.3 + Math.random() * 0.4)), // 30-70% resolved
    };
  });
};

export const generateWeeklyData = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  
  return days.map((day, index) => {
    // Generate random but somewhat decreasing counts for past days
    const count = Math.max(1, Math.floor(Math.random() * 20) + 5 - (today - index));
    return {
      name: day,
      reports: Math.max(0, count),
      resolved: Math.floor(count * (0.3 + Math.random() * 0.4)),
    };
  });
};

export const dummyReportLocations = [
  { name: 'Main Street', reports: 42, lat: 12.9716, lng: 77.5946 },
  { name: 'Oak Avenue', reports: 28, lat: 12.9717, lng: 77.5950 },
  { name: 'Pine Road', reports: 15, lat: 12.9710, lng: 77.5930 },
  { name: 'Maple Drive', reports: 33, lat: 12.9720, lng: 77.5955 },
  { name: 'Cedar Lane', reports: 19, lat: 12.9705, lng: 77.5940 },
];
