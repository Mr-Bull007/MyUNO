import db from "db"

export default async function getGameState(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { gameId } = req.query

    if (!gameId) {
      return res.status(400).json({ error: "gameId required" })
    }

    const game = await db.gameSession.findUnique({
      where: { id: parseInt(gameId as string) },
      include: {
        players: {
          include: { user: true },
        },
      },
    })

    if (!game) {
      return res.status(404).json({ error: "Game not found" })
    }

    // Parse JSON fields
    const gameState = {
      id: game.id,
      passcode: game.passcode,
      status: game.status,
      gameType: game.gameType,
      currentPlayerIndex: game.currentPlayerIndex,
      direction: game.direction,
      currentColor: game.currentColor,
      currentNumber: game.currentNumber,
      drawCount: game.drawCount,
      winner: game.winner,
      deck: JSON.parse(game.deck),
      discardPile: JSON.parse(game.discardPile),
      players: game.players.map((p) => ({
        id: p.id,
        userId: p.userId,
        playerIndex: p.playerIndex,
        hand: JSON.parse(p.hand),
        user: p.user,
      })),
    }

    return res.status(200).json(gameState)
  } catch (error) {
    console.error("Error fetching game state:", error)
    return res.status(500).json({ error: "Failed to fetch game state" })
  }
}
