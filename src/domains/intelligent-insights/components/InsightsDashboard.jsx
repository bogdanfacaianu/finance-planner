import { useState, useEffect } from 'react'
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Badge,
  Button,
  Alert,
  Progress,
  NumberFormatter,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Divider,
  ThemeIcon,
  List,
  Collapse
} from '@mantine/core'
import {
  IconBulb,
  IconTrendingUp,
  IconTrendingDown,
  IconPigMoney,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconAlertTriangle,
  IconTarget,
  IconRobot
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { insightService } from 'src/domains/intelligent-insights/services/InsightService'
import { InsightPriority } from 'src/domains/intelligent-insights/types'

function InsightsDashboard({ refreshTrigger = 0 }) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSuggestions, setExpandedSuggestions] = useState({})

  useEffect(() => {
    loadInsights()
  }, [refreshTrigger])

  const loadInsights = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await insightService.getInsightsDashboard()
      
      if (error) {
        setError(error)
        return
      }

      setInsights(data)
    } catch (err) {
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const toggleSuggestionExpansion = (index) => {
    setExpandedSuggestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case InsightPriority.HIGH: return 'red'
      case InsightPriority.MEDIUM: return 'orange'
      case InsightPriority.LOW: return 'blue'
      default: return 'gray'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case InsightPriority.HIGH: return IconAlertTriangle
      case InsightPriority.MEDIUM: return IconTarget
      case InsightPriority.LOW: return IconBulb
      default: return IconBulb
    }
  }

  const formatTrendData = () => {
    if (!insights?.spending_trends || insights.spending_trends.length < 2) return null

    const trends = insights.spending_trends
    const latest = trends[trends.length - 1]
    const previous = trends[trends.length - 2]
    const change = latest.total_spent - previous.total_spent
    const percentChange = previous.total_spent > 0 ? (change / previous.total_spent) * 100 : 0

    return {
      current: latest.total_spent,
      previous: previous.total_spent,
      change,
      percentChange: Math.round(percentChange * 10) / 10,
      isIncrease: change > 0
    }
  }

  if (loading) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Group>
          <IconRobot size={24} color="#4f46e5" />
          <Text>Loading intelligent insights...</Text>
        </Group>
      </Card>
    )
  }

  if (error) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Alert icon={<IconAlertTriangle size={16} />} color="red">
          {error}
        </Alert>
      </Card>
    )
  }

  if (!insights) {
    return null
  }

  const trendData = formatTrendData()
  const { quick_stats = {}, savings_suggestions = [], action_items = [] } = insights

  return (
    <Stack gap="lg">
      {/* Header */}
      <Card withBorder radius="lg" p="xl" bg="indigo.0" style={{ borderColor: '#4f46e5' }}>
        <Group justify="space-between" align="flex-start">
          <div>
            <Group mb="sm">
              <IconRobot size={28} color="#4f46e5" />
              <Title order={2} c="indigo.8" fw={700}>Intelligent Insights</Title>
              <Badge variant="light" color="indigo" size="sm">AI-Powered</Badge>
            </Group>
            <Text c="dimmed" size="md" maw={500}>
              Get personalized recommendations and smart insights to optimize your spending and reach your financial goals.
            </Text>
          </div>
          <Tooltip label="Refresh insights">
            <ActionIcon
              variant="light"
              color="indigo"
              size="lg"
              onClick={loadInsights}
              loading={loading}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card>

      {/* Quick Stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Card withBorder p="md" bg="blue.0">
          <Stack gap="xs" align="center">
            <IconTrendingUp size={24} color="blue" />
            <Text size="sm" c="dimmed" ta="center">This Month</Text>
            <Text fw={600} size="lg">{quick_stats.total_transactions || 0} transactions</Text>
          </Stack>
        </Card>

        <Card withBorder p="md" bg="green.0">
          <Stack gap="xs" align="center">
            <IconTarget size={24} color="green" />
            <Text size="sm" c="dimmed" ta="center">Top Category</Text>
            <Text fw={600} size="lg" ta="center">{quick_stats.top_spending_category || 'N/A'}</Text>
          </Stack>
        </Card>

        <Card withBorder p="md" bg="orange.0">
          <Stack gap="xs" align="center">
            <IconPigMoney size={24} color="orange" />
            <Text size="sm" c="dimmed" ta="center">Avg Transaction</Text>
            <NumberFormatter 
              value={quick_stats.average_transaction || 0} 
              prefix="£" 
              decimalScale={2}
              style={{ fontWeight: 600, fontSize: '1.125rem' }}
            />
          </Stack>
        </Card>

        {trendData && (
          <Card withBorder p="md" bg={trendData.isIncrease ? "red.0" : "teal.0"}>
            <Stack gap="xs" align="center">
              {trendData.isIncrease ? (
                <IconTrendingUp size={24} color="red" />
              ) : (
                <IconTrendingDown size={24} color="teal" />
              )}
              <Text size="sm" c="dimmed" ta="center">Monthly Change</Text>
              <Text fw={600} size="lg" c={trendData.isIncrease ? "red" : "teal"}>
                {trendData.isIncrease ? '+' : ''}{trendData.percentChange}%
              </Text>
            </Stack>
          </Card>
        )}
      </SimpleGrid>

      {/* Action Items */}
      {action_items.length > 0 && (
        <Card withBorder radius="lg" p="xl">
          <Group mb="md">
            <IconCheck size={20} color="green" />
            <Title order={3}>Quick Actions</Title>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {action_items.map((item, index) => (
              <Card key={index} withBorder p="md" bg="gray.0">
                <Stack gap="sm">
                  <Badge 
                    color={getPriorityColor(item.priority)} 
                    variant="light" 
                    size="sm"
                  >
                    {item.priority} priority
                  </Badge>
                  <Text fw={500} size="sm">{item.title}</Text>
                  <Text size="xs" c="dimmed">{item.description}</Text>
                  <Group justify="space-between">
                    <Text size="xs" c="green" fw={500}>
                      Save £{item.potential_impact}
                    </Text>
                    <Button size="xs" variant="light" color="green">
                      Apply
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Card>
      )}

      {/* Savings Suggestions */}
      {savings_suggestions.length > 0 && (
        <Card withBorder radius="lg" p="xl">
          <Group mb="md">
            <IconPigMoney size={20} color="green" />
            <Title order={3}>Savings Opportunities</Title>
            <Badge color="green" variant="light">
              {savings_suggestions.length} suggestions
            </Badge>
          </Group>

          <Stack gap="md">
            {savings_suggestions.map((suggestion, index) => {
              const PriorityIcon = getPriorityIcon(suggestion.priority)
              const isExpanded = expandedSuggestions[index]

              return (
                <Card key={index} withBorder p="md" bg="green.0">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Group>
                        <ThemeIcon 
                          color={getPriorityColor(suggestion.priority)} 
                          variant="light"
                          size="sm"
                        >
                          <PriorityIcon size={14} />
                        </ThemeIcon>
                        <div>
                          <Text fw={500} size="sm">{suggestion.title}</Text>
                          <Text size="xs" c="dimmed">{suggestion.category}</Text>
                        </div>
                      </Group>
                      <Group gap="xs">
                        <Badge color="green" variant="light">
                          Save £{suggestion.potential_saving}/month
                        </Badge>
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => toggleSuggestionExpansion(index)}
                        >
                          {isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Text size="sm">{suggestion.description}</Text>

                    <Group>
                      <Text size="xs" c="dimmed">
                        Current monthly spend: <NumberFormatter value={suggestion.current_monthly_spend} prefix="£" />
                      </Text>
                      <Text size="xs" c="dimmed">
                        Based on {suggestion.data_points} transactions
                      </Text>
                    </Group>

                    <Collapse in={isExpanded}>
                      <Stack gap="sm" mt="sm">
                        <Divider />
                        <Text size="sm" fw={500}>Actionable Tips:</Text>
                        <List size="sm" spacing="xs">
                          {suggestion.actionable_tips?.map((tip, tipIndex) => (
                            <List.Item key={tipIndex}>
                              <Text size="sm">{tip}</Text>
                            </List.Item>
                          ))}
                        </List>
                        
                        <Group justify="flex-end" mt="sm">
                          <Button size="xs" variant="light" color="green">
                            Simulate Savings
                          </Button>
                          <Button size="xs" variant="filled" color="green">
                            Apply Suggestion
                          </Button>
                        </Group>
                      </Stack>
                    </Collapse>
                  </Stack>
                </Card>
              )
            })}
          </Stack>
        </Card>
      )}

      {/* Spending Trends */}
      {trendData && insights.spending_trends && (
        <Card withBorder radius="lg" p="xl">
          <Group mb="md">
            <IconTrendingUp size={20} color="blue" />
            <Title order={3}>Spending Trends</Title>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <div>
              <Text size="sm" c="dimmed" mb="sm">Monthly Spending Comparison</Text>
              <Group mb="md">
                <div>
                  <Text size="xs" c="dimmed">Previous Month</Text>
                  <NumberFormatter value={trendData.previous} prefix="£" fw={500} />
                </div>
                <div>
                  <Text size="xs" c="dimmed">This Month</Text>
                  <NumberFormatter value={trendData.current} prefix="£" fw={500} />
                </div>
                <div>
                  <Text size="xs" c="dimmed">Change</Text>
                  <Text 
                    fw={500} 
                    c={trendData.isIncrease ? "red" : "green"}
                  >
                    {trendData.isIncrease ? '+' : ''}
                    <NumberFormatter value={Math.abs(trendData.change)} prefix="£" />
                    ({trendData.percentChange}%)
                  </Text>
                </div>
              </Group>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb="sm">6-Month Overview</Text>
              <Stack gap="xs">
                {insights.spending_trends.slice(-3).map((month, index) => (
                  <Group key={index} justify="space-between">
                    <Text size="sm">{month.name}</Text>
                    <NumberFormatter value={month.total_spent} prefix="£" />
                  </Group>
                ))}
              </Stack>
            </div>
          </SimpleGrid>
        </Card>
      )}

      {/* Empty State */}
      {savings_suggestions.length === 0 && action_items.length === 0 && (
        <Card withBorder radius="lg" p="xl">
          <Stack align="center" gap="md">
            <IconBulb size={48} color="gray" />
            <Title order={3} ta="center" c="dimmed">No Insights Available Yet</Title>
            <Text ta="center" c="dimmed" maw={400}>
              Add more transactions and set up budgets to get personalized savings suggestions and intelligent insights about your spending patterns.
            </Text>
            <Button variant="light" onClick={loadInsights}>
              Check Again
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
  )
}

export default InsightsDashboard