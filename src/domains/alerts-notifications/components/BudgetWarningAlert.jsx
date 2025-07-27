import { useState, useEffect } from 'react'
import {
  Alert,
  Group,
  Text,
  Progress,
  Badge,
  Button,
  Stack,
  ActionIcon,
  Collapse,
  Card,
  NumberFormatter
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconAlertOctagon,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconEye
} from '@tabler/icons-react'
import { alertService } from 'src/domains/alerts-notifications/services/AlertService'
import { expenseService } from 'src/domains/expense-management/services/ExpenseService'
import { AlertHelpers, BudgetThresholds, AlertSeverity } from 'src/domains/alerts-notifications/types'

function BudgetWarningAlert({ category, currentSpent, budgetLimit, onDismiss, compact = false }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const percentage = AlertHelpers.getBudgetPercentage(currentSpent, budgetLimit)
  const remaining = Math.max(0, budgetLimit - currentSpent)
  const overage = Math.max(0, currentSpent - budgetLimit)
  const severity = AlertHelpers.getSeverityForBudgetPercentage(percentage)

  // Determine if we should show this warning
  const shouldShow = percentage >= BudgetThresholds.EARLY_WARNING

  if (!shouldShow) {
    return null
  }

  const getAlertColor = () => {
    if (percentage >= BudgetThresholds.CRITICAL) return 'red'
    if (percentage >= BudgetThresholds.WARNING) return 'orange'
    return 'yellow'
  }

  const getAlertIcon = () => {
    if (percentage >= BudgetThresholds.CRITICAL) {
      return <IconAlertOctagon size={20} />
    }
    return <IconAlertTriangle size={20} />
  }

  const getAlertTitle = () => {
    if (percentage >= BudgetThresholds.CRITICAL) {
      return `${category} Budget Exceeded!`
    }
    if (percentage >= BudgetThresholds.WARNING) {
      return `${category} Budget Warning`
    }
    return `${category} Budget Notice`
  }

  const getAlertMessage = () => {
    if (percentage >= BudgetThresholds.CRITICAL) {
      return `You've exceeded your ${category} budget by £${overage.toFixed(2)}.`
    }
    return `You've spent ${percentage}% of your ${category} budget (£${currentSpent.toFixed(2)} of £${budgetLimit.toFixed(2)}).`
  }

  const handleGenerateAlert = async () => {
    setLoading(true)
    try {
      await alertService.checkBudgetWarnings()
      if (onDismiss) {
        onDismiss()
      }
    } catch (err) {
      console.error('Error generating alert:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Alert
      color={getAlertColor()}
      icon={getAlertIcon()}
      variant="light"
      style={{ marginBottom: compact ? '8px' : '16px' }}
    >
      <Stack gap="sm">
        {/* Main Alert Content */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text fw={600} size="sm">
              {getAlertTitle()}
            </Text>
            
            <Text size="sm">
              {getAlertMessage()}
            </Text>

            {/* Progress Bar */}
            <Progress
              value={Math.min(percentage, 120)} // Cap at 120% for visual purposes
              color={getAlertColor()}
              size="md"
              radius="md"
              style={{ maxWidth: 300 }}
            />

            {/* Quick Stats */}
            <Group gap="md">
              <Badge 
                color={getAlertColor()} 
                variant="light" 
                size="sm"
              >
                {percentage}% spent
              </Badge>
              
              {remaining > 0 ? (
                <Badge color="blue" variant="light" size="sm">
                  <NumberFormatter value={remaining} prefix="£" /> remaining
                </Badge>
              ) : (
                <Badge color="red" variant="light" size="sm">
                  <NumberFormatter value={overage} prefix="£" /> over budget
                </Badge>
              )}
            </Group>
          </Stack>

          {/* Actions */}
          <Group gap="xs">
            {!compact && (
              <ActionIcon
                variant="light"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                color={getAlertColor()}
              >
                {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </ActionIcon>
            )}
            
            {onDismiss && (
              <ActionIcon
                variant="light"
                color="gray"
                size="sm"
                onClick={onDismiss}
              >
                <IconX size={14} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Expanded Details */}
        {!compact && (
          <Collapse in={expanded}>
            <Card withBorder p="sm" mt="sm" bg="gray.0">
              <Stack gap="sm">
                <Text size="sm" fw={500}>Budget Details</Text>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Budget Limit:</Text>
                  <NumberFormatter value={budgetLimit} prefix="£" fw={500} />
                </Group>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Amount Spent:</Text>
                  <NumberFormatter value={currentSpent} prefix="£" fw={500} />
                </Group>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Percentage Used:</Text>
                  <Text fw={500} c={getAlertColor()}>{percentage}%</Text>
                </Group>
                
                {remaining > 0 ? (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Remaining:</Text>
                    <NumberFormatter value={remaining} prefix="£" fw={500} c="green" />
                  </Group>
                ) : (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Over Budget:</Text>
                    <NumberFormatter value={overage} prefix="£" fw={500} c="red" />
                  </Group>
                )}

                {/* Recommendations */}
                <Stack gap="xs" mt="md">
                  <Text size="sm" fw={500}>Recommendations:</Text>
                  
                  {percentage >= BudgetThresholds.CRITICAL ? (
                    <Text size="xs" c="dimmed">
                      • Consider pausing spending in this category
                      • Review recent expenses for unnecessary purchases
                      • Transfer budget from other categories if possible
                    </Text>
                  ) : percentage >= BudgetThresholds.WARNING ? (
                    <Text size="xs" c="dimmed">
                      • Monitor spending closely for the rest of the month
                      • Look for ways to reduce expenses in this category
                      • Consider adjusting the budget if consistently exceeded
                    </Text>
                  ) : (
                    <Text size="xs" c="dimmed">
                      • Keep an eye on spending in this category
                      • You're on track but approaching the warning threshold
                    </Text>
                  )}
                </Stack>

                {/* Actions */}
                <Group justify="flex-end" mt="sm">
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconEye size={12} />}
                    onClick={handleGenerateAlert}
                    loading={loading}
                  >
                    Create Alert
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Collapse>
        )}
      </Stack>
    </Alert>
  )
}

export default BudgetWarningAlert