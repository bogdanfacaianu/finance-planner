import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Alert,
  Loader,
  Center,
  Badge,
  ActionIcon,
  TextInput,
  Switch,
  Grid,
  ColorSwatch,
  Modal,
  Button,
  Box
} from '@mantine/core'
import { IconAlertCircle, IconEdit, IconTrash, IconSearch, IconCategory, IconCheck, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import { categoryService } from 'src/domains/category-management/services/CategoryService'
import CategoryForm from './CategoryForm'

function CategoriesList({ refreshTrigger = 0 }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [editingCategory, setEditingCategory] = useState(null)

  const loadCategories = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: categoriesError } = await categoryService.getCategories({
        is_active: showActiveOnly ? true : null,
        search: searchQuery || null
      })

      if (categoriesError) {
        setError(categoriesError)
      } else {
        setCategories(data || [])
      }
    } catch (err) {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [refreshTrigger, searchQuery, showActiveOnly])

  const handleEditCategory = (category) => {
    setEditingCategory(category)
  }

  const handleDeleteCategory = async (category) => {
    modals.openConfirmModal({
      title: 'Delete Category',
      children: (
        <Text size="sm">
          Are you sure you want to delete "{category.name}"? This action cannot be undone.
          The category will be hidden but preserved in your expense history.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { success, error } = await categoryService.deleteCategory(category.id)
        
        if (error) {
          notifications.show({
            title: 'Error',
            message: error,
            color: 'red',
            icon: <IconX size={16} />
          })
        } else {
          notifications.show({
            title: 'Category deleted',
            message: `"${category.name}" has been deleted`,
            color: 'green',
            icon: <IconCheck size={16} />
          })
          loadCategories()
        }
      }
    })
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchQuery || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesActiveFilter = !showActiveOnly || category.is_active
    return matchesSearch && matchesActiveFilter
  })

  if (loading) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading categories...</Text>
          </Stack>
        </Center>
      </Card>
    )
  }

  return (
    <>
      <Card withBorder radius="lg" p="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Group mb="sm">
                <IconCategory size={24} color="#7a33ff" />
                <Title order={3} c="purple.8">Your Categories</Title>
                <Badge variant="light" color="purple" size="sm">
                  {filteredCategories.length} categories
                </Badge>
              </Group>
              <Text c="dimmed" size="sm">
                Manage your custom spending categories
              </Text>
            </div>
          </Group>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <Group>
            <TextInput
              placeholder="Search categories..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Switch
              label="Active only"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.currentTarget.checked)}
            />
          </Group>

          {filteredCategories.length === 0 ? (
            <Card withBorder p="xl" radius="md" bg="gray.0">
              <Center>
                <Stack align="center" gap="md">
                  <IconCategory size={48} color="gray" />
                  <div style={{ textAlign: 'center' }}>
                    <Text fw={500} size="lg" c="dimmed">No categories found</Text>
                    <Text size="sm" c="dimmed">
                      {searchQuery 
                        ? `No categories match "${searchQuery}"`
                        : 'Create your first custom category to get started'
                      }
                    </Text>
                  </div>
                </Stack>
              </Center>
            </Card>
          ) : (
            <Grid>
              {filteredCategories.map((category) => (
                <Grid.Col key={category.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card 
                    withBorder 
                    radius="md" 
                    p="md" 
                    style={{ 
                      height: '100%',
                      opacity: category.is_active ? 1 : 0.6
                    }}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <Group gap="xs">
                          <ColorSwatch
                            color={`var(--mantine-color-${category.color}-6)`}
                            size={20}
                          />
                          <Box style={{ fontSize: '14px', fontWeight: 500 }}>
                            {category.icon}
                          </Box>
                        </Group>
                        <Group gap={4}>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      <div>
                        <Text fw={500} size="sm" lineClamp={2}>
                          {category.name}
                        </Text>
                        <Group gap="xs" mt={4}>
                          <Badge 
                            size="xs" 
                            variant="light" 
                            color={category.is_active ? 'green' : 'gray'}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge size="xs" variant="outline" color={category.color}>
                            {category.color}
                          </Badge>
                        </Group>
                      </div>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Card>

      <Modal
        opened={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
        size="lg"
      >
        {editingCategory && (
          <CategoryForm
            category={editingCategory}
            onCategoryAdded={() => {
              setEditingCategory(null)
              loadCategories()
            }}
            onCancel={() => setEditingCategory(null)}
          />
        )}
      </Modal>
    </>
  )
}

export default CategoriesList