import { useState, useEffect } from 'react'
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Alert,
  Loader,
  Center,
  Divider,
  Button,
  Menu,
  ScrollArea,
  Title,
  Tooltip,
  Box
} from '@mantine/core'
import {
  IconBell,
  IconAlertTriangle,
  IconAlertOctagon,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconDots,
  IconEye,
  IconTrash,
  IconRefresh,
  IconChartPie,
  IconCalendarRepeat,
  IconPigMoney,
  IconFilter
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { alertService } from 'src/domains/alerts-notifications/services/AlertService'
import { AlertTypes, AlertSeverity, AlertStatus, AlertHelpers } from 'src/domains/alerts-notifications/types'

function AlertCenter({ refreshTrigger = 0, compact = false, maxHeight = '400px' }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('active') // active, all, critical

  useEffect(() => {
    loadAlerts()
  }, [refreshTrigger, filter])

  const loadAlerts = async () => {
    setLoading(true)
    setError('')
    
    try {
      const filters = {}
      if (filter === 'active') {
        filters.status = AlertStatus.ACTIVE
      } else if (filter === 'critical') {
        filters.status = AlertStatus.ACTIVE
        filters.severity = AlertSeverity.CRITICAL
      }
      
      if (compact) {
        filters.limit = 5
      }

      const { data, error } = await alertService.getAlerts(filters)
      
      if (error) {
        setError(error)
        return
      }
      
      setAlerts(data || [])
    } catch (err) {
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (alertId) => {
    try {
      const { error } = await alertService.dismissAlert(alertId)
      
      if (error) {
        notifications.show({
          title: 'Error',
          message: error,
          color: 'red',
          icon: <IconX size={16} />
        })
        return
      }
      
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      
      notifications.show({
        title: 'Alert Dismissed',
        message: 'Alert has been dismissed',
        color: 'green',
        icon: <IconCheck size={16} />
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to dismiss alert',
        color: 'red',
        icon: <IconX size={16} />
      })
    }
  }

  const handleMarkAsRead = async (alertId) => {
    try {
      const { error } = await alertService.markAsRead(alertId)
      
      if (error) {
        notifications.show({
          title: 'Error',
          message: error,
          color: 'red',
          icon: <IconX size={16} />
        })
        return
      }
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: AlertStatus.READ }
          : alert
      ))
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to mark as read',
        color: 'red',
        icon: <IconX size={16} />
      })
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'red'
      case AlertSeverity.WARNING:
        return 'yellow'
      case AlertSeverity.SUCCESS:
        return 'green'
      default:
        return 'blue'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return <IconAlertOctagon size={16} />
      case AlertSeverity.WARNING:
        return <IconAlertTriangle size={16} />
      case AlertSeverity.SUCCESS:
        return <IconCheck size={16} />
      default:
        return <IconInfoCircle size={16} />
    }
  }

  const getAlertTypeIcon = (alertType) => {
    switch (alertType) {
      case AlertTypes.BUDGET_WARNING:
      case AlertTypes.BUDGET_EXCEEDED:
        return <IconAlertTriangle size={16} />
      case AlertTypes.MONTHLY_SUMMARY:
        return <IconChartPie size={16} />
      case AlertTypes.RECURRING_DUE:
        return <IconCalendarRepeat size={16} />
      case AlertTypes.PAYDAY_REMINDER:
        return <IconPigMoney size={16} />
      default:
        return <IconBell size={16} />
    }
  }

  const getActiveAlertsCount = () => {
    return alerts.filter(alert => alert.status === AlertStatus.ACTIVE).length
  }

  const getCriticalAlertsCount = () => {
    return alerts.filter(alert => 
      alert.status === AlertStatus.ACTIVE && alert.severity === AlertSeverity.CRITICAL
    ).length
  }

  if (loading) {
    return (
      <Card withBorder p="md">
        <Center h={compact ? 100 : 200}>
          <Loader size="lg" />
        </Center>
      </Card>
    )
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconBell size={20} color="#ea580c" />
            <Title order={compact ? 5 : 4}>
              {compact ? 'Alerts' : 'Alert Center'}
            </Title>
            {getActiveAlertsCount() > 0 && (
              <Badge color="red" variant="filled" size="sm">
                {getActiveAlertsCount()}
              </Badge>
            )}
          </Group>
          
          <Group gap="xs">
            {!compact && (
              <Menu position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="light" size="sm">
                    <IconFilter size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item 
                    onClick={() => setFilter('active')}
                    leftSection={<IconBell size={14} />}
                  >
                    Active Alerts
                  </Menu.Item>
                  <Menu.Item 
                    onClick={() => setFilter('critical')}
                    leftSection={<IconAlertOctagon size={14} />}
                  >
                    Critical Only
                  </Menu.Item>
                  <Menu.Item 
                    onClick={() => setFilter('all')}
                    leftSection={<IconEye size={14} />}
                  >
                    All Alerts
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
            
            <ActionIcon variant="light" size="sm" onClick={loadAlerts}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Quick Stats */}
        {!compact && alerts.length > 0 && (
          <Group>
            <Badge variant="light" color="blue">
              {alerts.length} total
            </Badge>
            <Badge variant="light" color="orange">
              {getActiveAlertsCount()} active
            </Badge>
            {getCriticalAlertsCount() > 0 && (
              <Badge variant="light" color="red">
                {getCriticalAlertsCount()} critical
              </Badge>
            )}
          </Group>
        )}

        <Divider />

        {/* Alerts List */}
        {error ? (
          <Alert icon={<IconX size={16} />} color="red">
            {error}
          </Alert>
        ) : alerts.length === 0 ? (
          <Center p={compact ? "md" : "xl"}>
            <Stack align="center" gap="sm">
              <IconBell size={compact ? 32 : 48} color="gray" />
              <Text c="dimmed" size={compact ? "sm" : "md"}>
                {filter === 'active' ? 'No active alerts' : 'No alerts found'}
              </Text>
              {filter === 'active' && (
                <Text size="xs" c="dimmed">
                  You're all caught up!
                </Text>
              )}
            </Stack>
          </Center>
        ) : (
          <ScrollArea h={compact ? maxHeight : 'auto'} type="hover">
            <Stack gap="sm">
              {alerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  withBorder 
                  p="md" 
                  radius="md"
                  bg={alert.status === AlertStatus.ACTIVE ? 'gray.0' : 'gray.1'}
                  style={{ 
                    borderColor: alert.severity === AlertSeverity.CRITICAL ? '#fa5252' : 
                                alert.severity === AlertSeverity.WARNING ? '#fd7e14' : '#339af0',
                    borderWidth: alert.status === AlertStatus.ACTIVE ? 2 : 1
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Group align="flex-start" style={{ flex: 1 }}>
                      <Box pt={2}>
                        {getAlertTypeIcon(alert.alert_type)}
                      </Box>
                      
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Group gap="sm">
                          <Text fw={600} size="sm" lineClamp={1}>
                            {alert.title}
                          </Text>
                          <Badge 
                            size="xs" 
                            color={getSeverityColor(alert.severity)}
                            variant="light"
                          >
                            {alert.severity}
                          </Badge>
                          {alert.status !== AlertStatus.ACTIVE && (
                            <Badge size="xs" color="gray" variant="light">
                              {alert.status}
                            </Badge>
                          )}
                        </Group>
                        
                        <Text size="xs" c="dimmed" lineClamp={compact ? 2 : 3}>
                          {alert.message}
                        </Text>
                        
                        <Text size="xs" c="dimmed">
                          {AlertHelpers.getRelativeTime(new Date(alert.created_at))}
                        </Text>
                      </Stack>
                    </Group>
                    
                    <Group gap={4}>
                      {alert.status === AlertStatus.ACTIVE && (
                        <>
                          <Tooltip label="Mark as read">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => handleMarkAsRead(alert.id)}
                            >
                              <IconEye size={12} />
                            </ActionIcon>
                          </Tooltip>
                          
                          <Tooltip label="Dismiss">
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => handleDismiss(alert.id)}
                            >
                              <IconX size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      )}
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        )}
        
        {/* Actions */}
        {!compact && alerts.length > 0 && (
          <>
            <Divider />
            <Group justify="space-between">
              <Button
                variant="light"
                size="xs"
                onClick={() => {
                  Promise.all(
                    alerts
                      .filter(alert => alert.status === AlertStatus.ACTIVE)
                      .map(alert => alertService.markAsRead(alert.id))
                  ).then(() => {
                    loadAlerts()
                    notifications.show({
                      title: 'All Alerts Read',
                      message: 'Marked all active alerts as read',
                      color: 'green'
                    })
                  })
                }}
                disabled={getActiveAlertsCount() === 0}
              >
                Mark All as Read
              </Button>
              
              <Button
                variant="light"
                color="red"
                size="xs"
                onClick={() => {
                  Promise.all(
                    alerts
                      .filter(alert => alert.status === AlertStatus.ACTIVE)
                      .map(alert => alertService.dismissAlert(alert.id))
                  ).then(() => {
                    loadAlerts()
                    notifications.show({
                      title: 'All Alerts Dismissed',
                      message: 'Dismissed all active alerts',
                      color: 'green'
                    })
                  })
                }}
                disabled={getActiveAlertsCount() === 0}
              >
                Dismiss All
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Card>
  )
}

export default AlertCenter