import db from "db"

export default async function joinGame(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { userId, passcode } = req.body

    if (!userId || !passcode) {
      return res.status(400).json({ error: "userId and passcode required" })
    }

    // Find game by passcode
    const game = await db.gameSession.findUnique({
      where: { passcode },
      include: { players: true },
    })

    if (!game) {
      return res.status(404).json({ error: "Game not found" })
    }

    if (game.status !== "waiting") {
      return res.status(400).json({ error: "Game is not waiting for players" })
    }

    // Check if user is already in game
    const alreadyInGame = game.players.some((p) => p.userId === userId)
    if (alreadyInGame) {
      return res.status(400).json({ error: "You are already in this game" })
    }

    // Add second player
    const updatedGame = await db.gameSession.update({
      where: { id: game.id },
      data: {
        status: "active",
        players: {
          create: {
            userId,
            playerIndex: 1,
            hand: JSON.stringify(game?.players[1]?.hand), // Use the pre-dealt hand
          },
        },
      },
      include: { players: true },
    })

    return res.status(200).json({
      gameId: updatedGame.id,
      passcode: updatedGame.passcode,
      status: updatedGame.status,
      message: "Successfully joined game!",
    })
  } catch (error) {
    console.error("Error joining game:", error)
    return res.status(500).json({ error: "Failed to join game" })
  }
}
