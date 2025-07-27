import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppShell,
  Title,
  Group,
  Text,
  Container,
  Stack,
  Loader,
  Center,
  Card,
  Button,
  ActionIcon,
  Avatar,
  Tooltip,
  Divider,
  Badge,
  SimpleGrid
} from '@mantine/core'
import { 
  IconLogout, 
  IconUser, 
  IconSettings,
  IconPigMoney,
  IconBell,
  IconArrowLeft,
  IconWallet,
  IconRefresh,
  IconDownload
} from '@tabler/icons-react'
import { authService } from 'src/domains/authentication/services/AuthService'
import PaydayReminderForm from 'src/domains/alerts-notifications/components/PaydayReminderForm'
import BudgetResetModal from 'src/domains/budget-management/components/BudgetResetModal'
import DataExportModal from 'src/domains/data-export/components/DataExportModal'
import { alertService } from 'src/domains/alerts-notifications/services/AlertService'
import { budgetResetService } from 'src/domains/budget-management/services/BudgetResetService'
import { notifications } from '@mantine/notifications'

function SettingsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPaydayForm, setShowPaydayForm] = useState(false)
  const [showBudgetReset, setShowBudgetReset] = useState(false)
  const [showDataExport, setShowDataExport] = useState(false)
  const [paydayConfig, setPaydayConfig] = useState(null)
  const [budgetResetSettings, setBudgetResetSettings] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const { session, error } = await authService.getSession()
      if (error || !session) {
        navigate('/login')
      } else {
        setUser(session.user)
        await loadPaydayConfig()
        await loadBudgetResetSettings()
      }
      setLoading(false)
    }

    checkAuth()
  }, [navigate])

  const loadPaydayConfig = async () => {
    try {
      const { data } = await alertService.getPaydayConfig()
      setPaydayConfig(data)
    } catch (err) {
      console.error('Error loading payday config:', err)
    }
  }

  const loadBudgetResetSettings = async () => {
    try {
      const { data } = await budgetResetService.getBudgetResetSettings()
      setBudgetResetSettings(data)
    } catch (err) {
      console.error('Error loading budget reset settings:', err)
    }
  }

  const handleLogout = async () => {
    const { error } = await authService.signOut()
    if (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleSavePaydayConfig = async (config) => {
    try {
      const { error } = await alertService.savePaydayConfig(config)
      if (error) {
        throw new Error(error)
      }
      
      setPaydayConfig(config)
      notifications.show({
        title: 'Settings Saved',
        message: 'Your payday reminder settings have been updated',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save payday settings',
        color: 'red'
      })
      throw err
    }
  }

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      styles={{
        header: { backgroundColor: '#16213e', borderBottom: '1px solid #3730a3' }
      }}
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            <Group>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
              <IconSettings size={28} color="#174ae4" />
              <Title order={2} c="navy.7" fw={700}>Settings</Title>
            </Group>
            <Group gap="md">
              <Group gap="xs">
                <Avatar size={32} color="financial" radius="xl">
                  <IconUser size={18} />
                </Avatar>
                <div>
                  <Text size="sm" fw={500}>{user.email?.split('@')[0]}</Text>
                </div>
              </Group>
              <Divider orientation="vertical" size="sm" />
              <Tooltip label="Sign out">
                <ActionIcon
                  variant="light"
                  color="red"
                  size="lg"
                  onClick={handleLogout}
                >
                  <IconLogout size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Stack gap="xl">
            {/* Header Card */}
            <Card withBorder radius="lg" p="xl" bg="gray.0">
              <Group>
                <IconSettings size={32} color="#4f46e5" />
                <div>
                  <Title order={1} c="gray.8" fw={700}>Account Settings</Title>
                  <Text c="dimmed" size="md">
                    Manage your preferences and notification settings
                  </Text>
                </div>
              </Group>
            </Card>

            {/* Settings Categories */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              
              {/* Payday Reminders */}
              <Card withBorder radius="lg" p="xl" bg="blue.0" style={{ borderColor: '#3730a3' }}>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group mb="sm">
                        <IconPigMoney size={24} color="#174ae4" />
                        <Title order={3} c="navy.8" fw={700}>Payday Reminders</Title>
                        {paydayConfig?.enabled ? (
                          <Badge variant="light" color="green" size="sm">Enabled</Badge>
                        ) : (
                          <Badge variant="light" color="gray" size="sm">Disabled</Badge>
                        )}
                      </Group>
                      <Text c="dimmed" size="sm" maw={400}>
                        Get reminded to allocate funds to your savings goals before each payday. 
                        Set your payday date and savings targets.
                      </Text>
                      
                      {paydayConfig?.enabled && (
                        <Stack gap="xs" mt="sm">
                          <Text size="xs" c="dimmed">
                            <strong>Next payday:</strong> {paydayConfig.payday_date}{paydayConfig.payday_date === 1 ? 'st' : paydayConfig.payday_date === 2 ? 'nd' : paydayConfig.payday_date === 3 ? 'rd' : 'th'} of the month
                          </Text>
                          <Text size="xs" c="dimmed">
                            <strong>Reminder:</strong> {paydayConfig.reminder_days_before} days before
                          </Text>
                          {paydayConfig.savings_targets && paydayConfig.savings_targets.length > 0 && (
                            <Text size="xs" c="dimmed">
                              <strong>Savings targets:</strong> {paydayConfig.savings_targets.length} configured
                            </Text>
                          )}
                        </Stack>
                      )}
                    </div>
                  </Group>
                  
                  <Group justify="flex-end">
                    <Button
                      leftSection={<IconPigMoney size={18} />}
                      onClick={() => setShowPaydayForm(true)}
                      variant="gradient"
                      gradient={{ from: 'navy.6', to: 'navy.8' }}
                      radius="lg"
                    >
                      {paydayConfig?.enabled ? 'Edit Settings' : 'Setup Reminders'}
                    </Button>
                  </Group>
                </Stack>
              </Card>

              {/* Budget Reset */}
              <Card withBorder radius="lg" p="xl" bg="orange.0" style={{ borderColor: '#ea580c' }}>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group mb="sm">
                        <IconRefresh size={24} color="#ea580c" />
                        <Title order={3} c="orange.8" fw={700}>Budget Reset</Title>
                        {budgetResetSettings?.auto_reset_enabled ? (
                          <Badge variant="light" color="green" size="sm">Auto Reset On</Badge>
                        ) : (
                          <Badge variant="light" color="orange" size="sm">Manual</Badge>
                        )}
                      </Group>
                      <Text c="dimmed" size="sm" maw={400}>
                        Reset your budgets monthly with the option to carry over unspent funds from 
                        discretionary categories to next month.
                      </Text>
                      
                      {budgetResetSettings && (
                        <Stack gap="xs" mt="sm">
                          <Text size="xs" c="dimmed">
                            <strong>Reset day:</strong> {budgetResetSettings.reset_day}{budgetResetSettings.reset_day === 1 ? 'st' : budgetResetSettings.reset_day === 2 ? 'nd' : budgetResetSettings.reset_day === 3 ? 'rd' : 'th'} of each month
                          </Text>
                          <Text size="xs" c="dimmed">
                            <strong>Carry-over:</strong> {budgetResetSettings.carry_over_enabled ? 'Enabled' : 'Disabled'}
                          </Text>
                          {budgetResetSettings.carry_over_categories && budgetResetSettings.carry_over_categories.length > 0 && (
                            <Text size="xs" c="dimmed">
                              <strong>Carry-over categories:</strong> {budgetResetSettings.carry_over_categories.length} selected
                            </Text>
                          )}
                        </Stack>
                      )}
                    </div>
                  </Group>
                  
                  <Group justify="flex-end">
                    <Button
                      leftSection={<IconRefresh size={18} />}
                      onClick={() => setShowBudgetReset(true)}
                      variant="gradient"
                      gradient={{ from: 'orange.6', to: 'orange.8' }}
                      radius="lg"
                    >
                      Configure Reset
                    </Button>
                  </Group>
                </Stack>
              </Card>

              {/* Account Settings */}
              <Card withBorder radius="lg" p="xl" bg="purple.0" style={{ borderColor: '#7c3aed' }}>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group mb="sm">
                        <IconUser size={24} color="#7c3aed" />
                        <Title order={3} c="purple.8" fw={700}>Account Settings</Title>
                        <Badge variant="light" color="purple" size="sm">Coming Soon</Badge>
                      </Group>
                      <Text c="dimmed" size="sm" maw={400}>
                        Update your profile information, change password, and manage your 
                        account security settings.
                      </Text>
                    </div>
                  </Group>
                  
                  <Group justify="flex-end">
                    <Button
                      leftSection={<IconUser size={18} />}
                      variant="light"
                      color="purple"
                      radius="lg"
                      disabled
                    >
                      Manage Account
                    </Button>
                  </Group>
                </Stack>
              </Card>

              {/* Data Export */}
              <Card withBorder radius="lg" p="xl" bg="teal.0" style={{ borderColor: '#14b8a6' }}>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group mb="sm">
                        <IconDownload size={24} color="#14b8a6" />
                        <Title order={3} c="teal.8" fw={700}>Data Export</Title>
                        <Badge variant="light" color="teal" size="sm">CSV Format</Badge>
                      </Group>
                      <Text c="dimmed" size="sm" maw={400}>
                        Export your financial data to CSV files for analysis, backup, or migration to other tools. 
                        All data remains private and secure.
                      </Text>
                      
                      <Stack gap="xs" mt="sm">
                        <Text size="xs" c="dimmed">
                          <strong>Available:</strong> Expenses, Budgets, Recurring Transactions, Categories
                        </Text>
                        <Text size="xs" c="dimmed">
                          <strong>Format:</strong> CSV files compatible with Excel and Google Sheets
                        </Text>
                        <Text size="xs" c="dimmed">
                          <strong>Security:</strong> Data exported locally, never sent to external servers
                        </Text>
                      </Stack>
                    </div>
                  </Group>
                  
                  <Group justify="flex-end">
                    <Button
                      leftSection={<IconDownload size={18} />}
                      onClick={() => setShowDataExport(true)}
                      variant="gradient"
                      gradient={{ from: 'teal.6', to: 'teal.8' }}
                      radius="lg"
                    >
                      Export Data
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </SimpleGrid>
          </Stack>
        </Container>

        {/* Payday Reminder Form Modal */}
        <PaydayReminderForm
          opened={showPaydayForm}
          onClose={() => setShowPaydayForm(false)}
          onSave={handleSavePaydayConfig}
          existingConfig={paydayConfig}
        />

        {/* Budget Reset Modal */}
        <BudgetResetModal
          opened={showBudgetReset}
          onClose={() => setShowBudgetReset(false)}
          onResetComplete={(data) => {
            console.log('Budget reset completed:', data)
            loadBudgetResetSettings() // Refresh settings
          }}
        />

        {/* Data Export Modal */}
        <DataExportModal
          opened={showDataExport}
          onClose={() => setShowDataExport(false)}
          onExportComplete={(data) => {
            console.log('Data export completed:', data)
          }}
        />
      </AppShell.Main>
    </AppShell>
  )
}

export default SettingsPage