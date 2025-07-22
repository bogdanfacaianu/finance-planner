import { useState } from 'react'
import {
  Paper,
  Title,
  NumberInput,
  Select,
  Textarea,
  Button,
  Stack,
  Alert,
  Group
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { IconInfoCircle, IconCurrencyDollar, IconCalendar } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { getCategoryOptions } from 'src/domains/expense-management/constants/categories'

function ExpenseForm({ onExpenseAdded, onCancel }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date(),
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const expenseData = {
        ...formData,
        amount: formData.amount,
        date: formData.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      }
      
      const { data, error } = await expenseService.createExpense(expenseData)
      
      if (error) {
        setError(error)
      } else {
        // Reset form
        setFormData({
          amount: '',
          category: '',
          date: new Date(),
          notes: ''
        })

        // Show success notification
        notifications.show({
          title: 'Expense Added',
          message: `Added $${parseFloat(formData.amount).toFixed(2)} ${formData.category} expense`,
          color: 'green',
        })

        // Notify parent component
        if (onExpenseAdded) {
          onExpenseAdded(data)
        }
      }
    } catch (err) {
      setError(`Failed to add expense: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper withBorder shadow="sm" p="lg" radius="md" bg="navy.1" style={{ borderColor: '#3730a3' }}>
      <Title order={3} mb="lg">💸 Add New Expense</Title>
      
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <Group grow>
            <NumberInput
              label="Amount ($)"
              placeholder="0.00"
              leftSection={<IconCurrencyDollar size={16} />}
              value={formData.amount}
              onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
              min={0}
              step={0.01}
              precision={2}
              required
              withAsterisk
            />

            <Select
              label="Category"
              placeholder="Select a category"
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              data={getCategoryOptions()}
              required
              withAsterisk
              searchable
              clearable
            />
          </Group>

          <DateInput
            label="Date"
            placeholder="Select date"
            leftSection={<IconCalendar size={16} />}
            value={formData.date}
            onChange={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
            maxDate={new Date()}
            required
            styles={{
              input: { backgroundColor: '#1a1b2e', borderColor: '#3730a3', color: '#e2e8f0' },
              label: { color: '#e2e8f0' }
            }}
            popoverProps={{
              styles: {
                dropdown: { 
                  backgroundColor: '#16213e', 
                  border: '1px solid #3730a3',
                  '& .mantine-DatePicker-month': {
                    backgroundColor: '#16213e'
                  },
                  '& .mantine-DatePicker-day': {
                    backgroundColor: 'transparent',
                    color: '#e2e8f0',
                    '&:hover': {
                      backgroundColor: '#3730a3'
                    },
                    '&[data-selected]': {
                      backgroundColor: '#3b82f6',
                      color: '#ffffff'
                    },
                    '&[data-today]': {
                      backgroundColor: '#1e3a8a',
                      color: '#e2e8f0'
                    }
                  },
                  '& .mantine-DatePicker-monthCell, & .mantine-DatePicker-yearCell': {
                    color: '#e2e8f0',
                    '&:hover': {
                      backgroundColor: '#3730a3'
                    }
                  },
                  '& .mantine-DatePicker-calendarHeader': {
                    color: '#e2e8f0'
                  },
                  '& .mantine-DatePicker-weekdayCell': {
                    color: '#9ca3af'
                  }
                }
              }
            }}
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Add any additional details..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            autosize
            minRows={2}
            maxRows={4}
          />

          <Group justify="flex-end" gap="md">
            {onCancel && (
              <Button
                variant="default"
                onClick={onCancel}
                size="md"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              loading={loading}
              size="md"
              color="financial"
            >
              Add Expense
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

export default ExpenseForm