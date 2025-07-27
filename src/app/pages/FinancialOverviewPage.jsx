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
  Select
} from '@mantine/core'
import { IconLogout, IconWallet, IconChartPie, IconUser, IconArrowLeft, IconRefresh } from '@tabler/icons-react'
import { authService } from 'src/domains/authentication/services/AuthService'
import { financialOverviewService } from 'src/domains/financial-overview/services/FinancialOverviewService'
import FinancialOverviewCard from 'src/domains/financial-overview/components/FinancialOverviewCard'
import CategoryProgressGrid from 'src/domains/financial-overview/components/CategoryProgressGrid'
import SpendingDistributionChart from 'src/domains/financial-overview/components/SpendingDistributionChart'
import BudgetComparisonChart from 'src/domains/financial-overview/components/BudgetComparisonChart'
import FinancialTrendsChart from 'src/domains/financial-overview/components/FinancialTrendsChart'

function FinancialOverviewPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [financialOverview, setFinancialOverview] = useState(null)
  const [categoryProgress, setCategoryProgress] = useState([])
  const [financialTrends, setFinancialTrends] = useState([])
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
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
      loadFinancialData()
    }
  }, [user, selectedMonth, selectedYear])

  const loadFinancialData = async () => {
    setOverviewLoading(true)
    try {
      const month = parseInt(selectedMonth)
      const year = parseInt(selectedYear)

      const [overviewResult, progressResult, trendsResult] = await Promise.all([
        financialOverviewService.getFinancialOverview({ month, year }),
        financialOverviewService.getCategoryProgress({ month, year }),
        financialOverviewService.getFinancialTrends(6)
      ])

      if (overviewResult.data) {
        setFinancialOverview(overviewResult.data)
      }

      if (progressResult.data) {
        setCategoryProgress(progressResult.data)
      }

      if (trendsResult.data) {
        setFinancialTrends(trendsResult.data)
      }
    } catch (err) {
      console.error('Error loading financial data:', err)
    } finally {
      setOverviewLoading(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await authService.signOut()
    if (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleRefresh = () => {
    loadFinancialData()
  }

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('en-GB', { month: 'long' })
  }))

  // Generate year options (current year and last 2 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 3 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }))

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
                    <Title order={1} c="purple.8" fw={700}>Financial Overview</Title>
                    <Badge variant="light" color="purple" size="sm">Dashboard</Badge>
                  </Group>
                  <Text c="dimmed" size="md" maw={500}>
                    Comprehensive insights into your financial health, spending patterns, and budget performance.
                  </Text>
                </div>
                
                <Group>
                  <Select
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    data={monthOptions}
                    size="sm"
                    w={120}
                  />
                  <Select
                    value={selectedYear}
                    onChange={setSelectedYear}
                    data={yearOptions}
                    size="sm"
                    w={100}
                  />
                  <ActionIcon
                    variant="light"
                    color="purple"
                    size="lg"
                    onClick={handleRefresh}
                    loading={overviewLoading}
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>

            {/* Financial Overview Summary */}
            <FinancialOverviewCard 
              overview={financialOverview} 
              loading={overviewLoading} 
            />

            {/* Category Progress Grid */}
            <CategoryProgressGrid 
              categoryProgress={categoryProgress} 
              loading={overviewLoading} 
            />

            {/* Charts Section */}
            <Stack gap="xl">
              <Group grow align="flex-start" style={{ alignItems: 'stretch' }}>
                {/* Spending Distribution Chart */}
                <SpendingDistributionChart 
                  categoryProgress={categoryProgress} 
                  loading={overviewLoading} 
                />

                {/* Budget Comparison Chart */}
                <BudgetComparisonChart 
                  categoryProgress={categoryProgress} 
                  loading={overviewLoading} 
                />
              </Group>

              {/* Financial Trends Chart */}
              <FinancialTrendsChart 
                trends={financialTrends} 
                loading={overviewLoading} 
              />
            </Stack>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default FinancialOverviewPage