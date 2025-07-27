import { useState, useEffect } from 'react'
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Timeline,
  Loader,
  Center,
  Alert,
  NumberFormatter,
  ActionIcon,
  Select,
  Button,
  Divider
} from '@mantine/core'
import {
  IconCalendarEvent,
  IconClock,
  IconAlertCircle,
  IconRefresh,
  IconEye,
  IconTrendingUp
} from '@tabler/icons-react'
import { recurringTransactionService } from 'src/domains/recurring-transactions/services/RecurringTransactionService'

function UpcomingExpensesPreview({ days = 30, refreshTrigger = 0 }) {
  const [upcomingExpenses, setUpcomingExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewDays, setPreviewDays] = useState(days.toString())
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadUpcomingExpenses()
  }, [refreshTrigger, previewDays])

  const loadUpcomingExpenses = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await recurringTransactionService.getUpcomingRecurringExpenses(
        parseInt(previewDays)
      )

      if (error) {
        setError(error)
        return
      }

      setUpcomingExpenses(data || [])
    } catch (err) {
      setError('Failed to load upcoming expenses')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 0) return 'Overdue'
    if (diffDays <= 7) return `In ${diffDays} days`
    
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const groupExpensesByDate = () => {
    const grouped = {}
    upcomingExpenses.forEach(expense => {
      const date = expense.projected_date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(expense)
    })
    return grouped
  }

  const calculateTotalForPeriod = () => {
    return upcomingExpenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getDisplayExpenses = () => {
    if (showAll) return upcomingExpenses
    return upcomingExpenses.slice(0, 10)
  }

  const daysOptions = [
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' }
  ]

  if (loading) {
    return (
      <Card withBorder>
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      </Card>
    )
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconCalendarEvent size={20} color="#7a33ff" />
            <Text fw={600} size="lg">Upcoming Expenses</Text>
          </Group>
          <Group gap="xs">
            <Select
              value={previewDays}
              onChange={setPreviewDays}
              data={daysOptions}
              size="xs"
              w={100}
            />
            <ActionIcon variant="light" size="sm" onClick={loadUpcomingExpenses}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {error ? (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {error}
          </Alert>
        ) : upcomingExpenses.length === 0 ? (
          <Center p="md">
            <Stack align="center" gap="sm">
              <IconClock size={32} color="gray" />
              <Text c="dimmed" size="sm">No upcoming expenses in the next {previewDays} days</Text>
            </Stack>
          </Center>
        ) : (
          <>
            {/* Summary */}
            <Card withBorder p="md" bg="purple.0">
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed">Total for next {previewDays} days</Text>
                  <Group gap="xs">
                    <NumberFormatter 
                      value={calculateTotalForPeriod()} 
                      prefix="£" 
                      style={{ fontSize: '1.2em', fontWeight: 600 }}
                    />
                    <Badge variant="light" color="purple" size="sm">
                      {upcomingExpenses.length} expenses
                    </Badge>
                  </Group>
                </div>
                <IconTrendingUp size={24} color="#7a33ff" />
              </Group>
            </Card>

            {/* Timeline of upcoming expenses */}
            <div style={{ maxHeight: showAll ? 'none' : '400px', overflowY: 'auto' }}>
              <Timeline>
                {Object.entries(groupExpensesByDate()).map(([date, expenses]) => (
                  <Timeline.Item 
                    key={date}
                    bullet={<IconClock size={12} />}
                    title={formatDate(date)}
                  >
                    <Stack gap="xs" mt="xs">
                      {expenses.map((expense, index) => (
                        <Card 
                          key={`${expense.recurring_id}-${index}`}
                          withBorder 
                          p="xs"
                          bg="gray.0"
                        >
                          <Group justify="space-between">
                            <div>
                              <Text size="sm" fw={500}>{expense.name}</Text>
                              <Group gap="xs">
                                <Badge variant="light" size="xs">
                                  {expense.category}
                                </Badge>
                                <Badge variant="light" color="blue" size="xs">
                                  {expense.frequency}
                                </Badge>
                              </Group>
                              {expense.description && (
                                <Text size="xs" c="dimmed" mt={2}>
                                  {expense.description}
                                </Text>
                              )}
                            </div>
                            <NumberFormatter 
                              value={expense.amount} 
                              prefix="£" 
                              fw={500}
                            />
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>

            {/* Show more/less button */}
            {upcomingExpenses.length > 10 && (
              <>
                <Divider />
                <Group justify="center">
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconEye size={14} />}
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? 'Show Less' : `Show All ${upcomingExpenses.length} Expenses`}
                  </Button>
                </Group>
              </>
            )}
          </>
        )}
      </Stack>
    </Card>
  )
}

export default UpcomingExpensesPreview