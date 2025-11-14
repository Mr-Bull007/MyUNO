import db from "db"
import { drawCards } from "../../../game-engine/uno-logic"
import type { GameState, Card, CardColor } from "../../../game-engine/utils"

export default async function drawCard(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { gameId, userId } = req.body

    if (!gameId) {
      return res.status(400).json({ error: "gameId required" })
    }

    const game = await db.gameSession.findUnique({
      where: { id: gameId },
      include: { players: true },
    })

    if (!game) {
      return res.status(404).json({ error: "Game not found" })
    }

    // Reconstruct game state
    const gameState: GameState = {
      deck: JSON.parse(game.deck) as Card[],
      discardPile: JSON.parse(game.discardPile) as Card[],
      players: game.players.map((p) => ({
        id: String(p.userId || "ai-bot"),
        hand: JSON.parse(p.hand) as Card[],
        hasCalledUno: false,
      })),
      currentPlayerIndex: game.currentPlayerIndex,
      direction: game.direction as 1 | -1,
      drawCount: game.drawCount,
      gameStatus: game.status as "active" | "finished",
      currentColor: game.currentColor as CardColor | undefined,
      currentNumber: game.currentNumber ?? undefined,
    }

    // Draw card(s) - if drawCount > 0, draw that many, else draw 1
    const count = game.drawCount > 0 ? game.drawCount : 1
    const newState = drawCards(gameState, count)

    // Update database
    await db.gameSession.update({
      where: { id: gameId },
      data: {
        deck: JSON.stringify(newState.deck),
        discardPile: JSON.stringify(newState.discardPile),
        currentPlayerIndex: newState.currentPlayerIndex,
        direction: newState.direction,
        drawCount: newState.drawCount,
        players: {
          updateMany: newState.players.map((p, idx) => ({
            where: { gameId: gameId, playerIndex: idx },
            data: { hand: JSON.stringify(p.hand) },
          })),
        },
      },
    })

    return res.status(200).json({
      success: true,
      cardsDrawn: count,
      currentPlayerIndex: newState.currentPlayerIndex,
    })
  } catch (error) {
    console.error("Error drawing card:", error)
    return res.status(500).json({ error: "Failed to draw card" })
  }
}
