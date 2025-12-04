import { publicProcedure } from "../../create-context";
import { z } from "zod";
import { rooms } from "../../rooms-store";

export default publicProcedure
  .input(z.object({
    roomCode: z.string(),
  }))
  .query(({ input }) => {
    const room = rooms.get(input.roomCode);

    if (!room) {
      throw new Error("Sala no encontrada");
    }

    return {
      room: {
        id: room.id,
        players: room.players,
        gameState: room.gameState,
        maxPlayers: room.maxPlayers,
      },
    };
  });
