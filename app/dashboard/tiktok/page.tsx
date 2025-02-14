// Add historical data for follower growth
const generateFollowerHistory = (days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      followers: Math.floor(400000 - i * 800 + Math.random() * 400),
    };
  });
};

// Update the component to use historical data
const followerHistory = generateFollowerHistory(30);

// Update the LineChart component
<LineChart
  data={followerHistory}
  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="followers"
    stroke="#00f2ea"
    strokeWidth={2}
  />
</LineChart>