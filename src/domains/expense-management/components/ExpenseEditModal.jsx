import { useState, useEffect } from 'react'
import {
  Modal,
  Title,
  NumberInput,
  Select,
  Textarea,
  Button,
  Stack,
  Alert,
  Group,
  TextInput,
  Divider,
  Text,
  Collapse
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { IconInfoCircle, IconCurrencyDollar, IconCalendar } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { expenseService } from '../services/ExpenseService'
import { categoryService } from 'src/domains/category-management/services/CategoryService'
import { TransactionTypes, TransactionTypeMetadata, ReimbursementStatus } from '../types'

function ExpenseEditModal({ expense, onClose, onExpenseUpdated }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date(),
    notes: '',
    transaction_type: TransactionTypes.PERSONAL,
    reimbursement_status: null,
    shared_with: '',
    shared_amount: '',
    reference_number: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: parseFloat(expense.amount),
        category: expense.category,
        date: new Date(expense.date),
        notes: expense.notes || '',
        transaction_type: expense.transaction_type || TransactionTypes.PERSONAL,
        reimbursement_status: expense.reimbursement_status || null,
        shared_with: expense.shared_with || '',
        shared_amount: expense.shared_amount || '',
        reference_number: expense.reference_number || ''
      })
    }
  }, [expense])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const updates = {
        amount: formData.amount,
        category: formData.category,
        date: formData.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        notes: formData.notes || null
      }

      const { data, error } = await expenseService.updateExpense(expense.id, updates)

      if (error) {
        setError(error)
        notifications.show({
          title: 'Update Failed',
          message: error,
          color: 'red',
        })
      } else {
        // Show success notification
        notifications.show({
          title: 'Expense Updated',
          message: `Updated ${formData.category} expense to $${parseFloat(formData.amount).toFixed(2)}`,
          color: 'green',
        })

        // Notify parent component
        if (onExpenseUpdated) {
          onExpenseUpdated(data)
        }
        
        onClose()
      }
    } catch (err) {
      setError(`Failed to update expense: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      opened={!!expense}
      onClose={onClose}
      title={
        <Title order={4}>✏️ Edit Expense</Title>
      }
      size="md"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        content: { backgroundColor: '#16213e', border: '1px solid #3730a3' },
        header: { backgroundColor: '#16213e', borderBottom: '1px solid #3730a3' }
      }}
    >
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
              data={categories}
              disabled={categoriesLoading}
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

          <Divider label="Transaction Type" labelPosition="left" />

          <Select
            label="Transaction Type"
            description="How should this expense be categorized?"
            value={formData.transaction_type}
            onChange={(value) => setFormData(prev => ({ 
              ...prev, 
              transaction_type: value,
              // Reset dependent fields when transaction type changes
              reimbursement_status: value === TransactionTypes.REIMBURSABLE ? (prev.reimbursement_status || ReimbursementStatus.PENDING) : null,
              shared_with: value === TransactionTypes.SHARED ? prev.shared_with : '',
              shared_amount: value === TransactionTypes.SHARED ? prev.shared_amount : '',
              reference_number: value === TransactionTypes.REIMBURSABLE ? prev.reference_number : ''
            }))}
            data={Object.values(TransactionTypes).map(type => ({
              value: type,
              label: TransactionTypeMetadata[type].label,
              description: TransactionTypeMetadata[type].description
            }))}
            required
            withAsterisk
          />

          {/* Reimbursable Fields */}
          <Collapse in={formData.transaction_type === TransactionTypes.REIMBURSABLE}>
            <Stack gap="sm" mt="md">
              <Text size="sm" fw={500} c="dimmed">
                Reimbursable Expense Details
              </Text>
              <Group grow>
                <Select
                  label="Reimbursement Status"
                  value={formData.reimbursement_status}
                  onChange={(value) => setFormData(prev => ({ ...prev, reimbursement_status: value }))}
                  data={Object.values(ReimbursementStatus).map(status => ({
                    value: status,
                    label: status.charAt(0).toUpperCase() + status.slice(1)
                  }))}
                />
                <TextInput
                  label="Reference Number"
                  placeholder="Receipt #, Request ID, etc."
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                />
              </Group>
            </Stack>
          </Collapse>

          {/* Shared Expense Fields */}
          <Collapse in={formData.transaction_type === TransactionTypes.SHARED}>
            <Stack gap="sm" mt="md">
              <Text size="sm" fw={500} c="dimmed">
                Shared Expense Details
              </Text>
              <Group grow>
                <TextInput
                  label="Shared With"
                  placeholder="Who is this expense shared with?"
                  value={formData.shared_with}
                  onChange={(e) => setFormData(prev => ({ ...prev, shared_with: e.target.value }))}
                />
                <NumberInput
                  label="Your Share ($)"
                  placeholder="Your portion of the expense"
                  value={formData.shared_amount}
                  onChange={(value) => setFormData(prev => ({ ...prev, shared_amount: value }))}
                  min={0}
                  step={0.01}
                  precision={2}
                  max={parseFloat(formData.amount) || undefined}
                />
              </Group>
              {formData.amount && formData.shared_amount && (
                <Text size="xs" c="dimmed">
                  Others' share: ${(parseFloat(formData.amount) - parseFloat(formData.shared_amount || 0)).toFixed(2)}
                </Text>
              )}
            </Stack>
          </Collapse>

          <Group justify="flex-end" gap="md" mt="md">
            <Button
              variant="default"
              onClick={onClose}
              size="md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              size="md"
              color="blue"
            >
              Update Expense
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default ExpenseEditModal