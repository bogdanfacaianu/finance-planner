import { useState, useEffect } from 'react'
import React from 'react'
import {
  Modal,
  Stack,
  Group,
  Text,
  Select,
  Button,
  Card,
  Badge,
  Alert,
  NumberFormatter,
  SimpleGrid,
  Title,
  Checkbox,
  MultiSelect
} from '@mantine/core'
import {
  IconDownload,
  IconFileSpreadsheet,
  IconCalendar,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconDatabase
} from '@tabler/icons-react'
import { DateInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { exportService } from 'src/domains/data-export/services/ExportService'

function DataExportModal({ opened, onClose, onExportComplete }) {
  const [exportOptions, setExportOptions] = useState({
    data_type: 'expenses',
    start_date: null,
    end_date: null,
    categories: [],
    include_notes: true,
    include_transaction_type: true,
    format: 'csv'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [availableCategories, setAvailableCategories] = useState([])

  useEffect(() => {
    if (opened) {
      loadAvailableCategories()
      generateSummary()
    }
  }, [opened])

  const loadAvailableCategories = () => {
    const commonCategories = [
      'Food & Drink', 'Groceries', 'Transport', 'Entertainment', 
      'Shopping', 'Health & Fitness', 'Utilities', 'Coffee', 
      'Dining Out', 'Subscriptions', 'Travel', 'Other'
    ]
    setAvailableCategories(commonCategories.map(cat => ({ value: cat, label: cat })))
  }

  const generateSummary = async () => {
    try {
      const { data, error } = await exportService.generateExportSummary({
        start_date: exportOptions.start_date,
        end_date: exportOptions.end_date
      })
      
      if (error) {
        console.error('Error generating summary:', error)
        return
      }

      setSummary(data)
    } catch (err) {
      console.error('Error generating summary:', err)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setError('')

    try {
      let result
      let filename

      switch (exportOptions.data_type) {
        case 'expenses':
          result = await exportService.exportExpensesToCSV({
            start_date: exportOptions.start_date,
            end_date: exportOptions.end_date,
            categories: exportOptions.categories,
            include_notes: exportOptions.include_notes,
            include_transaction_type: exportOptions.include_transaction_type
          })
          filename = exportService.generateFilename('expenses')
          break

        case 'budgets':
          result = await exportService.exportBudgetsToCSV({
            start_date: exportOptions.start_date,
            end_date: exportOptions.end_date
          })
          filename = exportService.generateFilename('budgets')
          break

        case 'recurring':
          result = await exportService.exportRecurringTransactionsToCSV()
          filename = exportService.generateFilename('recurring_transactions')
          break

        case 'categories':
          result = await exportService.exportUserCategoriesToCSV()
          filename = exportService.generateFilename('user_categories')
          break

        case 'all':
          result = await exportService.exportAllData({
            start_date: exportOptions.start_date,
            end_date: exportOptions.end_date,
            categories: exportOptions.categories
          })
          
          if (result.data) {
            const { exports } = result.data
            Object.entries(exports).forEach(([type, content]) => {
              const typeFilename = exportService.generateFilename(type)
              exportService.downloadFile(content, typeFilename)
            })
            
            notifications.show({
              title: 'Export Complete',
              message: `Downloaded ${Object.keys(exports).length} files successfully`,
              color: 'green',
              icon: <IconCheck size={16} />
            })

            if (onExportComplete) {
              onExportComplete(result.data)
            }

            onClose()
            return
          }
          break

        default:
          setError('Invalid export type selected')
          return
      }

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.data && exportOptions.data_type !== 'all') {
        exportService.downloadFile(result.data, filename)
        
        notifications.show({
          title: 'Export Complete',
          message: `${filename} downloaded successfully`,
          color: 'green',
          icon: <IconCheck size={16} />
        })

        if (onExportComplete) {
          onExportComplete({ filename, content: result.data })
        }

        onClose()
      }

    } catch (err) {
      setError('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const dataTypeOptions = [
    { value: 'expenses', label: 'Expenses' },
    { value: 'budgets', label: 'Budgets' },
    { value: 'recurring', label: 'Recurring Transactions' },
    { value: 'categories', label: 'Custom Categories' },
    { value: 'all', label: 'All Data (Multiple Files)' }
  ]

  const getDataTypeIcon = (type) => {
    switch (type) {
      case 'expenses': return IconFileSpreadsheet
      case 'budgets': return IconCalendar
      case 'recurring': return IconFileSpreadsheet
      case 'categories': return IconDatabase
      default: return IconDownload
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconDownload size={20} />
          <Text fw={500}>Export Financial Data</Text>
        </Group>
      }
      size="lg"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red">
            {error}
          </Alert>
        )}

        {/* Export Type Selection */}
        <Card withBorder p="md" bg="blue.0">
          <Stack gap="md">
            <Group>
              <IconDatabase size={20} color="blue" />
              <Title order={4}>Data Selection</Title>
            </Group>

            <Select
              label="Data Type"
              value={exportOptions.data_type}
              onChange={(value) => setExportOptions(prev => ({ ...prev, data_type: value }))}
              data={dataTypeOptions}
              leftSection={React.createElement(getDataTypeIcon(exportOptions.data_type), { size: 16 })}
            />

            {/* Date Range for applicable types */}
            {['expenses', 'budgets', 'all'].includes(exportOptions.data_type) && (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <DateInput
                  label="Start Date"
                  placeholder="Select start date (optional)"
                  value={exportOptions.start_date}
                  onChange={(value) => setExportOptions(prev => ({ ...prev, start_date: value }))}
                  clearable
                />
                <DateInput
                  label="End Date"
                  placeholder="Select end date (optional)"
                  value={exportOptions.end_date}
                  onChange={(value) => setExportOptions(prev => ({ ...prev, end_date: value }))}
                  clearable
                />
              </SimpleGrid>
            )}

            {/* Category Filter for expenses */}
            {['expenses', 'all'].includes(exportOptions.data_type) && (
              <MultiSelect
                label="Categories (optional)"
                placeholder="Select specific categories to export"
                value={exportOptions.categories}
                onChange={(value) => setExportOptions(prev => ({ ...prev, categories: value }))}
                data={availableCategories}
                searchable
                clearable
              />
            )}
          </Stack>
        </Card>

        {/* Export Options */}
        {exportOptions.data_type === 'expenses' && (
          <Card withBorder p="md" bg="green.0">
            <Stack gap="md">
              <Group>
                <IconFileSpreadsheet size={20} color="green" />
                <Title order={4}>Export Options</Title>
              </Group>

              <Stack gap="sm">
                <Checkbox
                  label="Include notes and descriptions"
                  checked={exportOptions.include_notes}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    include_notes: e.currentTarget.checked 
                  }))}
                />
                <Checkbox
                  label="Include transaction types and reimbursement status"
                  checked={exportOptions.include_transaction_type}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    include_transaction_type: e.currentTarget.checked 
                  }))}
                />
              </Stack>
            </Stack>
          </Card>
        )}

        {/* Data Summary */}
        {summary && (
          <Card withBorder p="md">
            <Stack gap="md">
              <Group>
                <IconInfoCircle size={20} color="purple" />
                <Title order={4}>Export Preview</Title>
              </Group>

              <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                <div>
                  <Text size="sm" c="dimmed">Total Expenses</Text>
                  <Text fw={600}>{summary.statistics.total_expenses}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Total Amount</Text>
                  <NumberFormatter 
                    value={summary.statistics.total_amount} 
                    prefix="£" 
                    fw={600}
                  />
                </div>
                <div>
                  <Text size="sm" c="dimmed">Categories</Text>
                  <Text fw={600}>{summary.statistics.unique_categories}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Budget Categories</Text>
                  <Text fw={600}>{summary.statistics.budget_categories}</Text>
                </div>
              </SimpleGrid>

              <Group>
                <Badge variant="light" color="blue">
                  {summary.date_range.start} to {summary.date_range.end}
                </Badge>
                <Badge variant="light" color="green">
                  CSV Format
                </Badge>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Export Information */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            Data is exported in CSV format for compatibility with Excel and other tools. 
            All data remains private and is not sent to external servers.
          </Text>
        </Alert>

        {/* Actions */}
        <Group justify="space-between">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExport}
            loading={loading}
            disabled={!summary || summary.statistics.total_expenses === 0}
          >
            {exportOptions.data_type === 'all' ? 'Download All Files' : 'Download CSV'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default DataExportModal