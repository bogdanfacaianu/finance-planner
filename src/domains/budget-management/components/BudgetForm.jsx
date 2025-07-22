import { useState } from 'react'
import {
  Card,
  Title,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Alert,
  NumberInput
} from '@mantine/core'
import { IconInfoCircle, IconPlus, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { budgetService } from 'src/domains/budget-management/services/BudgetService'
import { getCategoryOptions } from 'src/domains/expense-management/constants/categories'

function BudgetForm({ onBudgetAdded, onCancel }) {
  const [category, setCategory] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString())
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!category || !monthlyLimit || !month || !year) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const budgetData = {
        category,
        monthly_limit: parseFloat(monthlyLimit),
        month: parseInt(month),
        year: parseInt(year)
      }

      const { data, error } = await budgetService.createBudget(budgetData)

      if (error) {
        setError(error)
        notifications.show({
          title: 'Budget Creation Failed',
          message: error,
          color: 'red',
        })
      } else {
        notifications.show({
          title: 'Budget Created',
          message: `Created £${parseFloat(monthlyLimit).toFixed(2)} budget for ${category}`,
          color: 'green',
          icon: <IconPlus size={16} />,
        })
        
        // Reset form
        setCategory('')
        setMonthlyLimit('')
        setMonth((new Date().getMonth() + 1).toString())
        setYear(new Date().getFullYear().toString())
        
        if (onBudgetAdded) {
          onBudgetAdded(data)
        }
      }
    } catch (err) {
      setError(`Failed to create budget: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('en-GB', { month: 'long' })
  }))

  // Generate year options (current year and next 2 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 3 }, (_, i) => ({
    value: (currentYear + i).toString(),
    label: (currentYear + i).toString()
  }))

  return (
    <Card withBorder radius="lg" p="lg" bg="purple.1" style={{ borderColor: '#5b21b6' }}>
      <Title order={4} mb="md" c="purple.8">
        💰 Create New Budget
      </Title>

      {error && (
        <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light" mb="md">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Category"
            placeholder="Select expense category"
            data={getCategoryOptions()}
            value={category}
            onChange={setCategory}
            required
            searchable
            size="md"
          />

          <NumberInput
            label="Monthly Budget Limit"
            placeholder="0.00"
            value={monthlyLimit}
            onChange={setMonthlyLimit}
            required
            min={0.01}
            max={999999.99}
            decimalScale={2}
            fixedDecimalScale
            prefix="£"
            size="md"
          />

          <Group grow>
            <Select
              label="Month"
              data={monthOptions}
              value={month}
              onChange={setMonth}
              required
              size="md"
            />

            <Select
              label="Year"
              data={yearOptions}
              value={year}
              onChange={setYear}
              required
              size="md"
            />
          </Group>

          <Group justify="flex-end" mt="md">
            {onCancel && (
              <Button
                variant="light"
                color="gray"
                leftSection={<IconX size={16} />}
                onClick={onCancel}
                size="md"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              leftSection={<IconPlus size={16} />}
              loading={loading}
              size="md"
              variant="gradient"
              gradient={{ from: 'purple.6', to: 'purple.8' }}
            >
              Create Budget
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  )
}

export default BudgetForm