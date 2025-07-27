import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Group,
  Text,
  Card,
  Badge,
  Button,
  Alert,
  Table,
  Checkbox,
  Select,
  ActionIcon,
  Tooltip,
  Progress,
  NumberFormatter,
  Title,
  ThemeIcon
} from '@mantine/core'
import {
  IconRobot,
  IconCheck,
  IconX,
  IconEdit,
  IconBulb,
  IconAlertTriangle,
  IconRefresh,
  IconWand
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { insightService } from 'src/domains/intelligent-insights/services/InsightService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { CategoryConfidence } from 'src/domains/intelligent-insights/types'

function SmartCategorization({ opened, onClose, transactions = [], onCategorizeComplete }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSuggestions, setSelectedSuggestions] = useState({})
  const [applying, setApplying] = useState(false)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    if (opened && transactions.length > 0) {
      generateSuggestions()
      loadCategories()
    }
  }, [opened, transactions])

  const loadCategories = () => {
    // Common categories - ideally this would come from a category service
    const commonCategories = [
      'Food & Drink',
      'Groceries', 
      'Transport',
      'Entertainment',
      'Shopping',
      'Health & Fitness',
      'Utilities',
      'Coffee',
      'Dining Out',
      'Subscriptions',
      'Other'
    ]
    setCategories(commonCategories.map(cat => ({ value: cat, label: cat })))
  }

  const generateSuggestions = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await insightService.bulkCategorizeTransactions(transactions)
      
      if (error) {
        setError(error)
        return
      }

      // Combine suggestions with transaction data
      const combinedSuggestions = data.map(suggestion => {
        const transaction = transactions.find(t => t.id === suggestion.transaction_id)
        return {
          ...suggestion,
          transaction: transaction || {}
        }
      })

      setSuggestions(combinedSuggestions)

      // Auto-select high confidence suggestions
      const autoSelected = {}
      combinedSuggestions.forEach((suggestion, index) => {
        if (suggestion.auto_assign && suggestion.confidence === CategoryConfidence.VERY_HIGH) {
          autoSelected[index] = true
        }
      })
      setSelectedSuggestions(autoSelected)

    } catch (err) {
      setError('Failed to generate categorization suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionToggle = (index, checked) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [index]: checked
    }))
  }

  const handleCategoryChange = (index, newCategory) => {
    setSuggestions(prev => prev.map((suggestion, i) => 
      i === index 
        ? { ...suggestion, suggested_category: newCategory, confidence: CategoryConfidence.MEDIUM }
        : suggestion
    ))
  }

  const handleApplySelected = async () => {
    const selectedIndices = Object.keys(selectedSuggestions).filter(key => selectedSuggestions[key])
    
    if (selectedIndices.length === 0) {
      notifications.show({
        title: 'No Suggestions Selected',
        message: 'Please select at least one suggestion to apply',
        color: 'orange'
      })
      return
    }

    setApplying(true)

    try {
      let successCount = 0
      let errorCount = 0

      for (const index of selectedIndices) {
        const suggestion = suggestions[index]
        if (suggestion.transaction) {
          try {
            await expenseService.updateExpense(suggestion.transaction.id, {
              ...suggestion.transaction,
              category: suggestion.suggested_category
            })
            successCount++
          } catch (err) {
            console.error('Error updating transaction:', err)
            errorCount++
          }
        }
      }

      notifications.show({
        title: 'Categorization Complete',
        message: `Successfully updated ${successCount} transactions${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        color: errorCount > 0 ? 'orange' : 'green',
        icon: <IconCheck size={16} />
      })

      if (onCategorizeComplete) {
        onCategorizeComplete(successCount)
      }

      // Close modal if all successful
      if (errorCount === 0) {
        onClose()
      }

    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to apply categorization changes',
        color: 'red'
      })
    } finally {
      setApplying(false)
    }
  }

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case CategoryConfidence.VERY_HIGH: return 'green'
      case CategoryConfidence.HIGH: return 'blue'
      case CategoryConfidence.MEDIUM: return 'orange'
      case CategoryConfidence.LOW: return 'red'
      default: return 'gray'
    }
  }

  const getConfidencePercentage = (confidence) => {
    switch (confidence) {
      case CategoryConfidence.VERY_HIGH: return 95
      case CategoryConfidence.HIGH: return 85
      case CategoryConfidence.MEDIUM: return 75
      case CategoryConfidence.LOW: return 60
      default: return 50
    }
  }

  const selectedCount = Object.values(selectedSuggestions).filter(Boolean).length
  const totalPotentialSavings = suggestions
    .filter((_, index) => selectedSuggestions[index])
    .reduce((sum, suggestion) => sum + (suggestion.transaction.amount || 0), 0)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconRobot size={20} />
          <Text fw={500}>Smart Transaction Categorization</Text>
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

        {/* Summary Card */}
        <Card withBorder p="md" bg="blue.0">
          <Group justify="space-between" align="flex-start">
            <div>
              <Group mb="sm">
                <IconWand size={20} color="blue" />
                <Title order={4}>AI Categorization Summary</Title>
              </Group>
              <Text size="sm" c="dimmed">
                Analyzed {transactions.length} transactions and generated {suggestions.length} suggestions
              </Text>
            </div>
            <Group>
              <Badge variant="light" color="blue">
                {selectedCount} selected
              </Badge>
              {selectedCount > 0 && (
                <Badge variant="light" color="green">
                  £{totalPotentialSavings.toFixed(2)} total
                </Badge>
              )}
            </Group>
          </Group>
          
          {selectedCount > 0 && (
            <Progress
              value={(selectedCount / suggestions.length) * 100}
              color="blue"
              size="sm"
              radius="md"
              mt="sm"
              label={`${selectedCount}/${suggestions.length} suggestions selected`}
            />
          )}
        </Card>

        {loading ? (
          <Card withBorder p="md">
            <Group>
              <IconRobot size={24} color="blue" />
              <Text>Analyzing transactions and generating smart suggestions...</Text>
            </Group>
          </Card>
        ) : suggestions.length > 0 ? (
          <Card withBorder p="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>Categorization Suggestions</Title>
              <Group>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconRefresh size={14} />}
                  onClick={generateSuggestions}
                  loading={loading}
                >
                  Regenerate
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => {
                    const allSelected = {}
                    suggestions.forEach((_, index) => {
                      allSelected[index] = true
                    })
                    setSelectedSuggestions(allSelected)
                  }}
                >
                  Select All
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setSelectedSuggestions({})}
                >
                  Clear All
                </Button>
              </Group>
            </Group>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Select</Table.Th>
                  <Table.Th>Transaction</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Suggested Category</Table.Th>
                  <Table.Th>Confidence</Table.Th>
                  <Table.Th>Reason</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {suggestions.map((suggestion, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Checkbox
                        checked={selectedSuggestions[index] || false}
                        onChange={(e) => handleSuggestionToggle(index, e.currentTarget.checked)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <div>
                        <Text size="sm" fw={500}>
                          {suggestion.transaction.notes || 'No description'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {suggestion.transaction.date}
                        </Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <NumberFormatter 
                        value={suggestion.transaction.amount || 0} 
                        prefix="£" 
                        size="sm"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Select
                        value={suggestion.suggested_category}
                        onChange={(value) => handleCategoryChange(index, value)}
                        data={categories}
                        size="xs"
                        style={{ minWidth: 140 }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={getConfidenceColor(suggestion.confidence)}
                        variant="light"
                        size="sm"
                      >
                        {getConfidencePercentage(suggestion.confidence)}%
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed" maw={150}>
                        {suggestion.reason}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {suggestion.auto_assign && (
                          <Tooltip label="Auto-assignable">
                            <ThemeIcon size="sm" color="green" variant="light">
                              <IconCheck size={12} />
                            </ThemeIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="Edit suggestion">
                          <ActionIcon size="sm" variant="light">
                            <IconEdit size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        ) : (
          <Card withBorder p="md">
            <Stack align="center" gap="md">
              <IconBulb size={48} color="gray" />
              <Title order={4} ta="center" c="dimmed">No Suggestions Available</Title>
              <Text ta="center" c="dimmed" maw={400}>
                The AI couldn't generate categorization suggestions for the provided transactions. 
                This might happen if the transactions are already well-categorized or lack sufficient description.
              </Text>
            </Stack>
          </Card>
        )}

        {/* Actions */}
        <Group justify="space-between">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Group>
            {selectedCount > 0 && (
              <Text size="sm" c="dimmed">
                {selectedCount} suggestion{selectedCount !== 1 ? 's' : ''} selected
              </Text>
            )}
            <Button
              onClick={handleApplySelected}
              loading={applying}
              disabled={selectedCount === 0}
              leftSection={<IconCheck size={16} />}
            >
              Apply Selected ({selectedCount})
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}

export default SmartCategorization