// src/pages/api/games/createGame.ts
import db from "db"
import { initializeGame, serializeGameState } from "../../../game-engine/uno-logic"

export default async function createGame(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { userId, gameType } = req.body

    if (!userId || !gameType) {
      return res.status(400).json({ error: "userId and gameType required" })
    }

    if (!["ai", "online"].includes(gameType)) {
      return res.status(400).json({ error: 'gameType must be "ai" or "online"' })
    }

    // Generate random 6-character passcode
    const passcode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Initialize game state
    const initialState = initializeGame(userId.toString(), gameType === "ai" ? "ai-bot" : "waiting")
    const gameStateJson = serializeGameState(initialState)
    const currentPlayer = initialState.players[0]
    if (!currentPlayer) {
      return res.status(400).json({ error: "Failed to initialize game" })
    }
    const secondPlayer = initialState.players[1]
    if (!secondPlayer) {
      return res.status(400).json({ error: "Failed to initialize game" })
    }
    // Create game in database
    const game = await db.gameSession.create({
      data: {
        passcode,
        gameType,
        status: gameType === "ai" ? "active" : "waiting",
        deck: JSON.stringify(initialState.deck),
        discardPile: JSON.stringify(initialState.discardPile),
        currentPlayerIndex: 0,
        direction: 1,
        currentColor: initialState.currentColor,
        currentNumber: initialState.currentNumber,
        players: {
          create: [
            {
              userId,
              playerIndex: 0,
              hand: JSON.stringify(currentPlayer.hand),
            },
            {
              userId: gameType === "ai" ? null : undefined, // AI bot gets null userId
              playerIndex: 1,
              hand: JSON.stringify(secondPlayer.hand),
            },
          ],
        },
      },
      include: {
        players: true,
      },
    })

    return res.status(201).json({
      gameId: game.id,
      passcode: game.passcode,
      gameType: game.gameType,
      message: gameType === "online" ? `Share this passcode: ${passcode}` : "Game created vs AI",
    })
  } catch (error) {
    console.error("Error creating game:", error)
    return res.status(500).json({ error: "Failed to create game" })
  }
}
