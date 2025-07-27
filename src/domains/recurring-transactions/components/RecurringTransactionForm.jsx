import { useState, useEffect } from 'react'
import {
  Modal,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Switch,
  Button,
  Group,
  Stack,
  Alert,
  Card,
  Text,
  Title,
  Badge,
  MultiSelect,
  Grid,
  Divider,
  ActionIcon
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { 
  IconCalendarRepeat,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconX,
  IconTemplate
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { recurringTransactionService } from 'src/domains/recurring-transactions/services/RecurringTransactionService'
import { categoryService } from 'src/domains/category-management/services/CategoryService'
import { 
  RecurringFrequency,
  RecurringTemplates,
  WeekdayPatterns,
  MonthlyPatterns
} from 'src/domains/recurring-transactions/types'

function RecurringTransactionForm({ opened, onClose, onRecurringAdded, editingRecurring = null }) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [frequency, setFrequency] = useState(RecurringFrequency.WEEKLY)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(null)
  const [hasEndDate, setHasEndDate] = useState(false)
  const [maxGenerations, setMaxGenerations] = useState('')

  // Frequency-specific configuration
  const [dailyInterval, setDailyInterval] = useState(1)
  const [weeklyInterval, setWeeklyInterval] = useState(1)
  const [weeklyDays, setWeeklyDays] = useState(['1', '2', '3', '4', '5']) // Weekdays
  const [monthlyInterval, setMonthlyInterval] = useState(1)
  const [monthlyDay, setMonthlyDay] = useState(1)
  const [yearlyMonth, setYearlyMonth] = useState(1)
  const [yearlyDay, setYearlyDay] = useState(1)
  const [customIntervalDays, setCustomIntervalDays] = useState(7)

  const isEditing = !!editingRecurring

  useEffect(() => {
    if (opened) {
      loadCategories()
      if (editingRecurring) {
        populateFormForEditing()
      } else {
        resetForm()
      }
    }
  }, [opened, editingRecurring])

  const loadCategories = async () => {
    const { data, error } = await categoryService.getCategories({ is_active: true })
    if (data) {
      const categoryOptions = data.map(cat => ({ value: cat.name, label: cat.name }))
      setCategories(categoryOptions)
    }
  }

  const populateFormForEditing = () => {
    if (!editingRecurring) return
    
    setName(editingRecurring.name)
    setDescription(editingRecurring.description || '')
    setAmount(editingRecurring.amount)
    setCategory(editingRecurring.category)
    setFrequency(editingRecurring.frequency)
    setStartDate(new Date(editingRecurring.start_date))
    setEndDate(editingRecurring.end_date ? new Date(editingRecurring.end_date) : null)
    setHasEndDate(!!editingRecurring.end_date)
    setMaxGenerations(editingRecurring.max_generations || '')

    const config = editingRecurring.frequency_config
    if (config) {
      setDailyInterval(config.interval || 1)
      setWeeklyInterval(config.interval || 1)
      setWeeklyDays(config.days ? config.days.map(d => d.toString()) : ['1', '2', '3', '4', '5'])
      setMonthlyInterval(config.interval || 1)
      setMonthlyDay(config.day_of_month || 1)
      setYearlyMonth(config.month || 1)
      setYearlyDay(config.day || 1)
      setCustomIntervalDays(config.interval_days || 7)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setAmount('')
    setCategory('')
    setFrequency(RecurringFrequency.WEEKLY)
    setStartDate(new Date())
    setEndDate(null)
    setHasEndDate(false)
    setMaxGenerations('')
    setError('')
    
    // Reset frequency configs to defaults
    setDailyInterval(1)
    setWeeklyInterval(1)
    setWeeklyDays(['1', '2', '3', '4', '5'])
    setMonthlyInterval(1)
    setMonthlyDay(1)
    setYearlyMonth(1)
    setYearlyDay(1)
    setCustomIntervalDays(7)
  }

  const handleTemplateSelect = (template) => {
    setName(template.name)
    setDescription(template.description)
    setCategory(template.category)
    setFrequency(template.frequency)
    setAmount(template.suggested_amount)
    
    if (template.frequency_config) {
      const config = template.frequency_config
      if (config.interval) setWeeklyInterval(config.interval)
      if (config.days) setWeeklyDays(config.days.map(d => d.toString()))
      if (config.day_of_month) setMonthlyDay(config.day_of_month)
    }
  }

  const buildFrequencyConfig = () => {
    switch (frequency) {
      case RecurringFrequency.DAILY:
        return { interval: dailyInterval }
      
      case RecurringFrequency.WEEKLY:
        return {
          interval: weeklyInterval,
          days: weeklyDays.map(d => parseInt(d)),
          pattern: weeklyDays.length === 5 && 
                   weeklyDays.every(d => ['1', '2', '3', '4', '5'].includes(d)) 
                   ? WeekdayPatterns.WEEKDAYS : WeekdayPatterns.CUSTOM
        }
      
      case RecurringFrequency.MONTHLY:
        return {
          interval: monthlyInterval,
          day_of_month: monthlyDay,
          pattern: MonthlyPatterns.SAME_DATE
        }
      
      case RecurringFrequency.YEARLY:
        return {
          interval: 1,
          month: yearlyMonth,
          day: yearlyDay
        }
      
      case RecurringFrequency.CUSTOM:
        return {
          type: 'interval',
          interval_days: customIntervalDays
        }
      
      default:
        return {}
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const recurringData = {
        name,
        description,
        amount: parseFloat(amount),
        category,
        frequency,
        frequency_config: buildFrequencyConfig(),
        start_date: startDate.toISOString().split('T')[0],
        end_date: hasEndDate && endDate ? endDate.toISOString().split('T')[0] : null,
        max_generations: maxGenerations ? parseInt(maxGenerations) : null
      }

      let result
      if (isEditing) {
        result = await recurringTransactionService.updateRecurringTransaction(editingRecurring.id, recurringData)
      } else {
        result = await recurringTransactionService.createRecurringTransaction(recurringData)
      }

      if (result.error) {
        setError(result.error)
        return
      }

      notifications.show({
        title: isEditing ? 'Recurring Transaction Updated' : 'Recurring Transaction Created',
        message: `${name} has been ${isEditing ? 'updated' : 'created'} successfully`,
        color: 'green',
        icon: <IconCheck size={16} />
      })

      if (onRecurringAdded) {
        onRecurringAdded(result.data)
      }

      handleClose()

    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const weekdayOptions = [
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
    { value: '0', label: 'Sunday' }
  ]

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('en-GB', { month: 'long' })
  }))

  const frequencyDescription = () => {
    switch (frequency) {
      case RecurringFrequency.DAILY:
        return `Every ${dailyInterval} day${dailyInterval > 1 ? 's' : ''}`
      case RecurringFrequency.WEEKLY:
        const dayNames = weeklyDays.map(d => weekdayOptions.find(opt => opt.value === d)?.label).join(', ')
        return `Every ${weeklyInterval} week${weeklyInterval > 1 ? 's' : ''} on ${dayNames}`
      case RecurringFrequency.MONTHLY:
        return `Every ${monthlyInterval} month${monthlyInterval > 1 ? 's' : ''} on day ${monthlyDay}`
      case RecurringFrequency.YEARLY:
        const monthName = monthOptions.find(m => m.value === yearlyMonth.toString())?.label
        return `Every year on ${monthName} ${yearlyDay}`
      case RecurringFrequency.CUSTOM:
        return `Every ${customIntervalDays} days`
      default:
        return ''
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group>
          <IconCalendarRepeat size={20} />
          <Text fw={500}>
            {isEditing ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
          </Text>
        </Group>
      }
      size="lg"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        {/* Templates Section (only for new transactions) */}
        {!isEditing && (
          <Card withBorder p="md" bg="blue.0">
            <Group mb="xs">
              <IconTemplate size={16} />
              <Text size="sm" fw={500}>Quick Templates</Text>
            </Group>
            <Grid>
              {RecurringTemplates.slice(0, 4).map((template, index) => (
                <Grid.Col key={index} span={6}>
                  <Button
                    variant="light"
                    size="xs"
                    fullWidth
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {template.name}
                  </Button>
                </Grid.Col>
              ))}
            </Grid>
          </Card>
        )}

        {/* Basic Information */}
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="e.g., Daily Coffee, Monthly Gym"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            rows={2}
          />

          <Group grow>
            <NumberInput
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChange={setAmount}
              min={0}
              step={0.01}
              prefix="£"
              required
            />

            <Select
              label="Category"
              placeholder="Select category"
              value={category}
              onChange={setCategory}
              data={categories}
              required
              searchable
            />
          </Group>
        </Stack>

        <Divider />

        {/* Frequency Configuration */}
        <Stack gap="md">
          <Title order={5}>Frequency Settings</Title>

          <Select
            label="Frequency"
            value={frequency}
            onChange={setFrequency}
            data={[
              { value: RecurringFrequency.DAILY, label: 'Daily' },
              { value: RecurringFrequency.WEEKLY, label: 'Weekly' },
              { value: RecurringFrequency.MONTHLY, label: 'Monthly' },
              { value: RecurringFrequency.YEARLY, label: 'Yearly' },
              { value: RecurringFrequency.CUSTOM, label: 'Custom Interval' }
            ]}
            required
          />

          {/* Frequency-specific controls */}
          {frequency === RecurringFrequency.DAILY && (
            <NumberInput
              label="Repeat every N days"
              value={dailyInterval}
              onChange={setDailyInterval}
              min={1}
              max={365}
            />
          )}

          {frequency === RecurringFrequency.WEEKLY && (
            <Stack gap="sm">
              <NumberInput
                label="Repeat every N weeks"
                value={weeklyInterval}
                onChange={setWeeklyInterval}
                min={1}
                max={52}
              />
              <MultiSelect
                label="Days of the week"
                value={weeklyDays}
                onChange={setWeeklyDays}
                data={weekdayOptions}
                required
              />
            </Stack>
          )}

          {frequency === RecurringFrequency.MONTHLY && (
            <Group grow>
              <NumberInput
                label="Repeat every N months"
                value={monthlyInterval}
                onChange={setMonthlyInterval}
                min={1}
                max={12}
              />
              <NumberInput
                label="Day of month"
                value={monthlyDay}
                onChange={setMonthlyDay}
                min={1}
                max={31}
              />
            </Group>
          )}

          {frequency === RecurringFrequency.YEARLY && (
            <Group grow>
              <Select
                label="Month"
                value={yearlyMonth.toString()}
                onChange={(value) => setYearlyMonth(parseInt(value))}
                data={monthOptions}
              />
              <NumberInput
                label="Day"
                value={yearlyDay}
                onChange={setYearlyDay}
                min={1}
                max={31}
              />
            </Group>
          )}

          {frequency === RecurringFrequency.CUSTOM && (
            <NumberInput
              label="Repeat every N days"
              value={customIntervalDays}
              onChange={setCustomIntervalDays}
              min={1}
              max={365}
            />
          )}

          {/* Frequency Preview */}
          <Alert color="blue" icon={<IconClock size={16} />}>
            <Text size="sm">
              <strong>Preview:</strong> {frequencyDescription()}
            </Text>
          </Alert>
        </Stack>

        <Divider />

        {/* Date Range and Limits */}
        <Stack gap="md">
          <Title order={5}>Date Range & Limits</Title>

          <Group grow>
            <DateInput
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              required
            />

            <NumberInput
              label="Max Generations (optional)"
              placeholder="Unlimited"
              value={maxGenerations}
              onChange={setMaxGenerations}
              min={1}
            />
          </Group>

          <Stack gap="xs">
            <Switch
              label="Set end date"
              checked={hasEndDate}
              onChange={(e) => setHasEndDate(e.currentTarget.checked)}
            />
            
            {hasEndDate && (
              <DateInput
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                minDate={startDate}
              />
            )}
          </Stack>
        </Stack>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="light" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!name || !amount || !category}
          >
            {isEditing ? 'Update' : 'Create'} Recurring Transaction
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default RecurringTransactionForm