import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Group,
  Text,
  NumberInput,
  Select,
  Button,
  Card,
  Badge,
  Alert,
  Progress,
  NumberFormatter,
  SimpleGrid,
  Title,
  Divider,
  ThemeIcon,
  List
} from '@mantine/core'
import {
  IconCalculator,
  IconTrendingUp,
  IconTrendingDown,
  IconTarget,
  IconAlertTriangle,
  IconCheck,
  IconPigMoney,
  IconCalendar
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { insightService } from 'src/domains/intelligent-insights/services/InsightService'
import { SimulationTypes } from 'src/domains/intelligent-insights/types'

function BudgetSimulator({ opened, onClose, initialCategory = '', onSimulationComplete }) {
  const [simulation, setSimulation] = useState({
    category: initialCategory,
    change_amount: '',
    change_type: SimulationTypes.CATEGORY_REDUCTION,
    months_to_project: 6
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    if (opened) {
      loadCategories()
      if (initialCategory) {
        setSimulation(prev => ({ ...prev, category: initialCategory }))
      }
    }
  }, [opened, initialCategory])

  const loadCategories = async () => {
    // This would ideally come from a budget service or category service
    // For now, using common categories
    const commonCategories = [
      'Food & Drink',
      'Groceries', 
      'Transport',
      'Entertainment',
      'Shopping',
      'Health & Fitness',
      'Utilities',
      'Coffee',
      'Dining Out',
      'Subscriptions'
    ]
    setCategories(commonCategories.map(cat => ({ value: cat, label: cat })))
  }

  const handleSimulate = async () => {
    if (!simulation.category || !simulation.change_amount) {
      setError('Please select a category and enter an amount')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await insightService.simulateBudgetChange({
        category: simulation.category,
        change_amount: parseFloat(simulation.change_amount),
        change_type: simulation.change_type,
        months_to_project: simulation.months_to_project
      })

      if (error) {
        setError(error)
        return
      }

      setResult(data)
      
      if (onSimulationComplete) {
        onSimulationComplete(data)
      }

    } catch (err) {
      setError('Failed to run simulation')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSimulation({
      category: initialCategory,
      change_amount: '',
      change_type: SimulationTypes.CATEGORY_REDUCTION,
      months_to_project: 6
    })
    setResult(null)
    setError('')
  }

  const getImpactColor = (level) => {
    switch (level) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'green'
      default: return 'blue'
    }
  }

  const getImpactIcon = (level) => {
    switch (level) {
      case 'high': return IconAlertTriangle
      case 'medium': return IconTarget
      case 'low': return IconCheck
      default: return IconTrendingUp
    }
  }

  const changeTypeOptions = [
    { value: SimulationTypes.CATEGORY_REDUCTION, label: 'Reduce spending' },
    { value: SimulationTypes.CATEGORY_INCREASE, label: 'Increase budget' },
    { value: SimulationTypes.BUDGET_REALLOCATION, label: 'Set new budget' }
  ]

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconCalculator size={20} />
          <Text fw={500}>Budget Impact Simulator</Text>
        </Group>
      }
      size="xl"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red">
            {error}
          </Alert>
        )}

        {/* Simulation Input */}
        <Card withBorder p="md" bg="blue.0">
          <Stack gap="md">
            <Title order={4}>Simulation Settings</Title>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Select
                label="Category"
                placeholder="Select category to simulate"
                value={simulation.category}
                onChange={(value) => setSimulation(prev => ({ ...prev, category: value }))}
                data={categories}
                required
              />

              <Select
                label="Change Type"
                value={simulation.change_type}
                onChange={(value) => setSimulation(prev => ({ ...prev, change_type: value }))}
                data={changeTypeOptions}
                required
              />

              <NumberInput
                label="Amount (£)"
                placeholder="Enter amount"
                value={simulation.change_amount}
                onChange={(value) => setSimulation(prev => ({ ...prev, change_amount: value }))}
                min={0}
                step={10}
                prefix="£"
                required
              />

              <NumberInput
                label="Projection Period (months)"
                value={simulation.months_to_project}
                onChange={(value) => setSimulation(prev => ({ ...prev, months_to_project: value }))}
                min={1}
                max={24}
                step={1}
              />
            </SimpleGrid>

            <Group justify="space-between">
              <Button variant="light" onClick={handleReset} disabled={loading}>
                Reset
              </Button>
              <Button 
                onClick={handleSimulate} 
                loading={loading}
                disabled={!simulation.category || !simulation.change_amount}
              >
                Run Simulation
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Simulation Results */}
        {result && (
          <Stack gap="md">
            {/* Current vs New Budget */}
            <Card withBorder p="md">
              <Title order={4} mb="md">Budget Impact Analysis</Title>
              
              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                <div>
                  <Text size="sm" c="dimmed">Current Budget</Text>
                  <NumberFormatter 
                    value={result.current_budget} 
                    prefix="£" 
                    fw={600}
                    size="lg"
                  />
                </div>
                <div>
                  <Text size="sm" c="dimmed">New Budget</Text>
                  <NumberFormatter 
                    value={result.budget_impact.new_budget} 
                    prefix="£" 
                    fw={600}
                    size="lg"
                    style={{ color: result.budget_impact.difference < 0 ? 'green' : 'red' }}
                  />
                </div>
                <div>
                  <Text size="sm" c="dimmed">Monthly Change</Text>
                  <Group gap="xs">
                    <NumberFormatter 
                      value={Math.abs(result.budget_impact.difference)} 
                      prefix={result.budget_impact.difference < 0 ? '-£' : '+£'}
                      fw={600}
                      size="lg"
                      style={{ color: result.budget_impact.difference < 0 ? 'green' : 'red' }}
                    />
                    <Badge 
                      color={getImpactColor(result.budget_impact.impact_level)}
                      variant="light"
                      size="sm"
                    >
                      {result.budget_impact.impact_level} impact
                    </Badge>
                  </Group>
                </div>
              </SimpleGrid>

              <Progress
                value={Math.abs(result.budget_impact.percentage_change)}
                color={getImpactColor(result.budget_impact.impact_level)}
                size="lg"
                radius="md"
                mt="md"
                label={`${result.budget_impact.percentage_change.toFixed(1)}% change`}
              />
            </Card>

            {/* Projections */}
            <Card withBorder p="md" bg="green.0">
              <Group mb="md">
                <IconCalendar size={20} color="green" />
                <Title order={4}>Financial Projections</Title>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                <div>
                  <Text size="sm" c="dimmed">Monthly Impact</Text>
                  <NumberFormatter 
                    value={Math.abs(result.projections.monthly_impact)} 
                    prefix={result.projections.monthly_impact < 0 ? 'Save £' : 'Spend £'}
                    fw={600}
                  />
                </div>
                <div>
                  <Text size="sm" c="dimmed">{result.projections.months_projected}-Month Total</Text>
                  <NumberFormatter 
                    value={Math.abs(result.projections.projected_period_savings)} 
                    prefix={result.projections.projected_period_savings < 0 ? 'Save £' : 'Spend £'}
                    fw={600}
                  />
                </div>
                <div>
                  <Text size="sm" c="dimmed">Annual Impact</Text>
                  <NumberFormatter 
                    value={Math.abs(result.projections.projected_annual_savings)} 
                    prefix={result.projections.projected_annual_savings < 0 ? 'Save £' : 'Spend £'}
                    fw={600}
                  />
                </div>
              </SimpleGrid>
            </Card>

            {/* Alternative Scenarios */}
            {result.alternative_scenarios && result.alternative_scenarios.length > 0 && (
              <Card withBorder p="md">
                <Title order={4} mb="md">Alternative Scenarios</Title>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                  {result.alternative_scenarios.map((scenario, index) => (
                    <Card key={index} withBorder p="sm" bg="gray.0">
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text fw={500} size="sm">{scenario.name}</Text>
                          <Badge 
                            color={scenario.difficulty === 'easy' ? 'green' : 
                                   scenario.difficulty === 'medium' ? 'orange' : 'red'}
                            variant="light"
                            size="xs"
                          >
                            {scenario.difficulty}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">{scenario.description}</Text>
                        <Group justify="space-between">
                          <Text size="xs" c="green" fw={500}>
                            Save £{scenario.projected_savings}
                          </Text>
                          <Button size="xs" variant="light">
                            Apply
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <Card withBorder p="md" bg="orange.0">
                <Group mb="md">
                  <IconPigMoney size={20} color="orange" />
                  <Title order={4}>Recommendations</Title>
                </Group>
                <List size="sm" spacing="xs">
                  {result.recommendations.map((rec, index) => (
                    <List.Item key={index}>
                      <Text size="sm">{rec}</Text>
                    </List.Item>
                  ))}
                </List>
              </Card>
            )}
          </Stack>
        )}

        {/* Actions */}
        <Group justify="space-between">
          <Button variant="light" onClick={onClose}>
            Close
          </Button>
          {result && (
            <Group>
              <Button variant="light" color="green">
                Apply Changes
              </Button>
              <Button variant="filled" color="blue">
                Save Simulation
              </Button>
            </Group>
          )}
        </Group>
      </Stack>
    </Modal>
  )
}

export default BudgetSimulator