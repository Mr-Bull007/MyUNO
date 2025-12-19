import db from "db"
import { playCard, drawCards, getValidCards } from "../../../game-engine/uno-logic"
import type { GameState, Card, CardColor } from "../../../game-engine/utils"

export default async function aiMove(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { gameId } = req.body

    if (!gameId) {
      return res.status(400).json({ error: "gameId required" })
    }

    // Convert gameId to integer (it comes as string from URL params)
    const gameIdInt = typeof gameId === "string" ? parseInt(gameId, 10) : gameId

    if (isNaN(gameIdInt)) {
      return res.status(400).json({ error: "Invalid gameId" })
    }

    const game = await db.gameSession.findUnique({
      where: { id: gameIdInt },
      include: { players: true },
    })

    if (!game) {
      return res.status(404).json({ error: "Game not found" })
    }

    if (game.status !== "active") {
      return res.status(400).json({ error: "Game is not active" })
    }

    // Check if current player is AI (userId is null)
    const currentPlayer = game.players[game.currentPlayerIndex]
    if (!currentPlayer) {
      return res.status(400).json({ error: "Current player not found" })
    }

    if (currentPlayer.userId !== null) {
      return res.status(400).json({ error: "Not AI's turn" })
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

    const aiHand = gameState.players[gameState.currentPlayerIndex].hand
    const validCards = getValidCards(aiHand, gameState.currentColor, gameState.currentNumber)

    let newState: GameState

    // AI Strategy: Play first valid card, or draw if none
    if (validCards.length > 0) {
      // Play the first valid card
      const cardToPlay = validCards[0]
      let chosenColor: CardColor | undefined

      // For wild cards, choose a random color (prefer colors in hand)
      if (cardToPlay.type === "wild" || cardToPlay.type === "wilddraw4") {
        const colorsInHand = aiHand.map((c) => c.color).filter((c) => c !== "wild") as CardColor[]
        if (colorsInHand.length > 0) {
          chosenColor = colorsInHand[Math.floor(Math.random() * colorsInHand.length)]
        } else {
          const colors: CardColor[] = ["red", "yellow", "green", "blue"]
          chosenColor = colors[Math.floor(Math.random() * colors.length)]
        }
      }

      newState = playCard(gameState, cardToPlay.id, chosenColor)
    } else {
      // No valid cards, draw a card
      const count = gameState.drawCount > 0 ? gameState.drawCount : 1
      newState = drawCards(gameState, count)
    }

    // Update database
    await db.gameSession.update({
      where: { id: gameIdInt },
      data: {
        deck: JSON.stringify(newState.deck),
        discardPile: JSON.stringify(newState.discardPile),
        currentPlayerIndex: newState.currentPlayerIndex,
        direction: newState.direction,
        drawCount: newState.drawCount,
        currentColor: newState.currentColor,
        currentNumber: newState.currentNumber,
        status: newState.gameStatus,
        winner: newState.winner,
        players: {
          updateMany: newState.players.map((p, idx) => ({
            where: { gameId: gameIdInt, playerIndex: idx },
            data: { hand: JSON.stringify(p.hand) },
          })),
        },
      },
    })

    return res.status(200).json({
      success: true,
      gameStatus: newState.gameStatus,
      winner: newState.winner,
      currentPlayerIndex: newState.currentPlayerIndex,
    })
  } catch (error) {
    console.error("Error making AI move:", error)
    return res.status(500).json({ error: "Failed to make AI move" })
  }
}
