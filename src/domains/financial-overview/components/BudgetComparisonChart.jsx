import { Card, Title, Text, Group, Stack, Badge, Center } from '@mantine/core'
import { IconChartBar } from '@tabler/icons-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function BudgetComparisonChart({ categoryProgress, loading = false }) {
  if (loading) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Text>Loading budget comparison...</Text>
      </Card>
    )
  }

  if (!categoryProgress || categoryProgress.length === 0) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Stack align="center" gap="md" py="xl">
          <IconChartBar size={48} color="gray" />
          <div style={{ textAlign: 'center' }}>
            <Text fw={500} size="lg" c="dimmed">No Budget Data</Text>
            <Text size="sm" c="dimmed">
              Set up budgets to see spending vs budget comparison
            </Text>
          </div>
        </Stack>
      </Card>
    )
  }

  // Prepare data for bar chart
  const chartData = categoryProgress
    .map(category => ({
      category: category.category.length > 12 ? 
        category.category.substring(0, 12) + '...' : 
        category.category,
      fullCategory: category.category,
      budgeted: category.monthly_target,
      spent: category.current_spend,
      remaining: Math.max(0, category.remaining_allowance),
      over: Math.max(0, -category.remaining_allowance),
      status: category.status
    }))
    .sort((a, b) => b.budgeted - a.budgeted)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <Card withBorder p="sm" bg="white" shadow="md">
          <Text size="sm" fw={500} mb="xs">{data.fullCategory}</Text>
          <Stack gap={2}>
            <Group justify="space-between">
              <Text size="xs" c="blue.6">Budgeted:</Text>
              <Text size="xs" fw={500}>£{data.budgeted.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="red.6">Spent:</Text>
              <Text size="xs" fw={500}>£{data.spent.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c={data.remaining > 0 ? "green.6" : "red.6"}>
                {data.remaining > 0 ? "Remaining:" : "Over budget:"}
              </Text>
              <Text size="xs" fw={500}>
                £{(data.remaining > 0 ? data.remaining : data.over).toLocaleString()}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Usage:</Text>
              <Text size="xs" fw={500}>
                {((data.spent / data.budgeted) * 100).toFixed(1)}%
              </Text>
            </Group>
          </Stack>
        </Card>
      )
    }
    return null
  }

  const maxValue = Math.max(...chartData.map(d => Math.max(d.budgeted, d.spent)))

  return (
    <Card withBorder radius="lg" p="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group mb="sm">
              <IconChartBar size={24} color="#7a33ff" />
              <Title order={3} c="purple.8">Budget vs Spending</Title>
              <Badge variant="light" color="purple" size="sm">
                {categoryProgress.length} categories
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              Compare your budgeted amounts with actual spending
            </Text>
          </div>
        </Group>

        {/* Chart */}
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="category" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `£${value.toLocaleString()}`}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="budgeted" 
                fill="#3b82f6" 
                name="Budgeted"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="spent" 
                fill="#ef4444" 
                name="Spent"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <Group justify="space-around">
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">Under Budget</Text>
            <Text size="lg" fw={700} c="green.6">
              {chartData.filter(d => d.status === 'under_budget').length}
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">Near Limit</Text>
            <Text size="lg" fw={700} c="yellow.6">
              {chartData.filter(d => d.status === 'near_limit').length}
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">Over Budget</Text>
            <Text size="lg" fw={700} c="red.6">
              {chartData.filter(d => d.status === 'over_budget').length}
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">Total Budgeted</Text>
            <Text size="lg" fw={700} c="blue.6">
              £{chartData.reduce((sum, d) => sum + d.budgeted, 0).toLocaleString()}
            </Text>
          </div>
        </Group>
      </Stack>
    </Card>
  )
}

export default BudgetComparisonChart