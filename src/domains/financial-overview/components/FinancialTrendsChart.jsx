import { Card, Title, Text, Group, Stack, Badge, Center } from '@mantine/core'
import { IconTrendingUp } from '@tabler/icons-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function FinancialTrendsChart({ trends, loading = false }) {
  if (loading) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Text>Loading financial trends...</Text>
      </Card>
    )
  }

  if (!trends || trends.length === 0) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Stack align="center" gap="md" py="xl">
          <IconTrendingUp size={48} color="gray" />
          <div style={{ textAlign: 'center' }}>
            <Text fw={500} size="lg" c="dimmed">No Trend Data</Text>
            <Text size="sm" c="dimmed">
              Track expenses for a few months to see financial trends
            </Text>
          </div>
        </Stack>
      </Card>
    )
  }

  // Prepare data for line chart
  const chartData = trends.map(trend => ({
    month: `${trend.year}-${trend.month.toString().padStart(2, '0')}`,
    monthLabel: new Date(trend.year, trend.month - 1).toLocaleDateString('en-GB', { 
      month: 'short', 
      year: '2-digit' 
    }),
    income: trend.total_income,
    expenses: trend.total_expenses,
    buffer: trend.remaining_buffer,
    savingsRate: trend.savings_rate
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <Card withBorder p="sm" bg="white" shadow="md">
          <Text size="sm" fw={500} mb="xs">{data.monthLabel}</Text>
          <Stack gap={2}>
            <Group justify="space-between">
              <Text size="xs" c="green.6">Income:</Text>
              <Text size="xs" fw={500}>£{data.income.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="red.6">Expenses:</Text>
              <Text size="xs" fw={500}>£{data.expenses.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="blue.6">Buffer:</Text>
              <Text size="xs" fw={500}>£{data.buffer.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="purple.6">Savings Rate:</Text>
              <Text size="xs" fw={500}>{data.savingsRate.toFixed(1)}%</Text>
            </Group>
          </Stack>
        </Card>
      )
    }
    return null
  }

  // Calculate trend direction
  const latestTrend = chartData[chartData.length - 1]
  const previousTrend = chartData[chartData.length - 2]
  const bufferTrend = latestTrend && previousTrend ? 
    latestTrend.buffer - previousTrend.buffer : 0

  return (
    <Card withBorder radius="lg" p="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group mb="sm">
              <IconTrendingUp size={24} color="#7a33ff" />
              <Title order={3} c="purple.8">Financial Trends</Title>
              <Badge 
                variant="light" 
                color={bufferTrend >= 0 ? "green" : "red"} 
                size="sm"
              >
                {bufferTrend >= 0 ? "↗" : "↘"} {Math.abs(bufferTrend).toFixed(0)}£ vs last month
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              Track your financial performance over time
            </Text>
          </div>
        </Group>

        {/* Chart */}
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="monthLabel" 
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `£${value.toLocaleString()}`}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Income"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Expenses"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="buffer" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Remaining Buffer"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key Insights */}
        <Group justify="space-around">
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">Best Month</Text>
            <Text size="sm" fw={600}>
              {chartData.reduce((best, current) => 
                current.buffer > best.buffer ? current : best, chartData[0]
              )?.monthLabel || 'N/A'}
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">Avg. Savings Rate</Text>
            <Text size="sm" fw={600}>
              {(chartData.reduce((sum, d) => sum + d.savingsRate, 0) / chartData.length).toFixed(1)}%
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">Total Saved</Text>
            <Text size="sm" fw={600}>
              £{chartData.reduce((sum, d) => sum + Math.max(0, d.buffer), 0).toLocaleString()}
            </Text>
          </div>
        </Group>
      </Stack>
    </Card>
  )
}

export default FinancialTrendsChart