import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppShell,
  Title,
  Group,
  Button,
  Text,
  Container,
  Stack,
  Loader,
  Center,
  Card,
  Grid,
  Badge,
  ActionIcon,
  Avatar,
  Tooltip,
  Divider
} from '@mantine/core'
import { IconLogout, IconPlus, IconWallet, IconTrendingUp, IconUser, IconChartPie, IconArrowRight, IconCategory, IconDashboard, IconFileImport, IconCalendarRepeat, IconBell, IconSettings, IconRobot } from '@tabler/icons-react'
import { authService } from 'src/domains/authentication/services/AuthService'
import ExpenseForm from 'src/domains/expense-management/components/ExpenseForm'
import ExpensesList from 'src/domains/expense-management/components/ExpensesList'
import ExpenseEditModal from 'src/domains/expense-management/components/ExpenseEditModal'
import ImportWizard from 'src/domains/transaction-import/components/ImportWizard'
import AlertCenter from 'src/domains/alerts-notifications/components/AlertCenter'
import { alertService } from 'src/domains/alerts-notifications/services/AlertService'

function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [refreshExpenses, setRefreshExpenses] = useState(0)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [alertRefresh, setAlertRefresh] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { session, error } = await authService.getSession()
      if (error || !session) {
        navigate('/login')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
        navigate('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  // Run alert checks when user is authenticated
  useEffect(() => {
    if (user) {
      const runAlertChecks = async () => {
        try {
          await alertService.runAlertChecks()
          setAlertRefresh(prev => prev + 1)
        } catch (err) {
          console.error('Error running alert checks:', err)
        }
      }
      
      // Run checks immediately
      runAlertChecks()
      
      // Set up periodic checks (every 30 minutes)
      const interval = setInterval(runAlertChecks, 30 * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  const handleLogout = async () => {
    const { error } = await authService.signOut()
    if (error) {
      console.error('Error logging out:', error)
    }
    // Navigation will happen automatically via auth state change
  }

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    )
  }

  if (!user) {
    return null // Will redirect to login
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
              <IconWallet size={28} color="#174ae4" />
              <Title order={2} c="navy.7" fw={700}>Financial Planner</Title>
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
              <Tooltip label="Settings">
                <ActionIcon
                  variant="light"
                  color="gray"
                  size="lg"
                  onClick={() => navigate('/settings')}
                >
                  <IconSettings size={18} />
                </ActionIcon>
              </Tooltip>
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
          <Card withBorder radius="lg" p="xl" bg="navy.1" style={{ borderColor: '#3730a3' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group mb="sm">
                  <IconTrendingUp size={24} color="#174ae4" />
                  <Title order={1} c="navy.8" fw={700}>Expense Management</Title>
                  <Badge variant="light" color="navy" size="sm">Active</Badge>
                </Group>
                <Text c="dimmed" size="md" maw={500}>
                  Track your spending patterns and take control of your financial future with intelligent insights.
                </Text>
              </div>
              <Group>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => setShowAddExpense(true)}
                  size="lg"
                  radius="lg"
                  variant="gradient"
                  gradient={{ from: 'navy.6', to: 'navy.8' }}
                >
                  Add Expense
                </Button>
                <Button
                  leftSection={<IconFileImport size={18} />}
                  onClick={() => setShowImportWizard(true)}
                  size="lg"
                  radius="lg"
                  variant="light"
                  color="navy"
                >
                  Import CSV
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Budget Management Card */}
          <Card withBorder radius="lg" p="xl" bg="purple.1" style={{ borderColor: '#5b21b6' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group mb="sm">
                  <IconChartPie size={24} color="#7a33ff" />
                  <Title order={2} c="purple.8" fw={700}>Budget Planning</Title>
                  <Badge variant="light" color="purple" size="sm">Available</Badge>
                </Group>
                <Text c="dimmed" size="md" maw={500}>
                  Set monthly spending limits, track progress, and receive alerts to stay within your financial goals.
                </Text>
              </div>
              <Button
                leftSection={<IconChartPie size={18} />}
                rightSection={<IconArrowRight size={16} />}
                onClick={() => navigate('/budget')}
                size="lg"
                radius="lg"
                variant="gradient"
                gradient={{ from: 'purple.6', to: 'purple.8' }}
              >
                Manage Budgets
              </Button>
            </Group>
          </Card>

          {/* Category Management Card */}
          <Card withBorder radius="lg" p="xl" bg="cyan.1" style={{ borderColor: '#0891b2' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group mb="sm">
                  <IconCategory size={24} color="#0891b2" />
                  <Title order={2} c="cyan.8" fw={700}>Custom Categories</Title>
                  <Badge variant="light" color="cyan" size="sm">New Feature</Badge>
                </Group>
                <Text c="dimmed" size="md" maw={500}>
                  Create personalized spending categories like Flying, Meals Out, or Coffee to match your lifestyle and budget.
                </Text>
              </div>
              <Button
                leftSection={<IconCategory size={18} />}
                rightSection={<IconArrowRight size={16} />}
                onClick={() => navigate('/categories')}
                size="lg"
                radius="lg"
                variant="gradient"
                gradient={{ from: 'cyan.6', to: 'cyan.8' }}
              >
                Manage Categories
              </Button>
            </Group>
          </Card>

          {/* Financial Overview Card */}
          <Card withBorder radius="lg" p="xl" bg="indigo.1" style={{ borderColor: '#4f46e5' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group mb="sm">
                  <IconDashboard size={24} color="#4f46e5" />
                  <Title order={2} c="indigo.8" fw={700}>Financial Overview</Title>
                  <Badge variant="light" color="indigo" size="sm">Dashboard</Badge>
                </Group>
                <Text c="dimmed" size="md" maw={500}>
                  Get comprehensive insights into your financial health, spending patterns, and budget performance.
                </Text>
              </div>
              <Button
                leftSection={<IconDashboard size={18} />}
                rightSection={<IconArrowRight size={16} />}
                onClick={() => navigate('/overview')}
                size="lg"
                radius="lg"
                variant="gradient"
                gradient={{ from: 'indigo.6', to: 'indigo.8' }}
              >
                View Overview
              </Button>
            </Group>
          </Card>

          {/* Recurring Transactions Card */}
          <Card withBorder radius="lg" p="xl" bg="orange.1" style={{ borderColor: '#ea580c' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group mb="sm">
                  <IconCalendarRepeat size={24} color="#ea580c" />
                  <Title order={2} c="orange.8" fw={700}>Recurring Transactions</Title>
                  <Badge variant="light" color="orange" size="sm">Automation</Badge>
                </Group>
                <Text c="dimmed" size="md" maw={500}>
                  Set up automatic recurring expenses like daily coffee, monthly subscriptions, or weekly groceries. Never forget a regular expense again.
                </Text>
              </div>
              <Button
                leftSection={<IconCalendarRepeat size={18} />}
                rightSection={<IconArrowRight size={16} />}
                onClick={() => navigate('/recurring')}
                size="lg"
                radius="lg"
                variant="gradient"
                gradient={{ from: 'orange.6', to: 'orange.8' }}
              >
                Manage Recurring
              </Button>
            </Group>
          </Card>

          {/* AI Insights Card */}
          <Card withBorder radius="lg" p="xl" bg="violet.1" style={{ borderColor: '#8b5cf6' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group mb="sm">
                  <IconRobot size={24} color="#8b5cf6" />
                  <Title order={2} c="violet.8" fw={700}>AI Insights</Title>
                  <Badge variant="light" color="violet" size="sm">Intelligent</Badge>
                </Group>
                <Text c="dimmed" size="md" maw={500}>
                  Get personalized savings suggestions, simulate budget changes, and automatically categorize transactions using AI-powered insights.
                </Text>
              </div>
              <Button
                leftSection={<IconRobot size={18} />}
                rightSection={<IconArrowRight size={16} />}
                onClick={() => navigate('/insights')}
                size="lg"
                radius="lg"
                variant="gradient"
                gradient={{ from: 'violet.6', to: 'violet.8' }}
              >
                View Insights
              </Button>
            </Group>
          </Card>

          {/* Alert Center */}
          <AlertCenter 
            refreshTrigger={alertRefresh}
            compact={true}
            maxHeight="300px"
          />

          {showAddExpense && (
            <ExpenseForm
              onExpenseAdded={(expense) => {
                setRefreshExpenses(prev => prev + 1)
                setAlertRefresh(prev => prev + 1)
                setShowAddExpense(false)
              }}
              onCancel={() => setShowAddExpense(false)}
            />
          )}

          <ExpensesList
            refreshTrigger={refreshExpenses}
            onEdit={(expense) => setEditingExpense(expense)}
          />
        </Stack>
        
        {editingExpense && (
          <ExpenseEditModal
            expense={editingExpense}
            onClose={() => setEditingExpense(null)}
            onExpenseUpdated={() => {
              setRefreshExpenses(prev => prev + 1)
              setAlertRefresh(prev => prev + 1)
              setEditingExpense(null)
            }}
          />
        )}

        <ImportWizard
          opened={showImportWizard}
          onClose={() => setShowImportWizard(false)}
          onImportComplete={() => {
            setRefreshExpenses(prev => prev + 1)
            setShowImportWizard(false)
          }}
        />
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default DashboardPage