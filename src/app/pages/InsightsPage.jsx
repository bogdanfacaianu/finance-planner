import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppShell,
  Title,
  Group,
  Text,
  Container,
  Stack,
  Loader,
  Center,
  Button,
  ActionIcon,
  Avatar,
  Tooltip,
  Divider,
  Card,
  SimpleGrid,
  Badge
} from '@mantine/core'
import { 
  IconLogout, 
  IconUser, 
  IconArrowLeft,
  IconWallet,
  IconRobot,
  IconBulb,
  IconCalculator,
  IconWand
} from '@tabler/icons-react'
import { authService } from 'src/domains/authentication/services/AuthService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import InsightsDashboard from 'src/domains/intelligent-insights/components/InsightsDashboard'
import BudgetSimulator from 'src/domains/intelligent-insights/components/BudgetSimulator'
import SmartCategorization from 'src/domains/intelligent-insights/components/SmartCategorization'

function InsightsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBudgetSimulator, setShowBudgetSimulator] = useState(false)
  const [showSmartCategorization, setShowSmartCategorization] = useState(false)
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const { session, error } = await authService.getSession()
      if (error || !session) {
        navigate('/login')
      } else {
        setUser(session.user)
        await loadUncategorizedTransactions()
      }
      setLoading(false)
    }

    checkAuth()
  }, [navigate])

  const loadUncategorizedTransactions = async () => {
    try {
      const { data: expenses } = await expenseService.getExpenses()
      if (expenses) {
        // Find transactions that might benefit from smart categorization
        const needsCategorization = expenses.filter(expense => 
          expense.category === 'Other' || 
          !expense.category || 
          (expense.notes && expense.notes.length > 3 && expense.category === 'Other')
        )
        setUncategorizedTransactions(needsCategorization.slice(0, 20)) // Limit to 20 for performance
      }
    } catch (err) {
      console.error('Error loading transactions:', err)
    }
  }

  const handleLogout = async () => {
    const { error } = await authService.signOut()
    if (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleRefreshInsights = () => {
    setRefreshTrigger(prev => prev + 1)
    loadUncategorizedTransactions()
  }

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      styles={{
        header: { backgroundColor: '#16213e', borderBottom: '1px solid #3730a3' }
      }}
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            <Group>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
              <IconRobot size={28} color="#4f46e5" />
              <Title order={2} c="navy.7" fw={700}>AI Insights</Title>
            </Group>
            <Group gap="md">
              <Group gap="xs">
                <Avatar size={32} color="financial" radius="xl">
                  <IconUser size={18} />
                </Avatar>
                <div>
                  <Text size="sm" fw={500}>{user.email?.split('@')[0]}</Text>
                </div>
              </Group>
              <Divider orientation="vertical" size="sm" />
              <Tooltip label="Sign out">
                <ActionIcon
                  variant="light"
                  color="red"
                  size="lg"
                  onClick={handleLogout}
                >
                  <IconLogout size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Stack gap="xl">
            {/* Header Card */}
            <Card withBorder radius="lg" p="xl" bg="indigo.0" style={{ borderColor: '#4f46e5' }}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group mb="sm">
                    <IconRobot size={32} color="#4f46e5" />
                    <div>
                      <Title order={1} c="indigo.8" fw={700}>Intelligent Financial Insights</Title>
                      <Text c="dimmed" size="md">
                        AI-powered recommendations to optimize your spending and achieve your financial goals
                      </Text>
                    </div>
                  </Group>
                </div>
                <Badge variant="light" color="indigo" size="lg">
                  Powered by AI
                </Badge>
              </Group>
            </Card>

            {/* AI Tools Grid */}
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              
              {/* Budget Simulator */}
              <Card withBorder radius="lg" p="xl" bg="blue.0" style={{ borderColor: '#3b82f6' }}>
                <Stack gap="md">
                  <Group>
                    <IconCalculator size={24} color="#3b82f6" />
                    <Title order={3} c="blue.8" fw={700}>Budget Simulator</Title>
                  </Group>
                  <Text c="dimmed" size="sm">
                    Simulate budget changes and see the projected impact on your finances. 
                    Test different scenarios before making actual changes.
                  </Text>
                  <Button
                    leftSection={<IconCalculator size={18} />}
                    onClick={() => setShowBudgetSimulator(true)}
                    variant="gradient"
                    gradient={{ from: 'blue.6', to: 'blue.8' }}
                    radius="lg"
                    fullWidth
                  >
                    Open Simulator
                  </Button>
                </Stack>
              </Card>

              {/* Smart Categorization */}
              <Card withBorder radius="lg" p="xl" bg="purple.0" style={{ borderColor: '#8b5cf6' }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group>
                      <IconWand size={24} color="#8b5cf6" />
                      <Title order={3} c="purple.8" fw={700}>Smart Categorization</Title>
                    </Group>
                    {uncategorizedTransactions.length > 0 && (
                      <Badge color="orange" variant="light">
                        {uncategorizedTransactions.length} pending
                      </Badge>
                    )}
                  </Group>
                  <Text c="dimmed" size="sm">
                    Automatically categorize transactions using AI pattern recognition. 
                    Save time on manual categorization.
                  </Text>
                  <Button
                    leftSection={<IconWand size={18} />}
                    onClick={() => setShowSmartCategorization(true)}
                    variant="gradient"
                    gradient={{ from: 'purple.6', to: 'purple.8' }}
                    radius="lg"
                    fullWidth
                    disabled={uncategorizedTransactions.length === 0}
                  >
                    {uncategorizedTransactions.length > 0 
                      ? `Categorize ${uncategorizedTransactions.length} transactions`
                      : 'No transactions to categorize'
                    }
                  </Button>
                </Stack>
              </Card>

              {/* Savings Optimizer */}
              <Card withBorder radius="lg" p="xl" bg="green.0" style={{ borderColor: '#10b981' }}>
                <Stack gap="md">
                  <Group>
                    <IconBulb size={24} color="#10b981" />
                    <Title order={3} c="green.8" fw={700}>Savings Optimizer</Title>
                  </Group>
                  <Text c="dimmed" size="sm">
                    Get personalized suggestions on where to save money based on your spending patterns 
                    and trends.
                  </Text>
                  <Button
                    leftSection={<IconBulb size={18} />}
                    onClick={handleRefreshInsights}
                    variant="gradient"
                    gradient={{ from: 'green.6', to: 'green.8' }}
                    radius="lg"
                    fullWidth
                  >
                    Refresh Insights
                  </Button>
                </Stack>
              </Card>
            </SimpleGrid>

            {/* Main Insights Dashboard */}
            <InsightsDashboard refreshTrigger={refreshTrigger} />
          </Stack>
        </Container>

        {/* Modals */}
        <BudgetSimulator
          opened={showBudgetSimulator}
          onClose={() => setShowBudgetSimulator(false)}
          onSimulationComplete={(result) => {
            console.log('Simulation completed:', result)
            // Could show toast notification or store result
          }}
        />

        <SmartCategorization
          opened={showSmartCategorization}
          onClose={() => setShowSmartCategorization(false)}
          transactions={uncategorizedTransactions}
          onCategorizeComplete={(count) => {
            console.log(`Categorized ${count} transactions`)
            loadUncategorizedTransactions() // Refresh the list
            setRefreshTrigger(prev => prev + 1) // Refresh insights
          }}
        />
      </AppShell.Main>
    </AppShell>
  )
}

export default InsightsPage