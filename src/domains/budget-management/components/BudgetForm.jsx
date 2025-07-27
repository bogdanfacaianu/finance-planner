import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Alert,
  NumberInput,
  Switch,
  Text,
  Divider,
  Badge
} from '@mantine/core'
import { IconInfoCircle, IconPlus, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { budgetService } from 'src/domains/budget-management/services/BudgetService'
import { categoryService } from 'src/domains/category-management/services/CategoryService'
import { 
  BudgetCategoryTypes, 
  BudgetRecurrenceTypes, 
  CategoryGroups,
  BudgetValidationEnhanced 
} from 'src/domains/budget-management/types'

function BudgetForm({ onBudgetAdded, onCancel }) {
  const [category, setCategory] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString())
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [categoryType, setCategoryType] = useState('flexible')
  const [recurrenceType, setRecurrenceType] = useState('recurring')
  const [workdaysPerMonth, setWorkdaysPerMonth] = useState('')
  const [categoryGroup, setCategoryGroup] = useState('')
  const [autoCalculate, setAutoCalculate] = useState(false)
  const [dailyAmount, setDailyAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true)
      try {
        const { data, error: categoriesError } = await categoryService.getCategories({ is_active: true })
        if (!categoriesError && data) {
          setCategories(data.map(cat => ({ value: cat.name, label: cat.name })))
        }
      } catch (err) {
        console.error('Error loading categories:', err)
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [])

  // Auto-calculate monthly limit based on daily amount and workdays
  useEffect(() => {
    if (autoCalculate && dailyAmount && workdaysPerMonth && categoryType === BudgetCategoryTypes.FLEXIBLE) {
      const calculatedAmount = BudgetValidationEnhanced.calculateAutoAmount(categoryType, workdaysPerMonth, dailyAmount)
      if (calculatedAmount) {
        setMonthlyLimit(calculatedAmount.toString())
      }
    }
  }, [autoCalculate, dailyAmount, workdaysPerMonth, categoryType])

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
        year: parseInt(year),
        category_type: categoryType,
        recurrence_type: recurrenceType,
        auto_calculate: autoCalculate
      }

      // Add optional fields
      if (workdaysPerMonth) {
        budgetData.workdays_per_month = parseInt(workdaysPerMonth)
      }
      
      if (categoryGroup) {
        budgetData.category_group = categoryGroup
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
        setCategoryType('flexible')
        setRecurrenceType('recurring')
        setWorkdaysPerMonth('')
        setCategoryGroup('')
        setAutoCalculate(false)
        setDailyAmount('')
        
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
            data={categories}
            disabled={categoriesLoading}
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

          <Divider 
            label={
              <Group gap="xs">
                <Text size="sm" fw={500} c="purple.7">Advanced Budget Settings</Text>
                <Badge size="xs" variant="light" color="purple">New</Badge>
              </Group>
            } 
            labelPosition="center" 
          />

          <Group grow>
            <Select
              label="Category Type"
              description="Fixed costs don't change monthly (rent), flexible costs vary (entertainment)"
              data={[
                { value: BudgetCategoryTypes.FIXED, label: 'Fixed Cost' },
                { value: BudgetCategoryTypes.FLEXIBLE, label: 'Flexible Cost' }
              ]}
              value={categoryType}
              onChange={setCategoryType}
              size="md"
            />

            <Select
              label="Recurrence"
              description="How often this budget applies"
              data={[
                { value: BudgetRecurrenceTypes.RECURRING, label: 'Monthly Recurring' },
                { value: BudgetRecurrenceTypes.ONE_OFF, label: 'One-time Only' }
              ]}
              value={recurrenceType}
              onChange={setRecurrenceType}
              size="md"
            />
          </Group>

          <Select
            label="Category Group (Optional)"
            description="Group related categories together for summarized display"
            data={[
              { value: '', label: 'No Group' },
              ...Object.values(CategoryGroups).map(group => ({ value: group, label: group }))
            ]}
            value={categoryGroup}
            onChange={setCategoryGroup}
            size="md"
            searchable
            clearable
          />

          {categoryType === BudgetCategoryTypes.FLEXIBLE && (
            <>
              <Switch
                label="Auto-calculate budget from daily spending"
                description="Automatically calculate monthly budget based on workdays and daily amount"
                checked={autoCalculate}
                onChange={(event) => setAutoCalculate(event.currentTarget.checked)}
                size="md"
              />

              {autoCalculate && (
                <Group grow>
                  <NumberInput
                    label="Workdays per Month"
                    description="Number of days you typically spend in this category"
                    placeholder="22"
                    value={workdaysPerMonth}
                    onChange={setWorkdaysPerMonth}
                    min={1}
                    max={31}
                    size="md"
                  />

                  <NumberInput
                    label="Daily Amount"
                    description="Average amount spent per day"
                    placeholder="0.00"
                    value={dailyAmount}
                    onChange={setDailyAmount}
                    min={0.01}
                    max={999.99}
                    decimalScale={2}
                    fixedDecimalScale
                    prefix="£"
                    size="md"
                  />
                </Group>
              )}
            </>
          )}

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