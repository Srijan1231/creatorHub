// Add historical data for patron growth
const generatePatronHistory = (days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      patrons: Math.floor(1000 - i * 2 + Math.random() * 10),
    };
  });
};

// Update the component to use historical data
const patronHistory = generatePatronHistory(30);

// Update the LineChart component
<LineChart
  data={patronHistory}
  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="patrons"
    stroke="#FF424D"
    strokeWidth={2}
  />
</LineChart>