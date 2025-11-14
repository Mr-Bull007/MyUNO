import db from "db"
import { playCard } from "../../../game-engine/uno-logic"
import type { GameState, Card, CardColor } from "../../../game-engine/utils"

export default async function playingCard(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { gameId, cardId, chosenColor, userId } = req.body

    if (!gameId || !cardId) {
      return res.status(400).json({ error: "gameId and cardId required" })
    }

    const game = await db.gameSession.findUnique({
      where: { id: gameId },
      include: { players: true },
    })

    if (!game) {
      return res.status(404).json({ error: "Game not found" })
    }

    if (game.status !== "active") {
      return res.status(400).json({ error: "Game is not active" })
    }

    // Verify it's the current player's turn
    const currentPlayer = game.players[game.currentPlayerIndex]
    if (!currentPlayer) {
      return res.status(403).json({ error: "Not in this game" })
    }
    if (currentPlayer.userId !== userId) {
      return res.status(403).json({ error: "Not your turn" })
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

    // Play the card
    const newState = playCard(gameState, cardId, chosenColor)

    // Update database
    const updatedGame = await db.gameSession.update({
      where: { id: gameId },
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
            where: { gameId: gameId, playerIndex: idx },
            data: { hand: JSON.stringify(p.hand) },
          })),
        },
      },
      include: { players: true },
    })

    // Log the move
    await db.move.create({
      data: {
        gameId,
        playerId: userId,
        cardPlayed: cardId,
        action: "play",
      },
    })

    return res.status(200).json({
      success: true,
      gameStatus: newState.gameStatus,
      winner: newState.winner,
      currentPlayerIndex: newState.currentPlayerIndex,
    })
  } catch (error) {
    console.error("Error playing card:", error)
    return res.status(500).json({ error: "Failed to play card" })
  }
}
