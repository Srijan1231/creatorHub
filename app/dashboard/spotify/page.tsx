// Add historical data for monthly listeners
const generateListenerHistory = (days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      listeners: Math.floor(50000 - i * 100 + Math.random() * 500),
    };
  });
};

// Update the component to use historical data
const listenerHistory = generateListenerHistory(30);

// Update the LineChart component
<LineChart
  data={listenerHistory}
  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="listeners"
    stroke="#1DB954"
    strokeWidth={2}
  />
</LineChart>