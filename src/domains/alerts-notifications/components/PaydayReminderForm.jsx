import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Group,
  Text,
  NumberInput,
  Select,
  Switch,
  Button,
  Card,
  Badge,
  Alert,
  TextInput,
  ActionIcon,
  Divider,
  Title
} from '@mantine/core'
import {
  IconPigMoney,
  IconCalendar,
  IconPlus,
  IconTrash,
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

function PaydayReminderForm({ opened, onClose, onSave, existingConfig = null }) {
  const [config, setConfig] = useState({
    payday_date: 1,
    reminder_days_before: 3,
    enabled: false,
    savings_targets: [
      { name: 'Flying Pot', target_amount: 200 },
      { name: 'Emergency Fund', target_amount: 500 }
    ],
    auto_allocate: false
  })
  
  const [newTarget, setNewTarget] = useState({ name: '', target_amount: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        payday_date: existingConfig.payday_date || 1,
        reminder_days_before: existingConfig.reminder_days_before || 3,
        enabled: existingConfig.enabled || false,
        savings_targets: existingConfig.savings_targets || [
          { name: 'Flying Pot', target_amount: 200 },
          { name: 'Emergency Fund', target_amount: 500 }
        ],
        auto_allocate: existingConfig.auto_allocate || false
      })
    }
  }, [existingConfig])

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      // Validate configuration
      if (config.payday_date < 1 || config.payday_date > 31) {
        setError('Payday date must be between 1 and 31')
        return
      }

      if (config.reminder_days_before < 0 || config.reminder_days_before > 30) {
        setError('Reminder days must be between 0 and 30')
        return
      }

      if (config.savings_targets.some(target => !target.name || target.target_amount <= 0)) {
        setError('All savings targets must have a name and positive amount')
        return
      }

      if (onSave) {
        await onSave(config)
      }

      notifications.show({
        title: 'Payday Reminders Configured',
        message: 'Your payday reminder settings have been saved',
        color: 'green',
        icon: <IconCheck size={16} />
      })

      onClose()
    } catch (err) {
      setError('Failed to save payday reminder configuration')
    } finally {
      setLoading(false)
    }
  }

  const addSavingsTarget = () => {
    if (!newTarget.name || !newTarget.target_amount) {
      setError('Please enter both name and amount for the savings target')
      return
    }

    setConfig(prev => ({
      ...prev,
      savings_targets: [
        ...prev.savings_targets,
        {
          name: newTarget.name,
          target_amount: parseFloat(newTarget.target_amount)
        }
      ]
    }))

    setNewTarget({ name: '', target_amount: '' })
    setError('')
  }

  const removeSavingsTarget = (index) => {
    setConfig(prev => ({
      ...prev,
      savings_targets: prev.savings_targets.filter((_, i) => i !== index)
    }))
  }

  const getDayName = (day) => {
    const date = new Date(2024, 0, day) // Use January 2024 as reference
    return date.toLocaleDateString('en-GB', { day: 'numeric' })
  }

  const getNextPayday = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Try current month first
    let payday = new Date(currentYear, currentMonth, config.payday_date)
    
    // If payday has passed this month, move to next month
    if (payday < today) {
      payday = new Date(currentYear, currentMonth + 1, config.payday_date)
    }
    
    return payday.toLocaleDateString('en-GB', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getReminderDate = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    let payday = new Date(currentYear, currentMonth, config.payday_date)
    if (payday < today) {
      payday = new Date(currentYear, currentMonth + 1, config.payday_date)
    }
    
    const reminderDate = new Date(payday)
    reminderDate.setDate(reminderDate.getDate() - config.reminder_days_before)
    
    return reminderDate.toLocaleDateString('en-GB', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTotalSavingsTarget = () => {
    return config.savings_targets.reduce((sum, target) => sum + target.target_amount, 0)
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconPigMoney size={20} />
          <Text fw={500}>Payday Reminder Settings</Text>
        </Group>
      }
      size="lg"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {error}
          </Alert>
        )}

        {/* Enable/Disable Toggle */}
        <Card withBorder p="md" bg="blue.0">
          <Group justify="space-between">
            <div>
              <Text fw={500}>Enable Payday Reminders</Text>
              <Text size="sm" c="dimmed">
                Get reminded to allocate funds to your savings goals
              </Text>
            </div>
            <Switch
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.currentTarget.checked }))}
              size="lg"
            />
          </Group>
        </Card>

        {config.enabled && (
          <>
            {/* Payday Configuration */}
            <Stack gap="sm">
              <Title order={5}>Payday Settings</Title>
              
              <Group grow>
                <NumberInput
                  label="Payday Date"
                  description="Day of the month you get paid"
                  value={config.payday_date}
                  onChange={(value) => setConfig(prev => ({ ...prev, payday_date: value }))}
                  min={1}
                  max={31}
                  suffix={config.payday_date === 1 ? 'st' : 
                         config.payday_date === 2 ? 'nd' : 
                         config.payday_date === 3 ? 'rd' : 'th'}
                />

                <NumberInput
                  label="Reminder Days Before"
                  description="Days before payday to remind you"
                  value={config.reminder_days_before}
                  onChange={(value) => setConfig(prev => ({ ...prev, reminder_days_before: value }))}
                  min={0}
                  max={30}
                />
              </Group>

              {/* Preview */}
              <Card withBorder p="sm" bg="gray.0">
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Preview</Text>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Next Payday:</Text>
                    <Text size="sm" fw={500}>{getNextPayday()}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Reminder Date:</Text>
                    <Text size="sm" fw={500}>{getReminderDate()}</Text>
                  </Group>
                </Stack>
              </Card>
            </Stack>

            <Divider />

            {/* Savings Targets */}
            <Stack gap="sm">
              <Group justify="space-between">
                <Title order={5}>Savings Targets</Title>
                <Badge variant="light" color="green">
                  £{getTotalSavingsTarget().toFixed(2)} total
                </Badge>
              </Group>

              {/* Existing Targets */}
              <Stack gap="xs">
                {config.savings_targets.map((target, index) => (
                  <Card key={index} withBorder p="sm">
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{target.name}</Text>
                        <Text size="sm" c="dimmed">Target: £{target.target_amount.toFixed(2)}</Text>
                      </div>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => removeSavingsTarget(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>

              {/* Add New Target */}
              <Card withBorder p="sm" bg="green.0">
                <Stack gap="sm">
                  <Text size="sm" fw={500}>Add New Savings Target</Text>
                  <Group grow>
                    <TextInput
                      placeholder="e.g., Holiday Fund, Car Repairs"
                      value={newTarget.name}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, name: e.currentTarget.value }))}
                    />
                    <NumberInput
                      placeholder="Target amount"
                      value={newTarget.target_amount}
                      onChange={(value) => setNewTarget(prev => ({ ...prev, target_amount: value }))}
                      min={0}
                      step={10}
                      prefix="£"
                    />
                    <ActionIcon
                      variant="filled"
                      color="green"
                      onClick={addSavingsTarget}
                    >
                      <IconPlus size={16} />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Card>
            </Stack>

            <Divider />

            {/* Auto-allocation Option */}
            <Card withBorder p="md" bg="orange.0">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Auto-allocation (Future Feature)</Text>
                  <Text size="sm" c="dimmed">
                    Automatically suggest budget allocations based on your savings targets
                  </Text>
                </div>
                <Switch
                  checked={config.auto_allocate}
                  onChange={(e) => setConfig(prev => ({ ...prev, auto_allocate: e.currentTarget.checked }))}
                  disabled={true}
                />
              </Group>
            </Card>

            {/* Summary */}
            <Alert icon={<IconCalendar size={16} />} color="blue" variant="light">
              <Text size="sm">
                <strong>Summary:</strong> You'll be reminded on {getReminderDate()} to allocate 
                £{getTotalSavingsTarget().toFixed(2)} across {config.savings_targets.length} savings target
                {config.savings_targets.length !== 1 ? 's' : ''} before your payday on {getNextPayday()}.
              </Text>
            </Alert>
          </>
        )}

        {/* Actions */}
        <Group justify="space-between">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={!config.enabled}
          >
            Save Payday Settings
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default PaydayReminderForm