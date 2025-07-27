import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Group,
  ActionIcon,
  Badge,
  Text,
  Stack,
  Loader,
  Center,
  Alert,
  Menu,
  Button,
  Modal,
  Select,
  Switch,
  NumberFormatter,
  Tooltip,
  Divider
} from '@mantine/core'
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconPlayerPause,
  IconCalendarEvent,
  IconAlertCircle,
  IconCheck,
  IconFilter,
  IconX,
  IconRefresh
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { recurringTransactionService } from 'src/domains/recurring-transactions/services/RecurringTransactionService'
import { RecurringFrequency, RecurringStatus } from 'src/domains/recurring-transactions/types'
import RecurringTransactionForm from './RecurringTransactionForm'

function RecurringTransactionsList({ refreshTrigger = 0 }) {
  const [recurringTransactions, setRecurringTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingRecurring, setEditingRecurring] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [frequencyFilter, setFrequencyFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState(true)

  useEffect(() => {
    loadRecurringTransactions()
  }, [refreshTrigger, statusFilter, frequencyFilter, activeFilter])

  const loadRecurringTransactions = async () => {
    setLoading(true)
    setError('')

    try {
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (frequencyFilter) filters.frequency = frequencyFilter
      if (activeFilter !== null) filters.is_active = activeFilter

      const { data, error } = await recurringTransactionService.getRecurringTransactions(filters)

      if (error) {
        setError(error)
        return
      }

      setRecurringTransactions(data || [])
    } catch (err) {
      setError('Failed to load recurring transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (recurring) => {
    setEditingRecurring(recurring)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    setDeletingId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return

    try {
      const { error } = await recurringTransactionService.deleteRecurringTransaction(deletingId)

      if (error) {
        notifications.show({
          title: 'Error',
          message: error,
          color: 'red',
          icon: <IconX size={16} />
        })
        return
      }

      notifications.show({
        title: 'Deleted',
        message: 'Recurring transaction deleted successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      })

      loadRecurringTransactions()
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete recurring transaction',
        color: 'red',
        icon: <IconX size={16} />
      })
    } finally {
      setShowDeleteModal(false)
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id, currentActive) => {
    try {
      const { error } = await recurringTransactionService.toggleRecurringTransaction(id, !currentActive)

      if (error) {
        notifications.show({
          title: 'Error',
          message: error,
          color: 'red',
          icon: <IconX size={16} />
        })
        return
      }

      notifications.show({
        title: 'Updated',
        message: `Recurring transaction ${!currentActive ? 'activated' : 'paused'}`,
        color: 'green',
        icon: <IconCheck size={16} />
      })

      loadRecurringTransactions()
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update recurring transaction',
        color: 'red',
        icon: <IconX size={16} />
      })
    }
  }

  const formatFrequency = (frequency, config) => {
    switch (frequency) {
      case RecurringFrequency.DAILY:
        return `Every ${config.interval || 1} day${(config.interval || 1) > 1 ? 's' : ''}`
      case RecurringFrequency.WEEKLY:
        return `Weekly${config.interval > 1 ? ` (every ${config.interval} weeks)` : ''}`
      case RecurringFrequency.MONTHLY:
        return `Monthly${config.interval > 1 ? ` (every ${config.interval} months)` : ''}`
      case RecurringFrequency.YEARLY:
        return 'Yearly'
      case RecurringFrequency.CUSTOM:
        return `Every ${config.interval_days || 1} days`
      default:
        return frequency
    }
  }

  const getStatusColor = (status, isActive) => {
    if (!isActive) return 'gray'
    switch (status) {
      case RecurringStatus.ACTIVE:
        return 'green'
      case RecurringStatus.PAUSED:
        return 'yellow'
      case RecurringStatus.ENDED:
        return 'red'
      default:
        return 'gray'
    }
  }

  const formatNextDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 0) return 'Overdue'
    if (diffDays <= 7) return `In ${diffDays} days`
    
    return date.toLocaleDateString('en-GB')
  }

  const clearFilters = () => {
    setStatusFilter('')
    setFrequencyFilter('')
    setActiveFilter(true)
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: RecurringStatus.ACTIVE, label: 'Active' },
    { value: RecurringStatus.PAUSED, label: 'Paused' },
    { value: RecurringStatus.ENDED, label: 'Ended' }
  ]

  const frequencyOptions = [
    { value: '', label: 'All Frequencies' },
    { value: RecurringFrequency.DAILY, label: 'Daily' },
    { value: RecurringFrequency.WEEKLY, label: 'Weekly' },
    { value: RecurringFrequency.MONTHLY, label: 'Monthly' },
    { value: RecurringFrequency.YEARLY, label: 'Yearly' },
    { value: RecurringFrequency.CUSTOM, label: 'Custom' }
  ]

  if (loading) {
    return (
      <Card withBorder p="xl">
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      </Card>
    )
  }

  return (
    <Stack gap="md">
      {/* Filters */}
      <Card withBorder p="md">
        <Group justify="space-between" mb="md">
          <Group>
            <IconFilter size={16} />
            <Text fw={500}>Filters</Text>
          </Group>
          <Group>
            <Button variant="light" size="xs" onClick={clearFilters}>
              Clear Filters
            </Button>
            <ActionIcon variant="light" onClick={loadRecurringTransactions}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Group>
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={statusOptions}
            w={140}
            size="sm"
          />
          
          <Select
            placeholder="Frequency"
            value={frequencyFilter}
            onChange={setFrequencyFilter}
            data={frequencyOptions}
            w={140}
            size="sm"
          />
          
          <Switch
            label="Active only"
            checked={activeFilter}
            onChange={(e) => setActiveFilter(e.currentTarget.checked)}
            size="sm"
          />
        </Group>
      </Card>

      {/* Recurring Transactions Table */}
      <Card withBorder>
        {error ? (
          <Alert icon={<IconAlertCircle size={16} />} color="red" m="md">
            {error}
          </Alert>
        ) : recurringTransactions.length === 0 ? (
          <Center p="xl">
            <Stack align="center" gap="md">
              <IconCalendarEvent size={48} color="gray" />
              <Text c="dimmed">No recurring transactions found</Text>
              <Button onClick={() => setShowForm(true)}>
                Add Your First Recurring Transaction
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Frequency</Table.Th>
                <Table.Th>Next Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Generated</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recurringTransactions.map((recurring) => (
                <Table.Tr key={recurring.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500}>{recurring.name}</Text>
                      {recurring.description && (
                        <Text size="xs" c="dimmed">{recurring.description}</Text>
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <NumberFormatter value={recurring.amount} prefix="£" />
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">
                      {recurring.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {formatFrequency(recurring.frequency, recurring.frequency_config)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={
                      recurring.next_generation_date && 
                      new Date(recurring.next_generation_date) < new Date() 
                        ? 'red' : 'dimmed'
                    }>
                      {formatNextDate(recurring.next_generation_date)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      variant="light" 
                      color={getStatusColor(recurring.status, recurring.is_active)}
                      size="sm"
                    >
                      {recurring.is_active ? recurring.status : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {recurring.total_generated || 0}
                      {recurring.max_generations && ` / ${recurring.max_generations}`}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label={recurring.is_active ? 'Pause' : 'Activate'}>
                        <ActionIcon
                          variant="light"
                          color={recurring.is_active ? 'yellow' : 'green'}
                          size="sm"
                          onClick={() => handleToggleActive(recurring.id, recurring.is_active)}
                        >
                          {recurring.is_active ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
                        </ActionIcon>
                      </Tooltip>

                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="light" size="sm">
                            <IconDots size={14} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handleEdit(recurring)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDelete(recurring.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Forms and Modals */}
      <RecurringTransactionForm
        opened={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingRecurring(null)
        }}
        onRecurringAdded={() => {
          loadRecurringTransactions()
          setEditingRecurring(null)
        }}
        editingRecurring={editingRecurring}
      />

      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        size="sm"
      >
        <Stack gap="md">
          <Text>Are you sure you want to delete this recurring transaction?</Text>
          <Text size="sm" c="dimmed">
            This action cannot be undone. Any future scheduled expenses will not be generated.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

export default RecurringTransactionsList