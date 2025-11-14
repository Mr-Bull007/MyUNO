import {
  Container,
  Stack,
  Group,
  Button,
  Text,
  Card,
  Badge,
  Grid,
  Loader,
  Center,
} from "@mantine/core"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"
import { GameBoard } from "src/components/GameBoard"
import { PlayerHand } from "src/components/PlayerHand"

export default function GamePage() {
  const router = useRouter()
  const { id } = router.query
  const user = useCurrentUser()
  const [gameState, setGameState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCurrentPlayer, setIsCurrentPlayer] = useState(false)

  // Fetch game state
  useEffect(() => {
    if (!id) return

    const fetchGameState = async () => {
      try {
        const res = await fetch(`/api/games/getGameState?gameId=${id}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error)
        }

        setGameState(data)

        // Check if it's current player's turn
        const currentPlayer = data.players[data.currentPlayerIndex]
        setIsCurrentPlayer(currentPlayer?.userId === user?.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load game")
      } finally {
        setLoading(false)
      }
    }

    void fetchGameState()

    // Poll every 2 seconds for updates
    const interval = setInterval(() => {
      void fetchGameState()
    }, 2000)
    return () => clearInterval(interval)
  }, [id, user?.id])

  if (loading) {
    return (
      <Center style={{ minHeight: "100vh" }}>
        <Loader />
      </Center>
    )
  }

  if (error) {
    return (
      <Container py="xl">
        <Text color="red">Error: {error}</Text>
        <Button onClick={() => void router.push("/")}>Back to Home</Button>
      </Container>
    )
  }

  if (!gameState) {
    return (
      <Container py="xl">
        <Text>Game not found</Text>
      </Container>
    )
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const currentPlayerInfo = gameState.players.find((p) => p.userId === user?.id)
  const opponent = gameState.players.find((p) => p.userId !== user?.id)

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Game Status */}
        <Group justify="space-between">
          <div>
            <Text size="sm" color="dimmed">
              Game ID: {gameState.id}
            </Text>
            <Badge>{gameState.status}</Badge>
          </div>
          <Button variant="default" size="sm" onClick={() => void router.push("/")}>
            Leave
          </Button>
        </Group>

        {gameState.status === "finished" && (
          <Card p="lg" radius="md" withBorder style={{ background: "#fffacd" }}>
            <Text weight={500} size="lg">
              🎉 Game Over!
            </Text>
            <Text>
              {gameState.winner === currentPlayerInfo?.playerIndex ? "🏆 You Won!" : "😢 You Lost"}
            </Text>
            <Button mt="md" onClick={() => void router.push("/")}>
              Play Again
            </Button>
          </Card>
        )}

        {/* Game Board */}
        <GameBoard gameState={gameState} />

        {/* Current Turn Indicator */}
        <Card p="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="sm" color="dimmed">
                Current Turn
              </Text>
              <Text weight={500}>
                {isCurrentPlayer
                  ? "👉 Your Turn!"
                  : `${currentPlayer?.user?.name || "Player"}'s Turn`}
              </Text>
            </div>
            <Badge color={isCurrentPlayer ? "green" : "gray"}>
              {currentPlayer?.hand?.length || 0} cards
            </Badge>
          </Group>
        </Card>

        {/* Player Hand */}
        {currentPlayerInfo && (
          <PlayerHand
            gameId={gameState.id}
            hand={currentPlayerInfo.hand}
            isCurrentPlayer={isCurrentPlayer}
            currentColor={gameState.currentColor}
            currentNumber={gameState.currentNumber}
          />
        )}

        {/* Draw Button */}
        {isCurrentPlayer && gameState.status === "active" && (
          <Button
            fullWidth
            onClick={() => {
              // Call drawCard API
              fetch("/api/games/drawCard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: gameState.id, userId: user?.id }),
              }).catch((err) => setError(err.message))
            }}
          >
            Draw Card
          </Button>
        )}
      </Stack>
    </Container>
  )
}
