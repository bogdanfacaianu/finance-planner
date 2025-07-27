import { useState, useEffect } from 'react'
import {
  Paper,
  Title,
  Text,
  Select,
  Group,
  Stack,
  Alert,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Card,
  Divider,
  Box
} from '@mantine/core'
import { IconInfoCircle, IconEdit, IconTrash, IconCurrencyPound, IconUser, IconRefresh, IconUsers } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { expenseService } from '../services/ExpenseService'
import { categoryService } from 'src/domains/category-management/services/CategoryService'
import { TransactionTypes, TransactionTypeMetadata, ReimbursementStatus } from '../types'

function ExpensesList({ refreshTrigger, onEdit }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month (1-12)
    year: new Date().getFullYear(),
    category: 'all',
    transaction_type: 'all',
    reimbursement_status: 'all'
  })

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const filterParams = {
        month: filters.month === 'all' ? null : filters.month,
        year: filters.year === 'all' ? null : filters.year,
        category: filters.category === 'all' ? null : filters.category,
        transaction_type: filters.transaction_type === 'all' ? null : filters.transaction_type,
        reimbursement_status: filters.reimbursement_status === 'all' ? null : filters.reimbursement_status
      }
      
      const { data, error } = await expenseService.getExpenses(filterParams)
      
      if (error) {
        setError(error)
      } else {
        setExpenses(data)
        setError('')
      }
    } catch (err) {
      setError(`Failed to load expenses: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [filters, refreshTrigger])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error: categoriesError } = await categoryService.getCategories({ is_active: true })
        if (!categoriesError && data) {
          setCategories(data)
        }
      } catch (err) {
        console.error('Error loading categories:', err)
      }
    }

    loadCategories()
  }, [])

  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName)
    return category?.color || 'gray'
  }

  const getCategoryOptions = () => {
    return [
      { value: 'all', label: 'All Categories' },
      ...categories.map(cat => ({ value: cat.name, label: cat.name }))
    ]
  }

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDelete = async (id, amount, category) => {
    try {
      const { success, error } = await expenseService.deleteExpense(id)
      
      if (error) {
        setError(error)
        notifications.show({
          title: 'Delete Failed',
          message: error,
          color: 'red',
        })
      } else if (success) {
        setExpenses(prev => prev.filter(expense => expense.id !== id))
        notifications.show({
          title: 'Expense Deleted',
          message: `Deleted $${parseFloat(amount).toFixed(2)} ${category} expense`,
          color: 'red',
          icon: <IconTrash size={16} />,
        })
      }
    } catch (err) {
      setError(`Failed to delete expense: ${err.message}`)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const getTotalAmount = () => {
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0)
  }

  // Generate month options
  const monthOptions = [
    { value: 'all', label: 'All Months' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString(),
      label: new Date(2000, i, 1).toLocaleString('en-GB', { month: 'long' })
    }))
  ]

  // Generate year options (current year and last 2 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...Array.from({ length: 3 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString()
    }))
  ]

  // Category options for filter
  const categoryFilterOptions = getCategoryOptions()

  return (
    <Paper withBorder shadow="sm" radius="md" bg="navy.1" style={{ borderColor: '#3730a3' }}>
      <Box p="lg">
        <Title order={3} mb="lg">📊 Your Expenses</Title>
        
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
            label="Category"
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            data={categoryFilterOptions}
            size="sm"
            style={{ flex: 1 }}
            searchable
          />
          
          <Select
            label="Transaction Type"
            value={filters.transaction_type}
            onChange={(value) => handleFilterChange('transaction_type', value)}
            data={[
              { value: 'all', label: 'All Types' },
              ...Object.values(TransactionTypes).map(type => ({
                value: type,
                label: TransactionTypeMetadata[type].label
              }))
            ]}
            size="sm"
            style={{ flex: 1 }}
          />
          
          {filters.transaction_type === TransactionTypes.REIMBURSABLE && (
            <Select
              label="Reimbursement Status"
              value={filters.reimbursement_status}
              onChange={(value) => handleFilterChange('reimbursement_status', value)}
              data={[
                { value: 'all', label: 'All Statuses' },
                ...Object.values(ReimbursementStatus).map(status => ({
                  value: status,
                  label: status.charAt(0).toUpperCase() + status.slice(1)
                }))
              ]}
              size="sm"
              style={{ flex: 1 }}
            />
          )}
        </Group>

        {/* Summary */}
        <Card withBorder radius="md" mb="lg" bg="navy.2" style={{ borderColor: '#3b82f6' }}>
          <Group justify="space-between" align="center">
            <div>
              <Text size="sm" c="dimmed">
                Total Expenses ({expenses.length} items)
              </Text>
            </div>
            <div>
              <Group gap="xs" align="center">
                <Text size="xl" fw={700} c="navy.7">
                  {formatAmount(getTotalAmount())}
                </Text>
              </Group>
            </div>
          </Group>
        </Card>

        <Divider mb="lg" />
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
              <Text c="dimmed">Loading expenses...</Text>
            </Stack>
          </Center>
        ) : expenses.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed">No expenses found</Text>
              <Text size="sm" c="dimmed" ta="center">
                Add your first expense to get started tracking your spending
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="md">
            {expenses.map(expense => (
              <Card key={expense.id} withBorder padding="md" radius="md" bg="navy.0" style={{ borderColor: '#1e3a8a' }}>
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="md" align="center">
                      <Text size="lg" fw={600} c="navy.8">
                        {formatAmount(expense.amount)}
                      </Text>
                      <Badge 
                        color={getCategoryColor(expense.category)} 
                        variant="light"
                        size="sm"
                      >
                        {expense.category}
                      </Badge>
                      <Badge 
                        color={TransactionTypeMetadata[expense.transaction_type || TransactionTypes.PERSONAL]?.color || 'blue'}
                        variant="light"
                        size="sm"
                        leftSection={
                          expense.transaction_type === TransactionTypes.REIMBURSABLE ? <IconRefresh size={12} /> :
                          expense.transaction_type === TransactionTypes.SHARED ? <IconUsers size={12} /> :
                          <IconUser size={12} />
                        }
                      >
                        {TransactionTypeMetadata[expense.transaction_type || TransactionTypes.PERSONAL]?.label || 'Personal'}
                      </Badge>
                      <Text size="sm" c="dimmed">
                        {formatDate(expense.date)}
                      </Text>
                    </Group>
                    
                    {/* Additional info for non-personal transactions */}
                    {(expense.transaction_type === TransactionTypes.REIMBURSABLE || expense.transaction_type === TransactionTypes.SHARED) && (
                      <Group gap="md" mt="xs">
                        {expense.transaction_type === TransactionTypes.REIMBURSABLE && (
                          <>
                            {expense.reimbursement_status && (
                              <Badge
                                color={expense.reimbursement_status === 'paid' ? 'green' : 
                                      expense.reimbursement_status === 'rejected' ? 'red' : 'yellow'}
                                variant="outline"
                                size="xs"
                              >
                                Status: {expense.reimbursement_status}
                              </Badge>
                            )}
                            {expense.reference_number && (
                              <Text size="xs" c="dimmed">
                                Ref: {expense.reference_number}
                              </Text>
                            )}
                          </>
                        )}
                        {expense.transaction_type === TransactionTypes.SHARED && (
                          <>
                            {expense.shared_with && (
                              <Text size="xs" c="dimmed">
                                Shared with: {expense.shared_with}
                              </Text>
                            )}
                            {expense.shared_amount && (
                              <Text size="xs" c="dimmed">
                                Your share: {formatAmount(expense.shared_amount)}
                              </Text>
                            )}
                          </>
                        )}
                      </Group>
                    )}
                    {expense.notes && (
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {expense.notes}
                      </Text>
                    )}
                  </Stack>
                  
                  <Group gap="xs">
                    {onEdit && (
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="sm"
                        onClick={() => onEdit(expense)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this expense?')) {
                          handleDelete(expense.id, expense.amount, expense.category)
                        }
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}

export default ExpensesList