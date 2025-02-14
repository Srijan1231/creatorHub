// Add historical data for views over time
const generateViewHistory = (days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      views: Math.floor(100000 - i * 200 + Math.random() * 1000),
    };
  });
};

// Update the component to use historical data
const viewHistory = generateViewHistory(30);

// Update the LineChart component
<LineChart
  data={viewHistory}
  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="views"
    stroke="#FF0000"
    strokeWidth={2}
  />
</LineChart>