import { Card, Title, Text, Group, Stack, Badge, Center } from '@mantine/core'
import { IconChartPie3 } from '@tabler/icons-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

function SpendingDistributionChart({ categoryProgress, loading = false }) {
  if (loading) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Text>Loading spending distribution...</Text>
      </Card>
    )
  }

  if (!categoryProgress || categoryProgress.length === 0) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Stack align="center" gap="md" py="xl">
          <IconChartPie3 size={48} color="gray" />
          <div style={{ textAlign: 'center' }}>
            <Text fw={500} size="lg" c="dimmed">No Spending Data</Text>
            <Text size="sm" c="dimmed">
              Start tracking expenses to see your spending distribution
            </Text>
          </div>
        </Stack>
      </Card>
    )
  }

  // Prepare data for pie chart
  const chartData = categoryProgress
    .filter(category => category.current_spend > 0)
    .map(category => ({
      name: category.category,
      value: category.current_spend,
      color: `var(--mantine-color-${category.color}-6)`,
      percentage: category.percentage_used
    }))
    .sort((a, b) => b.value - a.value)

  // Predefined colors for consistency
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <Card withBorder p="sm" bg="white" shadow="md">
          <Text size="sm" fw={500}>{data.name}</Text>
          <Text size="sm" c="dimmed">
            £{data.value.toLocaleString()} ({data.percentage.toFixed(1)}% of budget)
          </Text>
        </Card>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null // Hide labels for slices < 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card withBorder radius="lg" p="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group mb="sm">
              <IconChartPie3 size={24} color="#7a33ff" />
              <Title order={3} c="purple.8">Spending Distribution</Title>
              <Badge variant="light" color="purple" size="sm">
                £{totalSpent.toLocaleString()} total
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              Where your money is going this month
            </Text>
          </div>
        </Group>

        {/* Chart */}
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontSize: '12px' }}>
                    {value} (£{entry.payload.value.toLocaleString()})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories Summary */}
        <div>
          <Text size="sm" fw={500} mb="xs">Top Spending Categories</Text>
          <Stack gap="xs">
            {chartData.slice(0, 5).map((category, index) => (
              <Group key={category.name} justify="space-between">
                <Group gap="xs">
                  <div 
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: colors[index % colors.length]
                    }}
                  />
                  <Text size="sm">{category.name}</Text>
                </Group>
                <Text size="sm" fw={500}>
                  £{category.value.toLocaleString()} ({((category.value / totalSpent) * 100).toFixed(1)}%)
                </Text>
              </Group>
            ))}
          </Stack>
        </div>
      </Stack>
    </Card>
  )
}

export default SpendingDistributionChart