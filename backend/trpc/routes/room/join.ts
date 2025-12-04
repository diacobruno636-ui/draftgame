import { publicProcedure } from "../../create-context";
import { z } from "zod";
import { rooms } from "../../rooms-store";

export default publicProcedure
  .input(z.object({
    roomCode: z.string(),
    playerName: z.string(),
  }))
  .mutation(({ input }) => {
    const room = rooms.get(input.roomCode);

    if (!room) {
      throw new Error("Sala no encontrada");
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error("Sala llena");
    }

    const playerId = `player-${Date.now()}-${Math.random()}`;
    room.players.push({
      id: playerId,
      name: input.playerName,
    });

    return {
      success: true,
      playerId,
      room: {
        id: room.id,
        players: room.players,
      },
    };
  });
