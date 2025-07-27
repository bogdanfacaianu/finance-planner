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
  Progress,
  NumberFormatter,
  SimpleGrid,
  Title,
  Divider,
  Table,
  Checkbox,
  MultiSelect,
  Tooltip,
  ActionIcon
} from '@mantine/core'
import {
  IconRefresh,
  IconCalendarMonth,
  IconPigMoney,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconHistory,
  IconEye
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { budgetResetService } from 'src/domains/budget-management/services/BudgetResetService'

function BudgetResetModal({ opened, onClose, onResetComplete }) {
  const [settings, setSettings] = useState(null)
  const [resetOptions, setResetOptions] = useState({
    source_month: new Date().getMonth() + 1,
    source_year: new Date().getFullYear(),
    target_month: new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2,
    target_year: new Date().getMonth() + 2 > 12 ? new Date().getFullYear() + 1 : new Date().getFullYear(),
    carry_over_categories: [],
    max_carry_over_percentage: 50
  })
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [availableCategories, setAvailableCategories] = useState([])

  useEffect(() => {
    if (opened) {
      loadSettings()
    }
  }, [opened])

  const loadSettings = async () => {
    try {
      const { data, error } = await budgetResetService.getBudgetResetSettings()
      if (error) {
        setError(error)
        return
      }

      setSettings(data)
      if (data.carry_over_categories) {
        setResetOptions(prev => ({
          ...prev,
          carry_over_categories: data.carry_over_categories,
          max_carry_over_percentage: data.max_carry_over_percentage || 50
        }))
      }

      // Load available categories (you'd get this from a budget service)
      const commonCategories = [
        'Food & Drink', 'Groceries', 'Transport', 'Entertainment', 
        'Shopping', 'Health & Fitness', 'Utilities', 'Coffee', 
        'Dining Out', 'Subscriptions', 'Travel', 'Other'
      ]
      setAvailableCategories(commonCategories.map(cat => ({ value: cat, label: cat })))

    } catch (err) {
      setError('Failed to load budget reset settings')
    }
  }

  const handlePreview = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await budgetResetService.previewBudgetReset(resetOptions)
      
      if (error) {
        setError(error)
        return
      }

      setPreview(data)
      setShowPreview(true)

    } catch (err) {
      setError('Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteReset = async () => {
    if (!preview) {
      setError('Please generate a preview first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await budgetResetService.executeBudgetReset(resetOptions)
      
      if (error) {
        setError(error)
        return
      }

      notifications.show({
        title: 'Budget Reset Complete',
        message: `Successfully reset ${data.copied_budgets} budget categories with £${data.carried_over_amount.toFixed(2)} carried over`,
        color: 'green',
        icon: <IconCheck size={16} />
      })

      if (onResetComplete) {
        onResetComplete(data)
      }

      onClose()

    } catch (err) {
      setError('Failed to execute budget reset')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      const updatedSettings = {
        ...settings,
        carry_over_categories: resetOptions.carry_over_categories,
        max_carry_over_percentage: resetOptions.max_carry_over_percentage
      }

      const { error } = await budgetResetService.saveBudgetResetSettings(updatedSettings)
      
      if (error) {
        setError(error)
        return
      }

      notifications.show({
        title: 'Settings Saved',
        message: 'Budget reset preferences have been updated',
        color: 'green'
      })

    } catch (err) {
      setError('Failed to save settings')
    }
  }

  const monthOptions = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ]

  const currentYear = new Date().getFullYear()
  const yearOptions = [
    { value: currentYear - 1, label: currentYear - 1 },
    { value: currentYear, label: currentYear },
    { value: currentYear + 1, label: currentYear + 1 }
  ]

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconRefresh size={20} />
          <Text fw={500}>Monthly Budget Reset</Text>
        </Group>
      }
      size="xl"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red">
            {error}
          </Alert>
        )}

        {/* Reset Configuration */}
        <Card withBorder p="md" bg="blue.0">
          <Stack gap="md">
            <Group>
              <IconCalendarMonth size={20} color="blue" />
              <Title order={4}>Reset Configuration</Title>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <div>
                <Text size="sm" fw={500} mb="xs">Source Period (copy from)</Text>
                <Group grow>
                  <Select
                    label="Month"
                    value={resetOptions.source_month}
                    onChange={(value) => setResetOptions(prev => ({ ...prev, source_month: parseInt(value) }))}
                    data={monthOptions}
                    size="sm"
                  />
                  <Select
                    label="Year"
                    value={resetOptions.source_year}
                    onChange={(value) => setResetOptions(prev => ({ ...prev, source_year: parseInt(value) }))}
                    data={yearOptions}
                    size="sm"
                  />
                </Group>
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Target Period (copy to)</Text>
                <Group grow>
                  <Select
                    label="Month"
                    value={resetOptions.target_month}
                    onChange={(value) => setResetOptions(prev => ({ ...prev, target_month: parseInt(value) }))}
                    data={monthOptions}
                    size="sm"
                  />
                  <Select
                    label="Year"
                    value={resetOptions.target_year}
                    onChange={(value) => setResetOptions(prev => ({ ...prev, target_year: parseInt(value) }))}
                    data={yearOptions}
                    size="sm"
                  />
                </Group>
              </div>
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Carry-over Settings */}
        <Card withBorder p="md" bg="green.0">
          <Stack gap="md">
            <Group>
              <IconPigMoney size={20} color="green" />
              <Title order={4}>Carry-over Settings</Title>
              <Tooltip label="Unspent money from selected categories will be added to next month's budget">
                <ActionIcon size="sm" variant="light">
                  <IconInfoCircle size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <MultiSelect
              label="Categories to carry over unspent funds"
              placeholder="Select categories that can carry over unspent money"
              value={resetOptions.carry_over_categories}
              onChange={(value) => setResetOptions(prev => ({ ...prev, carry_over_categories: value }))}
              data={availableCategories}
              searchable
              clearable
            />

            <NumberInput
              label="Maximum carry-over percentage"
              description="Maximum percentage of budget that can be carried over"
              value={resetOptions.max_carry_over_percentage}
              onChange={(value) => setResetOptions(prev => ({ ...prev, max_carry_over_percentage: value }))}
              min={0}
              max={100}
              step={5}
              suffix="%"
            />
          </Stack>
        </Card>

        {/* Preview Section */}
        {showPreview && preview && (
          <Card withBorder p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Group>
                  <IconEye size={20} color="purple" />
                  <Title order={4}>Reset Preview</Title>
                </Group>
                <Badge color="purple" variant="light">
                  £{preview.total_carry_over_amount.toFixed(2)} total carry-over
                </Badge>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <div>
                  <Text size="sm" fw={500} mb="xs">Summary</Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">Total categories:</Text>
                      <Text size="sm" fw={500}>{preview.total_categories}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">With carry-over:</Text>
                      <Text size="sm" fw={500} c="green">{preview.categories_with_carryover.length}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Without carry-over:</Text>
                      <Text size="sm" fw={500} c="gray">{preview.categories_without_carryover.length}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Total carry-over amount:</Text>
                      <Text size="sm" fw={500} c="green">
                        <NumberFormatter value={preview.total_carry_over_amount} prefix="£" />
                      </Text>
                    </Group>
                  </Stack>
                </div>

                <div>
                  <Text size="sm" fw={500} mb="xs">Carry-over Details</Text>
                  <Stack gap="xs" mah={150} style={{ overflow: 'auto' }}>
                    {preview.categories_with_carryover.map((category, index) => (
                      <Group key={index} justify="space-between">
                        <Text size="xs">{category.category}</Text>
                        <Text size="xs" c="green" fw={500}>
                          +<NumberFormatter value={category.carried_over_amount} prefix="£" />
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </div>
              </SimpleGrid>

              {preview.categories_with_carryover.length > 0 && (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Budgets will be increased by the unspent amounts from the previous month, 
                    up to the maximum carry-over percentage limit.
                  </Text>
                </Alert>
              )}
            </Stack>
          </Card>
        )}

        {/* Actions */}
        <Group justify="space-between">
          <Group>
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="light" onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </Group>
          <Group>
            <Button
              leftSection={<IconEye size={16} />}
              onClick={handlePreview}
              loading={loading && !showPreview}
              variant="light"
              color="purple"
            >
              Preview Reset
            </Button>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={handleExecuteReset}
              loading={loading && showPreview}
              disabled={!showPreview || !preview}
              color="green"
            >
              Execute Reset
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}

export default BudgetResetModal