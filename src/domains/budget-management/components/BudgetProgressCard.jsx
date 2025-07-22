import {
  Card,
  Text,
  Progress,
  Group,
  Badge,
  ActionIcon,
  Stack,
  Title,
  Tooltip
} from '@mantine/core'
import { IconEdit, IconTrash, IconTrendingUp, IconTrendingDown, IconAlertTriangle } from '@tabler/icons-react'
import { BudgetStatus } from 'src/domains/budget-management/types'

function BudgetProgressCard({ progress, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case BudgetStatus.UNDER_BUDGET:
        return 'success'
      case BudgetStatus.NEAR_LIMIT:
        return 'warning'
      case BudgetStatus.OVER_BUDGET:
        return 'expense'
      default:
        return 'gray'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case BudgetStatus.UNDER_BUDGET:
        return <IconTrendingDown size={16} />
      case BudgetStatus.NEAR_LIMIT:
        return <IconAlertTriangle size={16} />
      case BudgetStatus.OVER_BUDGET:
        return <IconTrendingUp size={16} />
      default:
        return null
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case BudgetStatus.UNDER_BUDGET:
        return 'Under Budget'
      case BudgetStatus.NEAR_LIMIT:
        return 'Near Limit'
      case BudgetStatus.OVER_BUDGET:
        return 'Over Budget'
      default:
        return 'Unknown'
    }
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const getMonthName = (month) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-GB', { month: 'long' })
  }

  const progressColor = getStatusColor(progress.status)
  const isOverBudget = progress.status === BudgetStatus.OVER_BUDGET

  return (
    <Card
      withBorder
      radius="lg"
      p="lg"
      bg={isOverBudget ? 'expense.1' : progressColor === 'warning' ? 'warning.1' : 'success.1'}
      style={{ borderColor: isOverBudget ? '#dc2626' : progressColor === 'warning' ? '#b45309' : '#047857' }}
    >
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Group gap="xs" mb="xs">
            <Title order={4} c={`${progressColor}.8`}>
              {progress.category}
            </Title>
            <Badge 
              color={progressColor} 
              variant="light" 
              leftSection={getStatusIcon(progress.status)}
              size="sm"
            >
              {getStatusLabel(progress.status)}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            {getMonthName(progress.month)} {progress.year}
          </Text>
        </div>

        <Group gap="xs">
          {onEdit && (
            <Tooltip label="Edit budget">
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                onClick={() => onEdit(progress)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip label="Delete budget">
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={() => onDelete(progress)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500} c="dimmed">
            Spent: {formatAmount(progress.spent_amount)}
          </Text>
          <Text size="sm" fw={500} c="dimmed">
            Budget: {formatAmount(progress.monthly_limit)}
          </Text>
        </Group>

        <Progress
          value={Math.min(progress.percentage_used, 100)}
          color={progressColor}
          size="lg"
          radius="xl"
          animate={progress.percentage_used > 100}
        />

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            {progress.percentage_used.toFixed(1)}% used
          </Text>
          <Text 
            size="sm" 
            fw={600} 
            c={isOverBudget ? 'expense.7' : progress.remaining_amount < (progress.monthly_limit * 0.2) ? 'warning.7' : 'success.7'}
          >
            {isOverBudget ? 'Over by ' : 'Remaining: '}
            {formatAmount(Math.abs(progress.remaining_amount))}
          </Text>
        </Group>

        {/* Alert message for over budget or near limit */}
        {(progress.status === BudgetStatus.OVER_BUDGET || progress.status === BudgetStatus.NEAR_LIMIT) && (
          <Card withBorder radius="md" p="xs" bg={progressColor === 'expense' ? 'expense.2' : 'warning.2'} style={{ borderColor: progressColor === 'expense' ? '#dc2626' : '#b45309' }}>
            <Text size="xs" c={progressColor === 'expense' ? 'expense.8' : 'warning.8'} ta="center">
              {progress.status === BudgetStatus.OVER_BUDGET 
                ? `You've exceeded your budget by ${formatAmount(Math.abs(progress.remaining_amount))}`
                : `You're at ${progress.percentage_used.toFixed(1)}% of your budget limit`
              }
            </Text>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

export default BudgetProgressCard