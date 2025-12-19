import { Container, Button, Stack, Title, Text, Paper, Group } from "@mantine/core"
import { useRouter } from "next/router"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"
import { Routes } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import logout from "src/auth/mutations/logout"

export default function Home() {
  const router = useRouter()
  const user = useCurrentUser()
  const [logoutMutation] = useMutation(logout)

  const handleLogout = async () => {
    await logoutMutation()
    void router.push("/")
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl" align="center" justify="center" style={{ minHeight: "100vh" }}>
        {/* User Info / Auth Buttons */}
        <Group justify="space-between" style={{ width: "100%", marginBottom: "auto" }}>
          {user ? (
            <Group gap="md">
              <Text weight={500} size="lg">
                Welcome, {user.name || user.email}!
              </Text>
              <Button variant="subtle" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </Group>
          ) : (
            <Group gap="sm" style={{ marginLeft: "auto" }}>
              <Button variant="subtle" size="sm" onClick={() => router.push(Routes.LoginPage())}>
                Login
              </Button>
              <Button variant="light" size="sm" onClick={() => router.push(Routes.SignupPage())}>
                Sign Up
              </Button>
            </Group>
          )}
        </Group>

        <div style={{ textAlign: "center" }}>
          <Title order={1} size="h1" mb="md">
            🎮 UNO Game
          </Title>
          <Text size="lg" color="dimmed" mb="xl">
            Challenge your friends or play against AI
          </Text>
        </div>

        <Stack gap="md" style={{ width: "100%", maxWidth: 300 }}>
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push("/games/new?type=online")}
            color="blue"
          >
            Play Online with Friend
          </Button>

          <Button
            size="lg"
            fullWidth
            onClick={() => router.push("/games/new?type=ai")}
            color="green"
          >
            Play vs AI
          </Button>
        </Stack>

        <Paper p="md" radius="md" withBorder style={{ marginTop: "auto" }}>
          <Text size="sm" color="dimmed">
            📱 Play on your phone • 👥 2 players • 🎯 No setup required
          </Text>
        </Paper>
      </Stack>
    </Container>
  )
}
