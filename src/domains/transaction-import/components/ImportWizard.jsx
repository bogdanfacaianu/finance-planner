import { useState, useRef } from 'react'
import {
  Modal,
  Stepper,
  Button,
  Group,
  Text,
  Stack,
  Alert,
  FileInput,
  Table,
  Select,
  Switch,
  Badge,
  Progress,
  Card,
  Title,
  Loader,
  Center,
  NumberFormatter
} from '@mantine/core'
import { 
  IconUpload, 
  IconAlertCircle, 
  IconCheck, 
  IconX, 
  IconFileTypeCsv,
  IconArrowRight,
  IconDownload
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { transactionImportService } from 'src/domains/transaction-import/services/TransactionImportService'

function ImportWizard({ opened, onClose, onImportComplete }) {
  const [activeStep, setActiveStep] = useState(0)
  const [file, setFile] = useState(null)
  const [csvData, setCsvData] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [skipHeaderRow, setSkipHeaderRow] = useState(true)
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef()

  const handleFileUpload = async (uploadedFile) => {
    setError('')
    setFile(uploadedFile)
    
    if (!uploadedFile) return

    try {
      const { data, error: parseError } = await transactionImportService.parseCSVFile(uploadedFile)
      
      if (parseError) {
        setError(parseError)
        return
      }

      setCsvData(data)
      
      // Auto-suggest column mappings
      if (data.length > 0) {
        const suggestions = transactionImportService.getColumnSuggestions(data[0])
        setColumnMapping(suggestions)
      }
      
      setActiveStep(1)
    } catch (err) {
      setError('Failed to parse CSV file')
    }
  }

  const handleColumnMappingNext = async () => {
    if (!columnMapping.amount || columnMapping.date === undefined) {
      setError('Amount and Date columns are required')
      return
    }

    setError('')
    
    try {
      const { data, error: previewError } = await transactionImportService.previewImport(
        csvData, 
        columnMapping, 
        skipHeaderRow
      )
      
      if (previewError) {
        setError(previewError)
        return
      }

      setPreview(data)
      setActiveStep(2)
    } catch (err) {
      setError('Failed to generate preview')
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')
    
    try {
      const { data, error: importError } = await transactionImportService.importTransactions(
        csvData,
        columnMapping,
        skipHeaderRow
      )
      
      if (importError) {
        setError(importError)
        return
      }

      setImportResults(data)
      setActiveStep(3)
      
      if (onImportComplete) {
        onImportComplete(data)
      }
      
      notifications.show({
        title: 'Import Completed',
        message: `Successfully imported ${data.successful_imports} transactions`,
        color: 'green',
        icon: <IconCheck size={16} />
      })
    } catch (err) {
      setError('Failed to import transactions')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setActiveStep(0)
    setFile(null)
    setCsvData([])
    setColumnMapping({})
    setPreview(null)
    setImportResults(null)
    setError('')
    onClose()
  }

  const getColumnOptions = () => {
    if (csvData.length === 0) return []
    
    return csvData[0].map((header, index) => ({
      value: index.toString(),
      label: `Column ${index + 1}: ${header || '(empty)'}`
    }))
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Group><IconFileTypeCsv size={20} /><Text fw={500}>Import Transactions</Text></Group>}
      size="xl"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        <Stepper active={activeStep} size="sm">
          <Stepper.Step 
            label="Upload File" 
            description="Select CSV file"
            icon={<IconUpload size={18} />}
          >
            <Stack gap="md" py="md">
              <Text size="sm" c="dimmed">
                Upload a CSV file containing your transaction data. The file should include 
                columns for amount, date, and optionally description and category.
              </Text>
              
              <FileInput
                ref={fileInputRef}
                label="Select CSV File"
                placeholder="Choose a CSV file..."
                accept=".csv"
                value={file}
                onChange={handleFileUpload}
                leftSection={<IconFileTypeCsv size={16} />}
              />
              
              {csvData.length > 0 && (
                <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                  File loaded successfully! Found {csvData.length} rows 
                  {csvData.length > 0 && ` with ${csvData[0].length} columns`}.
                </Alert>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Step 
            label="Map Columns" 
            description="Configure data mapping"
            icon={<IconArrowRight size={18} />}
          >
            <Stack gap="md" py="md">
              <Text size="sm" c="dimmed">
                Map the columns in your CSV file to the required fields. 
                Amount and Date are required fields.
              </Text>
              
              <Switch
                label="Skip header row"
                description="Check if your CSV file has column headers in the first row"
                checked={skipHeaderRow}
                onChange={(e) => setSkipHeaderRow(e.currentTarget.checked)}
              />
              
              <Group grow>
                <Select
                  label="Amount Column *"
                  placeholder="Select column..."
                  data={getColumnOptions()}
                  value={columnMapping.amount?.toString()}
                  onChange={(value) => setColumnMapping(prev => ({ 
                    ...prev, 
                    amount: value ? parseInt(value) : undefined 
                  }))}
                  required
                />
                <Select
                  label="Date Column *"
                  placeholder="Select column..."
                  data={getColumnOptions()}
                  value={columnMapping.date?.toString()}
                  onChange={(value) => setColumnMapping(prev => ({ 
                    ...prev, 
                    date: value ? parseInt(value) : undefined 
                  }))}
                  required
                />
              </Group>
              
              <Group grow>
                <Select
                  label="Description Column"
                  placeholder="Select column..."
                  data={[{ value: '', label: 'None' }, ...getColumnOptions()]}
                  value={columnMapping.description?.toString() || ''}
                  onChange={(value) => setColumnMapping(prev => ({ 
                    ...prev, 
                    description: value ? parseInt(value) : undefined 
                  }))}
                />
                <Select
                  label="Category Column"
                  placeholder="Select column..."
                  data={[{ value: '', label: 'None' }, ...getColumnOptions()]}
                  value={columnMapping.category?.toString() || ''}
                  onChange={(value) => setColumnMapping(prev => ({ 
                    ...prev, 
                    category: value ? parseInt(value) : undefined 
                  }))}
                />
              </Group>
              
              {/* Sample Data Preview */}
              {csvData.length > 0 && (
                <Card withBorder p="md">
                  <Text size="sm" fw={500} mb="xs">Sample Data Preview</Text>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        {csvData[0].map((header, index) => (
                          <Table.Th key={index}>
                            Column {index + 1}
                            {skipHeaderRow && <br />}
                            {skipHeaderRow && <Text size="xs" c="dimmed">{header}</Text>}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {csvData.slice(skipHeaderRow ? 1 : 0, (skipHeaderRow ? 1 : 0) + 3).map((row, index) => (
                        <Table.Tr key={index}>
                          {row.map((cell, cellIndex) => (
                            <Table.Td key={cellIndex}>
                              <Text size="sm" lineClamp={1}>{cell}</Text>
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Step 
            label="Preview" 
            description="Review before import"
            icon={<IconCheck size={18} />}
          >
            <Stack gap="md" py="md">
              {preview && (
                <>
                  <Group>
                    <Badge color="blue" size="lg">
                      {preview.total_rows} total rows
                    </Badge>
                    <Badge color="green" size="lg">
                      {preview.estimated_valid} estimated valid
                    </Badge>
                    <Badge color="red" size="lg">
                      {preview.estimated_invalid} estimated invalid
                    </Badge>
                  </Group>
                  
                  {preview.errors.length > 0 && (
                    <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                      <Text size="sm" fw={500} mb="xs">Validation Issues Found</Text>
                      <Stack gap={4}>
                        {preview.errors.slice(0, 5).map((error, index) => (
                          <Text key={index} size="xs">
                            Row {error.row}: {error.error}
                          </Text>
                        ))}
                        {preview.errors.length > 5 && (
                          <Text size="xs" c="dimmed">
                            ... and {preview.errors.length - 5} more errors
                          </Text>
                        )}
                      </Stack>
                    </Alert>
                  )}
                  
                  <Card withBorder p="md">
                    <Text size="sm" fw={500} mb="xs">Sample Mapped Data</Text>
                    <Table striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Row</Table.Th>
                          <Table.Th>Amount</Table.Th>
                          <Table.Th>Date</Table.Th>
                          <Table.Th>Category</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {preview.samples.map((sample, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{sample.row_number}</Table.Td>
                            <Table.Td>
                              {sample.mapped.amount ? 
                                <NumberFormatter value={sample.mapped.amount} prefix="£" /> : 
                                <Text c="red" size="sm">Invalid</Text>
                              }
                            </Table.Td>
                            <Table.Td>
                              {sample.mapped.date || <Text c="red" size="sm">Invalid</Text>}
                            </Table.Td>
                            <Table.Td>
                              {sample.mapped.category || <Text c="dimmed" size="sm">None</Text>}
                            </Table.Td>
                            <Table.Td>
                              {sample.valid ? 
                                <Badge color="green" size="sm">Valid</Badge> : 
                                <Badge color="red" size="sm">Invalid</Badge>
                              }
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Card>
                </>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Step 
            label="Complete" 
            description="Import results"
            icon={<IconDownload size={18} />}
          >
            <Stack gap="md" py="md">
              {importResults && (
                <>
                  <Group>
                    <Badge color="blue" size="lg">
                      {importResults.total_rows} total
                    </Badge>
                    <Badge color="green" size="lg">
                      {importResults.successful_imports} imported
                    </Badge>
                    <Badge color="red" size="lg">
                      {importResults.failed_imports} failed
                    </Badge>
                  </Group>
                  
                  <Progress 
                    value={(importResults.successful_imports / importResults.total_rows) * 100}
                    color="green"
                    size="lg"
                    radius="lg"
                  />
                  
                  {importResults.errors.length > 0 && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                      <Text size="sm" fw={500} mb="xs">Import Errors</Text>
                      <Stack gap={4}>
                        {importResults.errors.slice(0, 5).map((error, index) => (
                          <Text key={index} size="xs">
                            Row {error.row}: {error.errors.join(', ')}
                          </Text>
                        ))}
                        {importResults.errors.length > 5 && (
                          <Text size="xs" c="dimmed">
                            ... and {importResults.errors.length - 5} more errors
                          </Text>
                        )}
                      </Stack>
                    </Alert>
                  )}
                  
                  <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                    Successfully imported {importResults.successful_imports} transactions!
                  </Alert>
                </>
              )}
            </Stack>
          </Stepper.Step>
        </Stepper>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="light" onClick={handleClose}>
            {activeStep === 3 ? 'Close' : 'Cancel'}
          </Button>
          
          {activeStep === 1 && (
            <Button 
              onClick={handleColumnMappingNext}
              disabled={!columnMapping.amount || columnMapping.date === undefined}
            >
              Generate Preview
            </Button>
          )}
          
          {activeStep === 2 && (
            <Button 
              onClick={handleImport}
              loading={importing}
              disabled={!preview || preview.estimated_valid === 0}
            >
              {importing ? 'Importing...' : 'Import Transactions'}
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  )
}

export default ImportWizard