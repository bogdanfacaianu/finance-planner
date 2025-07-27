import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Progress,
  Grid,
  NumberFormatter,
  ColorSwatch,
  Alert,
  Center,
  Loader
} from '@mantine/core'
import { IconAlertCircle, IconChartPie, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react'

function CategoryProgressGrid({ categoryProgress, loading = false }) {
  if (loading) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading category progress...</Text>
          </Stack>
        </Center>
      </Card>
    )
  }

  if (!categoryProgress || categoryProgress.length === 0) {
    return (
      <Card withBorder radius="lg" p="xl">
        <Stack align="center" gap="md" py="xl">
          <IconChartPie size={48} color="gray" />
          <div style={{ textAlign: 'center' }}>
            <Text fw={500} size="lg" c="dimmed">No Budget Categories</Text>
            <Text size="sm" c="dimmed">
              Create some budgets to see your spending progress here
            </Text>
          </div>
        </Stack>
      </Card>
    )
  }

  // Group categories by group if they have one
  const groupedCategories = categoryProgress.reduce((groups, category) => {
    const group = category.category_group || 'Individual Categories'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(category)
    return groups
  }, {})

  const getStatusConfig = (status) => {
    switch (status) {
      case 'over_budget':
        return { color: 'red', label: 'Over Budget', icon: IconTrendingDown }
      case 'near_limit':
        return { color: 'yellow', label: 'Near Limit', icon: IconAlertCircle }
      case 'under_budget':
        return { color: 'green', label: 'Under Budget', icon: IconTrendingUp }
      default:
        return { color: 'gray', label: 'Unknown', icon: IconAlertCircle }
    }
  }

  const CategoryCard = ({ category }) => {
    const statusConfig = getStatusConfig(category.status)
    const StatusIcon = statusConfig.icon

    return (
      <Card withBorder radius="md" p="md" style={{ height: '100%' }}>
        <Stack gap="sm">
          {/* Category Header */}
          <Group justify="space-between" align="flex-start">
            <Group gap="xs">
              <ColorSwatch
                color={`var(--mantine-color-${category.color}-6)`}
                size={16}
              />
              <Text fw={500} size="sm" lineClamp={1}>
                {category.category}
              </Text>
            </Group>
            <Badge 
              variant="light" 
              color={statusConfig.color} 
              size="xs"
              leftSection={<StatusIcon size={10} />}
            >
              {statusConfig.label}
            </Badge>
          </Group>

          {/* Amount Progress */}
          <div>
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed">Spent</Text>
              <Text size="xs" c="dimmed">Target</Text>
            </Group>
            <Group justify="space-between" mb="xs">
              <NumberFormatter 
                value={category.current_spend} 
                prefix="£" 
                thousandSeparator="," 
                decimalScale={0}
                style={{ fontSize: '14px', fontWeight: 600 }}
              />
              <NumberFormatter 
                value={category.monthly_target} 
                prefix="£" 
                thousandSeparator="," 
                decimalScale={0}
                style={{ fontSize: '14px', fontWeight: 600 }}
              />
            </Group>
            <Progress 
              value={Math.min(category.percentage_used, 100)} 
              color={statusConfig.color}
              size="sm" 
              radius="lg"
            />
          </div>

          {/* Stats */}
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed">Used</Text>
              <Text size="sm" fw={600}>
                {category.percentage_used.toFixed(1)}%
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text size="xs" c="dimmed">Remaining</Text>
              <NumberFormatter 
                value={category.remaining_allowance} 
                prefix="£" 
                thousandSeparator="," 
                decimalScale={0}
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 600,
                  color: category.remaining_allowance >= 0 ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-red-6)'
                }}
              />
            </div>
          </Group>
        </Stack>
      </Card>
    )
  }

  return (
    <Card withBorder radius="lg" p="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group mb="sm">
              <IconChartPie size={24} color="#7a33ff" />
              <Title order={3} c="purple.8">Category Progress</Title>
              <Badge variant="light" color="purple" size="sm">
                {categoryProgress.length} categories
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              Track your spending progress across all budget categories
            </Text>
          </div>
        </Group>

        {/* Alert for over-budget categories */}
        {categoryProgress.some(cat => cat.status === 'over_budget') && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Budget Alert"
            color="red"
            variant="light"
          >
            You have {categoryProgress.filter(cat => cat.status === 'over_budget').length} categories 
            that are over budget this month.
          </Alert>
        )}

        {/* Categories by Group */}
        {Object.entries(groupedCategories).map(([groupName, categories]) => (
          <div key={groupName}>
            {groupName !== 'Individual Categories' && (
              <div style={{ marginBottom: '16px' }}>
                <Text fw={600} size="md" c="purple.7" mb="xs">
                  {groupName}
                </Text>
                <Text size="sm" c="dimmed">
                  {categories.length} categories in this group
                </Text>
              </div>
            )}
            
            <Grid>
              {categories.map((category) => (
                <Grid.Col key={category.category} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <CategoryCard category={category} />
                </Grid.Col>
              ))}
            </Grid>
          </div>
        ))}
      </Stack>
    </Card>
  )
}

export default CategoryProgressGrid