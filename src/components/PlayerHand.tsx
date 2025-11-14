import { Stack, Group, Button, Select, Text, Modal, Grid } from "@mantine/core"
import { useState } from "react"
import { Card as UnoCard } from "../game-engine/utils"
import { Card } from "./Card"
import { getValidCards } from "../game-engine/uno-logic"

interface PlayerHandProps {
  gameId: number
  hand: UnoCard[]
  isCurrentPlayer: boolean
  currentColor?: string
  currentNumber?: number
}

export function PlayerHand({
  gameId,
  hand,
  isCurrentPlayer,
  currentColor,
  currentNumber,
}: PlayerHandProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [choosingColor, setChoosingColor] = useState(false)
  const [chosenColor, setChosenColor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validCards = getValidCards(hand, currentColor as any, currentNumber)
  const selectedCard = hand.find((c) => c.id === selectedCardId)
  const isWildCard = selectedCard?.type === "wild" || selectedCard?.type === "wilddraw4"

  const handlePlayCard = async () => {
    if (!selectedCard) return

    if (isWildCard && !chosenColor) {
      setChoosingColor(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/games/playCard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          cardId: selectedCardId,
          chosenColor: chosenColor || selectedCard.color,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "Failed to play card")
        return
      }

      setSelectedCardId(null)
      setChosenColor(null)
      setChoosingColor(false)
    } catch (err) {
      alert("Error playing card")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="md">
      <Text size="sm" weight={500} color={isCurrentPlayer ? "green" : "dimmed"}>
        {isCurrentPlayer ? "👉 Your Hand" : "Your Cards"} ({hand.length})
      </Text>

      <Group gap="xs" style={{ overflowX: "auto", paddingBottom: 8 }}>
        {hand.map((card) => {
          const isValid = validCards.some((v) => v.id === card.id)
          const isSelected = card.id === selectedCardId

          return (
            <div key={card.id}>
              <Card
                card={card}
                isPlayable={isCurrentPlayer && (validCards.length === 0 || isValid)}
                selected={isSelected}
                size="md"
                onClick={() => {
                  if (isCurrentPlayer && (validCards.length === 0 || isValid)) {
                    setSelectedCardId(isSelected ? null : card.id)
                  }
                }}
              />
            </div>
          )
        })}
      </Group>

      {isCurrentPlayer && selectedCard && (
        <Group>
          <Button variant="default" onClick={() => setSelectedCardId(null)} disabled={loading}>
            Deselect
          </Button>
          <Button onClick={handlePlayCard} loading={loading} disabled={loading}>
            Play Card
          </Button>
        </Group>
      )}

      {/* Color chooser modal for wild cards */}
      <Modal
        opened={choosingColor}
        onClose={() => setChoosingColor(false)}
        title="Choose Color"
        centered
      >
        <Grid>
          {["red", "yellow", "green", "blue"].map((color) => (
            <Grid.Col span={6} key={color}>
              <Button
                fullWidth
                color={color}
                onClick={() => {
                  setChosenColor(color)
                  void handlePlayCard()
                }}
              >
                {color.toUpperCase()}
              </Button>
            </Grid.Col>
          ))}
        </Grid>
      </Modal>
    </Stack>
  )
}
