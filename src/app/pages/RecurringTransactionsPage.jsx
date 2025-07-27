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
  Badge,
  ActionIcon,
  Avatar,
  Tooltip,
  Divider,
  Grid,
  Alert,
  NumberFormatter
} from '@mantine/core'
import { 
  IconLogout, 
  IconWallet, 
  IconUser, 
  IconArrowLeft, 
  IconPlus,
  IconCalendarRepeat,
  IconRefresh,
  IconAlertTriangle,
  IconClock
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { authService } from 'src/domains/authentication/services/AuthService'
import { recurringTransactionService } from 'src/domains/recurring-transactions/services/RecurringTransactionService'
import RecurringTransactionForm from 'src/domains/recurring-transactions/components/RecurringTransactionForm'
import RecurringTransactionsList from 'src/domains/recurring-transactions/components/RecurringTransactionsList'
import UpcomingExpensesPreview from 'src/domains/recurring-transactions/components/UpcomingExpensesPreview'

function RecurringTransactionsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [overdueCount, setOverdueCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { session, error } = await authService.getSession()
        if (error || !session) {
          navigate('/login')
        } else {
          setUser(session.user)
        }
        setLoading(false)
      } catch (err) {
        console.error('Auth check error:', err)
        setLoading(false)
        navigate('/login')
      }
    }

    checkAuth()

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

  useEffect(() => {
    if (user) {
      checkOverdueTransactions()
    }
  }, [user, refreshTrigger])

  const checkOverdueTransactions = async () => {
    try {
      const { data } = await recurringTransactionService.getRecurringTransactions({ 
        is_active: true,
        status: 'active'
      })
      
      if (data) {
        const today = new Date().toISOString().split('T')[0]
        const overdue = data.filter(recurring => 
          recurring.next_generation_date && recurring.next_generation_date < today
        )
        setOverdueCount(overdue.length)
      }
    } catch (err) {
      console.error('Error checking overdue transactions:', err)
    }
  }

  const handleLogout = async () => {
    const { error } = await authService.signOut()
    if (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleGenerateOverdue = async () => {
    setGenerating(true)
    try {
      const { data, error } = await recurringTransactionService.generateDueRecurringExpenses()
      
      if (error) {
        notifications.show({
          title: 'Error',
          message: error,
          color: 'red'
        })
        return
      }

      if (data.successful_generations > 0) {
        notifications.show({
          title: 'Expenses Generated',
          message: `Successfully generated ${data.successful_generations} expenses`,
          color: 'green'
        })
        
        setRefreshTrigger(prev => prev + 1)
        setOverdueCount(0)
      } else {
        notifications.show({
          title: 'No Expenses Generated',
          message: 'No due recurring transactions found',
          color: 'blue'
        })
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to generate recurring expenses',
        color: 'red'
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
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
            {/* Header */}
            <Card withBorder radius="lg" p="xl" bg="orange.1" style={{ borderColor: '#ea580c' }}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group mb="sm">
                    <ActionIcon
                      variant="light"
                      color="gray"
                      size="lg"
                      onClick={() => navigate('/')}
                    >
                      <IconArrowLeft size={18} />
                    </ActionIcon>
                    <IconCalendarRepeat size={24} color="#ea580c" />
                    <Title order={1} c="orange.8" fw={700}>Recurring Transactions</Title>
                    <Badge variant="light" color="orange" size="sm">Automation</Badge>
                  </Group>
                  <Text c="dimmed" size="md" maw={500}>
                    Set up automatic recurring expenses like daily coffee, monthly subscriptions, or weekly groceries. 
                    Never forget a regular expense again.
                  </Text>
                </div>
                
                <Group>
                  {overdueCount > 0 && (
                    <Button
                      leftSection={<IconAlertTriangle size={18} />}
                      onClick={handleGenerateOverdue}
                      loading={generating}
                      color="red"
                      variant="light"
                      size="lg"
                      radius="lg"
                    >
                      Generate {overdueCount} Overdue
                    </Button>
                  )}
                  
                  <ActionIcon
                    variant="light"
                    color="orange"
                    size="lg"
                    onClick={handleRefresh}
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                  
                  <Button
                    leftSection={<IconPlus size={18} />}
                    onClick={() => setShowForm(true)}
                    size="lg"
                    radius="lg"
                    variant="gradient"
                    gradient={{ from: 'orange.6', to: 'orange.8' }}
                  >
                    Add Recurring Transaction
                  </Button>
                </Group>
              </Group>
            </Card>

            {/* Overdue Alert */}
            {overdueCount > 0 && (
              <Alert 
                color="red" 
                icon={<IconAlertTriangle size={16} />}
                variant="light"
              >
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>Overdue Recurring Transactions</Text>
                    <Text size="sm">
                      You have {overdueCount} recurring transaction{overdueCount > 1 ? 's' : ''} that should have generated expenses.
                    </Text>
                  </div>
                  <Button 
                    size="xs" 
                    color="red"
                    loading={generating}
                    onClick={handleGenerateOverdue}
                  >
                    Generate Now
                  </Button>
                </Group>
              </Alert>
            )}

            {/* Main Content Grid */}
            <Grid>
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <RecurringTransactionsList refreshTrigger={refreshTrigger} />
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Stack gap="md">
                  <UpcomingExpensesPreview refreshTrigger={refreshTrigger} />
                  
                  {/* Quick Stats Card */}
                  <Card withBorder p="md">
                    <Group mb="md">
                      <IconClock size={16} />
                      <Text fw={500} size="sm">Quick Actions</Text>
                    </Group>
                    
                    <Stack gap="xs">
                      <Button
                        variant="light"
                        fullWidth
                        size="xs"
                        onClick={() => setShowForm(true)}
                        leftSection={<IconPlus size={14} />}
                      >
                        New Recurring Transaction
                      </Button>
                      
                      <Button
                        variant="light"
                        fullWidth
                        size="xs"
                        onClick={handleRefresh}
                        leftSection={<IconRefresh size={14} />}
                      >
                        Refresh All Data
                      </Button>
                      
                      {overdueCount > 0 && (
                        <Button
                          variant="light"
                          color="red"
                          fullWidth
                          size="xs"
                          loading={generating}
                          onClick={handleGenerateOverdue}
                          leftSection={<IconAlertTriangle size={14} />}
                        >
                          Process Overdue ({overdueCount})
                        </Button>
                      )}
                    </Stack>
                  </Card>
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </Container>

        {/* Add Form Modal */}
        <RecurringTransactionForm
          opened={showForm}
          onClose={() => setShowForm(false)}
          onRecurringAdded={() => {
            setRefreshTrigger(prev => prev + 1)
            setShowForm(false)
          }}
        />
      </AppShell.Main>
    </AppShell>
  )
}

export default RecurringTransactionsPage