import { useCurrentUser } from "src/users/hooks/useCurrentUser"
import { Container, Button, Stack, Title, Text, TextInput, Alert } from "@mantine/core"
import { useRouter } from "next/router"
import { useState } from "react"
import { useForm } from "react-hook-form"

export default function NewGame() {
  const router = useRouter()
  const user = useCurrentUser()
  const gameType = router.query.type as string
  const [loading, setLoading] = useState(false)
  const [gameId, setGameId] = useState<number | null>(null)
  const [passcode, setPasscode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm()

  const handleCreateGame = async () => {
    if (!user?.id) {
      setError("Please log in first")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/games/createGame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          gameType: gameType || "ai",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create game")
      }

      setGameId(data.gameId)
      setPasscode(data.passcode)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGame = async (formData: { passcode: string }) => {
    if (!user?.id) {
      setError("Please log in first")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/games/joinGame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          passcode: formData.passcode.toUpperCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to join game")
      }

      setGameId(data.gameId)
      void router.push(`/games/${data.gameId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red">Please log in to play</Alert>
      </Container>
    )
  }

  if (gameId && passcode) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="xl" align="center">
          <Title order={2}>Game Created!</Title>

          <Text size="lg" weight={500}>
            Share this passcode with your friend:
          </Text>

          <div
            style={{
              fontSize: 48,
              fontWeight: "bold",
              letterSpacing: 8,
              padding: 20,
              background: "#f0f0f0",
              borderRadius: 8,
              fontFamily: "monospace",
            }}
          >
            {passcode}
          </div>

          <Text size="sm" color="dimmed" align="center">
            Waiting for player 2 to join...
          </Text>

          <Button
            onClick={() => router.push(`/games/${gameId}`)}
            loading={loading}
            style={{ marginTop: 20 }}
          >
            Start Game
          </Button>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Button variant="default" onClick={() => router.push("/")}>
          ← Back
        </Button>

        {error && <Alert color="red">{error}</Alert>}

        {gameType === "online" ? (
          <>
            <div style={{ textAlign: "center" }}>
              <Title order={2} mb="md">
                Play Online
              </Title>
              <Text color="dimmed">Create a game or join an existing one</Text>
            </div>

            <Stack gap="md">
              <div>
                <Text size="sm" weight={500} mb="md">
                  Create New Game
                </Text>
                <Button fullWidth onClick={handleCreateGame} loading={loading} disabled={loading}>
                  Create Game & Get Passcode
                </Button>
              </div>

              <div style={{ textAlign: "center", color: "#999" }}>— OR —</div>

              <form onSubmit={handleSubmit(handleJoinGame)}>
                <Stack gap="md">
                  <div>
                    <Text size="sm" weight={500} mb="md">
                      Join Existing Game
                    </Text>
                    <TextInput
                      placeholder="Enter passcode"
                      {...register("passcode", { required: true })}
                      disabled={loading}
                      style={{ textTransform: "uppercase" }}
                    />
                  </div>

                  <Button type="submit" loading={loading} disabled={loading} fullWidth>
                    Join Game
                  </Button>
                </Stack>
              </form>
            </Stack>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center" }}>
              <Title order={2} mb="md">
                Play vs AI
              </Title>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={handleCreateGame}
              loading={loading}
              disabled={loading}
            >
              Start Game
            </Button>
          </>
        )}
      </Stack>
    </Container>
  )
}
