import { useState, useEffect } from 'react'
import {
  Paper,
  Title,
  Text,
  Select,
  Group,
  Stack,
  Alert,
  Loader,
  Center,
  SimpleGrid,
  Card,
  Badge,
  Divider,
  Box
} from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { budgetService } from 'src/domains/budget-management/services/BudgetService'
import { BudgetStatus } from 'src/domains/budget-management/types'
import BudgetProgressCard from './BudgetProgressCard'
import BudgetEditModal from './BudgetEditModal'

function BudgetsList({ refreshTrigger }) {
  const [budgetProgress, setBudgetProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingBudget, setEditingBudget] = useState(null)
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month (1-12)
    year: new Date().getFullYear(),
    status: 'all'
  })

  const loadBudgetProgress = async () => {
    try {
      setLoading(true)
      const filterParams = {
        month: filters.month === 'all' ? null : filters.month,
        year: filters.year === 'all' ? null : filters.year,
        status: filters.status === 'all' ? null : filters.status
      }
      
      const { data, error } = await budgetService.getBudgetProgress(filterParams)
      
      if (error) {
        setError(error)
      } else {
        setBudgetProgress(data)
        setError('')
      }
    } catch (err) {
      setError(`Failed to load budget progress: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudgetProgress()
  }, [filters, refreshTrigger])

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDelete = async (progress) => {
    if (!window.confirm(`Are you sure you want to delete the ${progress.category} budget?`)) {
      return
    }

    try {
      const { success, error } = await budgetService.deleteBudget(progress.budget_id)
      
      if (error) {
        notifications.show({
          title: 'Delete Failed',
          message: error,
          color: 'red',
        })
      } else if (success) {
        setBudgetProgress(prev => prev.filter(p => p.budget_id !== progress.budget_id))
        notifications.show({
          title: 'Budget Deleted',
          message: `Deleted ${progress.category} budget`,
          color: 'red',
        })
      }
    } catch (err) {
      setError(`Failed to delete budget: ${err.message}`)
    }
  }

  const handleEdit = (progress) => {
    setEditingBudget({
      id: progress.budget_id,
      category: progress.category,
      monthly_limit: progress.monthly_limit,
      month: progress.month,
      year: progress.year
    })
  }

  const handleBudgetUpdated = () => {
    loadBudgetProgress()
    setEditingBudget(null)
  }

  // Generate month options
  const monthOptions = [
    { value: 'all', label: 'All Months' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString(),
      label: new Date(2000, i, 1).toLocaleString('en-GB', { month: 'long' })
    }))
  ]

  // Generate year options (current year and last/next year)
  const currentYear = new Date().getFullYear()
  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...Array.from({ length: 3 }, (_, i) => ({
      value: (currentYear - 1 + i).toString(),
      label: (currentYear - 1 + i).toString()
    }))
  ]

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: BudgetStatus.UNDER_BUDGET, label: 'Under Budget' },
    { value: BudgetStatus.NEAR_LIMIT, label: 'Near Limit' },
    { value: BudgetStatus.OVER_BUDGET, label: 'Over Budget' }
  ]

  // Calculate summary stats
  const totalBudgets = budgetProgress.length
  const overBudgetCount = budgetProgress.filter(p => p.status === BudgetStatus.OVER_BUDGET).length
  const nearLimitCount = budgetProgress.filter(p => p.status === BudgetStatus.NEAR_LIMIT).length
  const totalBudgetAmount = budgetProgress.reduce((sum, p) => sum + p.monthly_limit, 0)
  const totalSpentAmount = budgetProgress.reduce((sum, p) => sum + p.spent_amount, 0)

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  return (
    <Paper withBorder shadow="sm" radius="md" bg="navy.1" style={{ borderColor: '#3730a3' }}>
      <Box p="lg">
        <Title order={3} mb="lg">📈 Budget Overview</Title>
        
        {/* Filters */}
        <Group mb="lg">
          <Select
            label="Month"
            value={filters.month.toString()}
            onChange={(value) => handleFilterChange('month', value)}
            data={monthOptions}
            size="sm"
            style={{ flex: 1 }}
          />
          
          <Select
            label="Year"
            value={filters.year.toString()}
            onChange={(value) => handleFilterChange('year', value)}
            data={yearOptions}
            size="sm"
            style={{ flex: 1 }}
          />
          
          <Select
            label="Status"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            data={statusOptions}
            size="sm"
            style={{ flex: 1 }}
          />
        </Group>

        {/* Summary Cards */}
        {totalBudgets > 0 && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="lg">
              <Card withBorder radius="md" p="md" bg="navy.2" style={{ borderColor: '#3b82f6' }}>
                <Text size="xs" c="dimmed" tt="uppercase">Total Budgets</Text>
                <Text size="xl" fw={700} c="blue.7">{totalBudgets}</Text>
              </Card>
              
              <Card withBorder radius="md" p="md" bg="success.1" style={{ borderColor: '#047857' }}>
                <Text size="xs" c="dimmed" tt="uppercase">Total Budget</Text>
                <Text size="xl" fw={700} c="success.7">{formatAmount(totalBudgetAmount)}</Text>
              </Card>
              
              <Card withBorder radius="md" p="md" bg="navy.2" style={{ borderColor: '#3b82f6' }}>
                <Text size="xs" c="dimmed" tt="uppercase">Total Spent</Text>
                <Text size="xl" fw={700} c="financial.7">{formatAmount(totalSpentAmount)}</Text>
              </Card>
              
              <Card withBorder radius="md" p="md" bg="warning.1" style={{ borderColor: '#b45309' }}>
                <Text size="xs" c="dimmed" tt="uppercase">Alerts</Text>
                <Group gap="xs">
                  {overBudgetCount > 0 && (
                    <Badge color="expense" size="sm">{overBudgetCount} Over</Badge>
                  )}
                  {nearLimitCount > 0 && (
                    <Badge color="warning" size="sm">{nearLimitCount} Near</Badge>
                  )}
                  {overBudgetCount === 0 && nearLimitCount === 0 && (
                    <Text size="sm" c="success.7" fw={600}>All Good!</Text>
                  )}
                </Group>
              </Card>
            </SimpleGrid>
            <Divider mb="lg" />
          </>
        )}
      </Box>

      <Box px="lg" pb="lg">
        {error && (
          <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light" mb="lg">
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Loading budget progress...</Text>
            </Stack>
          </Center>
        ) : budgetProgress.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed">No budgets found</Text>
              <Text size="sm" c="dimmed" ta="center">
                Create your first budget to start tracking your spending limits
              </Text>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {budgetProgress.map(progress => (
              <BudgetProgressCard
                key={progress.budget_id}
                progress={progress}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </SimpleGrid>
        )}

        {editingBudget && (
          <BudgetEditModal
            budget={editingBudget}
            onClose={() => setEditingBudget(null)}
            onBudgetUpdated={handleBudgetUpdated}
          />
        )}
      </Box>
    </Paper>
  )
}

export default BudgetsList