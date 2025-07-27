import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Progress,
  Grid,
  NumberFormatter,
  ThemeIcon,
  Divider
} from '@mantine/core'
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconWallet, 
  IconPigMoney, 
  IconCash,
  IconAlertTriangle
} from '@tabler/icons-react'

function FinancialOverviewCard({ overview, loading = false }) {
  if (loading) {
    return (
      <Card withBorder radius="lg" p="xl" bg="navy.1" style={{ borderColor: '#3730a3' }}>
        <Text>Loading financial overview...</Text>
      </Card>
    )
  }

  if (!overview) {
    return (
      <Card withBorder radius="lg" p="xl" bg="navy.1" style={{ borderColor: '#3730a3' }}>
        <Text>No financial data available</Text>
      </Card>
    )
  }

  // Calculate derived metrics
  const incomeUtilization = overview.total_income > 0 
    ? (overview.total_expenses / overview.total_income) * 100 
    : 0

  const isHealthy = overview.financial_status === 'healthy' || overview.financial_status === 'excellent'
  const isWarning = overview.financial_status === 'warning'
  const isCritical = overview.financial_status === 'critical'

  // Get status color and icon
  const getStatusConfig = () => {
    if (overview.financial_status === 'excellent') {
      return { color: 'green', icon: IconTrendingUp, label: 'Excellent' }
    } else if (overview.financial_status === 'healthy') {
      return { color: 'teal', icon: IconTrendingUp, label: 'Healthy' }
    } else if (overview.financial_status === 'warning') {
      return { color: 'yellow', icon: IconAlertTriangle, label: 'Warning' }
    } else {
      return { color: 'red', icon: IconTrendingDown, label: 'Critical' }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <Card withBorder radius="lg" p="xl" bg="navy.1" style={{ borderColor: '#3730a3' }}>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group mb="sm">
              <IconWallet size={24} color="#174ae4" />
              <Title order={2} c="navy.8" fw={700}>Financial Overview</Title>
              <Badge 
                variant="light" 
                color={statusConfig.color} 
                size="sm"
                leftSection={<StatusIcon size={12} />}
              >
                {statusConfig.label}
              </Badge>
            </Group>
            <Text c="dimmed" size="md">
              {new Date(overview.year, overview.month - 1).toLocaleString('en-GB', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </div>
        </Group>

        {/* Key Metrics Grid */}
        <Grid>
          {/* Total Income */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md" radius="md" bg="green.0" style={{ borderColor: '#22c55e' }}>
              <Group gap="xs" mb="xs">
                <ThemeIcon variant="light" color="green" size="sm">
                  <IconCash size={16} />
                </ThemeIcon>
                <Text size="sm" fw={500} c="green.8">Income</Text>
              </Group>
              <NumberFormatter 
                value={overview.total_income} 
                prefix="£" 
                thousandSeparator="," 
                decimalScale={0}
                className="text-lg font-bold text-green-800"
              />
            </Card>
          </Grid.Col>

          {/* Total Expenses */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md" radius="md" bg="red.0" style={{ borderColor: '#ef4444' }}>
              <Group gap="xs" mb="xs">
                <ThemeIcon variant="light" color="red" size="sm">
                  <IconTrendingDown size={16} />
                </ThemeIcon>
                <Text size="sm" fw={500} c="red.8">Expenses</Text>
              </Group>
              <NumberFormatter 
                value={overview.total_expenses} 
                prefix="£" 
                thousandSeparator="," 
                decimalScale={0}
                className="text-lg font-bold text-red-800"
              />
            </Card>
          </Grid.Col>

          {/* Remaining Buffer */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md" radius="md" bg="blue.0" style={{ borderColor: '#3b82f6' }}>
              <Group gap="xs" mb="xs">
                <ThemeIcon variant="light" color="blue" size="sm">
                  <IconPigMoney size={16} />
                </ThemeIcon>
                <Text size="sm" fw={500} c="blue.8">Remaining</Text>
              </Group>
              <NumberFormatter 
                value={overview.remaining_buffer} 
                prefix="£" 
                thousandSeparator="," 
                decimalScale={0}
                className={`text-lg font-bold ${
                  overview.remaining_buffer >= 0 ? 'text-blue-800' : 'text-red-800'
                }`}
              />
            </Card>
          </Grid.Col>

          {/* Savings Rate */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md" radius="md" bg="purple.0" style={{ borderColor: '#8b5cf6' }}>
              <Group gap="xs" mb="xs">
                <ThemeIcon variant="light" color="purple" size="sm">
                  <IconTrendingUp size={16} />
                </ThemeIcon>
                <Text size="sm" fw={500} c="purple.8">Savings Rate</Text>
              </Group>
              <Text size="lg" fw={700} c="purple.8">
                {overview.savings_rate.toFixed(1)}%
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        <Divider />

        {/* Progress Indicators */}
        <Stack gap="md">
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Budget Utilization</Text>
              <Text size="sm" c="dimmed">
                {overview.budget_utilization_percentage.toFixed(1)}%
              </Text>
            </Group>
            <Progress 
              value={Math.min(overview.budget_utilization_percentage, 100)} 
              color={
                overview.budget_utilization_percentage <= 50 ? 'green' :
                overview.budget_utilization_percentage <= 80 ? 'yellow' :
                overview.budget_utilization_percentage <= 100 ? 'orange' : 'red'
              }
              size="lg" 
              radius="lg"
            />
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Income Utilization</Text>
              <Text size="sm" c="dimmed">
                {incomeUtilization.toFixed(1)}%
              </Text>
            </Group>
            <Progress 
              value={Math.min(incomeUtilization, 100)} 
              color={
                incomeUtilization <= 60 ? 'green' :
                incomeUtilization <= 80 ? 'yellow' :
                incomeUtilization <= 95 ? 'orange' : 'red'
              }
              size="lg" 
              radius="lg"
            />
          </div>
        </Stack>

        {/* Quick Stats */}
        <Grid>
          <Grid.Col span={4}>
            <Text ta="center" size="xs" c="dimmed">Total Categories</Text>
            <Text ta="center" size="lg" fw={700} c="navy.8">{overview.total_categories}</Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text ta="center" size="xs" c="dimmed">Over Budget</Text>
            <Text ta="center" size="lg" fw={700} c="red.6">{overview.over_budget_categories}</Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text ta="center" size="xs" c="dimmed">Near Limit</Text>
            <Text ta="center" size="lg" fw={700} c="yellow.6">{overview.near_limit_categories}</Text>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  )
}

export default FinancialOverviewCard