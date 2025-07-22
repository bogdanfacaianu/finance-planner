import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Center,
  Group
} from '@mantine/core'
import { IconInfoCircle, IconLock, IconMail } from '@tabler/icons-react'
import { authService } from 'src/domains/authentication/services/AuthService'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const navigate = useNavigate()

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await authService.resetPassword({
        email: resetEmail,
        redirectTo: `${window.location.origin}/finance-planner`
      })

      if (error) {
        setError(error)
      } else {
        setMessage('Password reset email sent! Check your inbox.')
        setShowResetForm(false)
        setResetEmail('')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await authService.signIn({ email, password })

      if (error) {
        setError(error)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Center mih="100vh">
      <Container size="xs" px="lg">
        <Stack gap="xl">
          <div>
            <Title ta="center" order={2} mb="xs" c="navy.8">
              💰 Financial Planner
            </Title>
            <Text ta="center" c="dimmed" size="sm">
              Sign in to your account
            </Text>
          </div>

          <Paper withBorder shadow="md" p="xl" radius="md" bg="navy.1" style={{ borderColor: '#3730a3' }}>
            {showResetForm ? (
              <form onSubmit={handlePasswordReset}>
                <Stack gap="md">
                  <div>
                    <Title order={4} mb="xs">Reset Password</Title>
                    <Text size="sm" c="dimmed">
                      Enter your email address and we'll send you a link to reset your password.
                    </Text>
                  </div>

                  {error && (
                    <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
                      {error}
                    </Alert>
                  )}

                  {message && (
                    <Alert icon={<IconInfoCircle size={16} />} color="green" variant="light">
                      {message}
                    </Alert>
                  )}

                  <TextInput
                    label="Email address"
                    placeholder="your@email.com"
                    leftSection={<IconMail size={16} />}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />

                  <Group grow>
                    <Button
                      type="submit"
                      loading={loading}
                      fullWidth
                    >
                      Send Reset Email
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => {
                        setShowResetForm(false)
                        setError('')
                        setMessage('')
                        setResetEmail('')
                      }}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
                <Stack gap="md">
                  {error && (
                    <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
                      {error}
                    </Alert>
                  )}

                  {message && (
                    <Alert icon={<IconInfoCircle size={16} />} color="green" variant="light">
                      {message}
                    </Alert>
                  )}

                  <TextInput
                    label="Email address"
                    placeholder="your@email.com"
                    leftSection={<IconMail size={16} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    leftSection={<IconLock size={16} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <Button
                    type="submit"
                    loading={loading}
                    fullWidth
                    size="md"
                  >
                    Sign in
                  </Button>

                  <Center>
                    <Anchor
                      size="sm"
                      onClick={() => setShowResetForm(true)}
                      style={{ cursor: 'pointer' }}
                    >
                      Forgot your password?
                    </Anchor>
                  </Center>
                </Stack>
              </form>
            )}
          </Paper>
        </Stack>
      </Container>
    </Center>
  )
}

export default LoginPage