import { useState } from 'react'
import {
  Modal,
  Title,
  TextInput,
  Button,
  Group,
  Stack,
  Alert,
  NumberInput
} from '@mantine/core'
import { IconInfoCircle, IconDeviceFloppy, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { budgetService } from 'src/domains/budget-management/services/BudgetService'

function BudgetEditModal({ budget, onClose, onBudgetUpdated }) {
  const [monthlyLimit, setMonthlyLimit] = useState(budget.monthly_limit)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!monthlyLimit || parseFloat(monthlyLimit) <= 0) {
      setError('Please enter a valid budget amount')
      return
    }

    setLoading(true)
    setError('')

    try {
      const updates = {
        monthly_limit: parseFloat(monthlyLimit)
      }

      const { data, error } = await budgetService.updateBudget(budget.id, updates)

      if (error) {
        setError(error)
        notifications.show({
          title: 'Update Failed',
          message: error,
          color: 'red',
        })
      } else {
        notifications.show({
          title: 'Budget Updated',
          message: `Updated ${budget.category} budget to £${parseFloat(monthlyLimit).toFixed(2)}`,
          color: 'green',
          icon: <IconDeviceFloppy size={16} />,
        })
        
        if (onBudgetUpdated) {
          onBudgetUpdated(data)
        }
      }
    } catch (err) {
      setError(`Failed to update budget: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (month) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-GB', { month: 'long' })
  }

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={
        <Title order={4}>
          Edit Budget - {budget.category}
        </Title>
      }
      centered
      size="sm"
      styles={{
        content: { backgroundColor: '#16213e', border: '1px solid #3730a3' },
        header: { backgroundColor: '#16213e', borderBottom: '1px solid #3730a3' }
      }}
    >
      {error && (
        <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light" mb="md">
          {error}
        </Alert>
      )}

      <Stack gap="md" mb="lg">
        <TextInput
          label="Category"
          value={budget.category}
          disabled
          variant="filled"
        />
        
        <Group grow>
          <TextInput
            label="Month"
            value={getMonthName(budget.month)}
            disabled
            variant="filled"
          />
          
          <TextInput
            label="Year"
            value={budget.year}
            disabled
            variant="filled"
          />
        </Group>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
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
            description="This is the maximum amount you want to spend in this category"
          />

          <Group justify="flex-end">
            <Button
              variant="light"
              color="gray"
              leftSection={<IconX size={16} />}
              onClick={onClose}
              size="md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={16} />}
              loading={loading}
              size="md"
              color="blue"
            >
              Update Budget
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default BudgetEditModal