import { useState, useEffect } from 'react'
import { Paper, Text, Stack, Badge, Group, Title } from '@mantine/core'
import { supabase } from '../../infrastructure/supabase'

function SupabaseDebug() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Auth state change handled silently
        setSession(session)
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <Paper withBorder p="md" mt="xl" bg="gray.1">
      <Title order={5} mb="sm">🔧 Supabase Debug Panel</Title>
      <Stack gap="xs">
        <Group>
          <Text size="sm" fw={500}>Status:</Text>
          <Badge color={session ? 'green' : 'red'} variant="light">
            {session ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
        </Group>
        
        {user && (
          <>
            <Group>
              <Text size="sm" fw={500}>User ID:</Text>
              <Text size="xs" c="dimmed" family="monospace">{user.id}</Text>
            </Group>
            <Group>
              <Text size="sm" fw={500}>Email:</Text>
              <Text size="xs" c="dimmed">{user.email}</Text>
            </Group>
            <Group>
              <Text size="sm" fw={500}>Email Verified:</Text>
              <Badge color={user.email_confirmed_at ? 'green' : 'orange'} variant="light" size="xs">
                {user.email_confirmed_at ? 'Yes' : 'No'}
              </Badge>
            </Group>
          </>
        )}
        
        <Group>
          <Text size="sm" fw={500}>Supabase URL:</Text>
          <Text size="xs" c="dimmed" family="monospace" lineClamp={1}>
            {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
          </Text>
        </Group>
        
        <Group>
          <Text size="sm" fw={500}>Anon Key:</Text>
          <Text size="xs" c="dimmed" family="monospace">
            {import.meta.env.VITE_SUPABASE_ANON_KEY ? '***configured***' : 'Not configured'}
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}

export default SupabaseDebug