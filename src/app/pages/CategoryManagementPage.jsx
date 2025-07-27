import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppShell,
  Title,
  Group,
  Button,
  Text,
  Container,
  Stack,
  Loader,
  Center,
  Card,
  Badge,
  ActionIcon,
  Avatar,
  Tooltip,
  Divider
} from '@mantine/core'
import { IconLogout, IconPlus, IconWallet, IconCategory, IconUser, IconArrowLeft } from '@tabler/icons-react'
import { authService } from 'src/domains/authentication/services/AuthService'
import CategoryForm from 'src/domains/category-management/components/CategoryForm'
import CategoriesList from 'src/domains/category-management/components/CategoriesList'

function CategoryManagementPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [refreshCategories, setRefreshCategories] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { session, error } = await authService.getSession()
        if (error || !session) {
          navigate('/login')
        } else {
          setUser(session.user)
        }
        setLoading(false)
      } catch (err) {
        console.error('Auth check error:', err)
        setLoading(false)
        navigate('/login')
      }
    }

    checkAuth()

    const subscription = authService.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
        navigate('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const handleLogout = async () => {
    const { error } = await authService.signOut()
    if (error) {
      console.error('Error logging out:', error)
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
              <IconWallet size={28} color="#174ae4" />
              <Title order={2} c="navy.7" fw={700}>Financial Planner</Title>
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
            <Card withBorder radius="lg" p="xl" bg="purple.1" style={{ borderColor: '#5b21b6' }}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group mb="sm">
                    <ActionIcon
                      variant="light"
                      color="gray"
                      size="lg"
                      onClick={() => navigate('/')}
                    >
                      <IconArrowLeft size={18} />
                    </ActionIcon>
                    <IconCategory size={24} color="#7a33ff" />
                    <Title order={1} c="purple.8" fw={700}>Category Management</Title>
                    <Badge variant="light" color="purple" size="sm">Custom Categories</Badge>
                  </Group>
                  <Text c="dimmed" size="md" maw={500}>
                    Create and manage your custom spending categories like Flying, Meals Out, Coffee, and more. 
                    Organize your finances the way that works for your lifestyle.
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => setShowAddCategory(true)}
                  size="lg"
                  radius="lg"
                  variant="gradient"
                  gradient={{ from: 'purple.6', to: 'purple.8' }}
                >
                  Add Category
                </Button>
              </Group>
            </Card>

            {showAddCategory && (
              <CategoryForm
                onCategoryAdded={(category) => {
                  setRefreshCategories(prev => prev + 1)
                  setShowAddCategory(false)
                }}
                onCancel={() => setShowAddCategory(false)}
              />
            )}

            <CategoriesList
              refreshTrigger={refreshCategories}
            />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default CategoryManagementPage