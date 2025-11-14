import { Stack, Group, Card as MantineCard, Text, Badge, Grid, Box } from "@mantine/core"
import { Card } from "./Card"

interface GameStateProps {
  gameState: any
}

export function GameBoard({ gameState }: GameStateProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const opponent = gameState.players.find((p) => p !== currentPlayer)

  const colorMap = {
    red: "#FF4444",
    yellow: "#FFDD00",
    green: "#44DD44",
    blue: "#4444FF",
    wild: "#333333",
  }

  const topCard = gameState.discardPile[gameState.discardPile.length - 1]

  return (
    <Stack gap="lg">
      {/* Opponent Info */}
      <MantineCard p="md" radius="md" withBorder style={{ background: "#f5f5f5" }}>
        <Group justify="space-between">
          <div>
            <Text size="sm" color="dimmed">
              Opponent
            </Text>
            <Text weight={500}>{opponent?.user?.name || "Player 2"}</Text>
          </div>
          <Badge size="lg">{opponent?.hand?.length || 0} cards</Badge>
        </Group>
      </MantineCard>

      {/* Game Deck Area */}
      <Grid>
        {/* Deck */}
        <Grid.Col span={6}>
          <div style={{ textAlign: "center" }}>
            <Text size="sm" color="dimmed" mb="md">
              Deck
            </Text>
            <Box
              style={{
                width: 100,
                height: 150,
                background: "#E8E8E8",
                border: "2px dashed #999",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <Text size="sm" color="dimmed">
                {gameState.deck?.length || 0}
              </Text>
            </Box>
          </div>
        </Grid.Col>

        {/* Discard Pile */}
        <Grid.Col span={6}>
          <div style={{ textAlign: "center" }}>
            <Text size="sm" color="dimmed" mb="md">
              Discard Pile
            </Text>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {topCard && <Card card={topCard} size="lg" />}
            </div>
            <Text size="xs" color="dimmed" mt="md">
              {gameState.discardPile?.length || 0} cards
            </Text>
          </div>
        </Grid.Col>
      </Grid>

      {/* Current Color & Number */}
      <MantineCard p="md" radius="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text size="sm" color="dimmed">
              Current Color
            </Text>
            <Group gap={8}>
              <Box
                style={{
                  width: 24,
                  height: 24,
                  background: colorMap[gameState.currentColor] || "#999",
                  borderRadius: 4,
                }}
              />
              <Text weight={500}>{gameState.currentColor?.toUpperCase()}</Text>
            </Group>
          </div>
          {gameState.currentNumber !== undefined && (
            <div>
              <Text size="sm" color="dimmed">
                Current Number
              </Text>
              <Text weight={500} size="lg">
                {gameState.currentNumber}
              </Text>
            </div>
          )}
          {gameState.drawCount > 0 && (
            <div>
              <Text size="sm" color="dimmed">
                Draw Stack
              </Text>
              <Badge color="red" size="lg">
                +{gameState.drawCount}
              </Badge>
            </div>
          )}
        </Group>
      </MantineCard>

      {/* Direction Indicator */}
      <Text size="sm" color="dimmed" align="center">
        Direction: {gameState.direction === 1 ? "⏱️ Clockwise" : "⏲️ Counter-clockwise"}
      </Text>
    </Stack>
  )
}
