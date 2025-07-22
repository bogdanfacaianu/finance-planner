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
  Divider
} from '@mantine/core'
import { IconLogout, IconPlus, IconWallet, IconChartPie, IconUser, IconArrowLeft } from '@tabler/icons-react'
import { authService } from 'src/domains/authentication/services/AuthService'
import BudgetForm from 'src/domains/budget-management/components/BudgetForm'
import BudgetsList from 'src/domains/budget-management/components/BudgetsList'

function BudgetPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [refreshBudgets, setRefreshBudgets] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated
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
          <Card withBorder radius="lg" p="xl" bg="purple.1" style={{ borderColor: '#5b21b6' }}>
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
                  <IconChartPie size={24} color="#7a33ff" />
                  <Title order={1} c="purple.8" fw={700}>Budget Management</Title>
                  <Badge variant="light" color="purple" size="sm">Active</Badge>
                </Group>
                <Text c="dimmed" size="md" maw={500}>
                  Set spending limits, track your progress, and receive alerts to stay within your financial goals.
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => setShowAddBudget(true)}
                size="lg"
                radius="lg"
                variant="gradient"
                gradient={{ from: 'purple.6', to: 'purple.8' }}
              >
                Add Budget
              </Button>
            </Group>
          </Card>

          {showAddBudget && (
            <BudgetForm
              onBudgetAdded={(budget) => {
                setRefreshBudgets(prev => prev + 1)
                setShowAddBudget(false)
              }}
              onCancel={() => setShowAddBudget(false)}
            />
          )}

          <BudgetsList
            refreshTrigger={refreshBudgets}
          />
        </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default BudgetPage