import { Container, Button, Stack, Title, Text, Paper, Group } from "@mantine/core"
import { useRouter } from "next/router"

export default function Home() {
  const router = useRouter()

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl" align="center" justify="center" style={{ minHeight: "100vh" }}>
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
