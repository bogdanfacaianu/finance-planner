import { useState } from 'react'
import {
  Card,
  Title,
  Text,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Alert,
  Loader,
  ColorSwatch,
  Grid,
  ActionIcon,
  Box
} from '@mantine/core'
import { IconAlertCircle, IconCheck, IconX, IconCategory } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { categoryService } from 'src/domains/category-management/services/CategoryService'
import { 
  DEFAULT_CATEGORY_COLORS, 
  DEFAULT_CATEGORY_ICONS 
} from 'src/domains/category-management/types'

function CategoryForm({ category = null, onCategoryAdded, onCancel }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || 'blue',
    icon: category?.icon || 'Category'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!category

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      let result
      if (isEditing) {
        result = await categoryService.updateCategory(category.id, formData)
      } else {
        result = await categoryService.createCategory(formData)
      }

      if (result.error) {
        setError(result.error)
      } else {
        notifications.show({
          title: `Category ${isEditing ? 'updated' : 'created'}`,
          message: `"${formData.name}" has been ${isEditing ? 'updated' : 'created'} successfully`,
          color: 'green',
          icon: <IconCheck size={16} />
        })
        
        if (onCategoryAdded) {
          onCategoryAdded(result.data)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }))
  }

  const handleIconSelect = (icon) => {
    setFormData(prev => ({ ...prev, icon }))
  }

  return (
    <Card withBorder radius="lg" p="xl">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group>
            <IconCategory size={24} color="#7a33ff" />
            <Title order={3} c="purple.8">
              {isEditing ? 'Edit Category' : 'Add New Category'}
            </Title>
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

          <TextInput
            label="Category Name"
            placeholder="e.g., Flying, Meals Out, Coffee"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            maxLength={50}
            description="Choose a descriptive name for your spending category"
          />

          <div>
            <Text size="sm" fw={500} mb="xs">Color</Text>
            <Text size="xs" c="dimmed" mb="sm">Select a color to help identify this category</Text>
            <Grid>
              {DEFAULT_CATEGORY_COLORS.map((color) => (
                <Grid.Col key={color} span="auto">
                  <ColorSwatch
                    color={`var(--mantine-color-${color}-6)`}
                    size={30}
                    style={{ 
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid #7a33ff' : '2px solid transparent'
                    }}
                    onClick={() => handleColorSelect(color)}
                  />
                </Grid.Col>
              ))}
            </Grid>
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">Icon</Text>
            <Text size="xs" c="dimmed" mb="sm">Choose an icon to represent this category</Text>
            <Grid>
              {DEFAULT_CATEGORY_ICONS.map((iconName) => (
                <Grid.Col key={iconName} span="auto">
                  <ActionIcon
                    variant={formData.icon === iconName ? 'filled' : 'light'}
                    color={formData.icon === iconName ? 'purple' : 'gray'}
                    size="lg"
                    onClick={() => handleIconSelect(iconName)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box style={{ fontSize: '16px' }}>
                      {iconName.slice(0, 2).toUpperCase()}
                    </Box>
                  </ActionIcon>
                </Grid.Col>
              ))}
            </Grid>
            <Text size="xs" c="dimmed" mt="xs">
              Selected: {formData.icon}
            </Text>
          </div>

          <Group justify="flex-end" mt="lg">
            <Button
              variant="light"
              color="gray"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftSection={loading ? <Loader size={16} /> : <IconCheck size={16} />}
              variant="gradient"
              gradient={{ from: 'purple.6', to: 'purple.8' }}
            >
              {isEditing ? 'Update Category' : 'Create Category'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  )
}

export default CategoryForm