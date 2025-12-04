import { publicProcedure } from "../../create-context";
import { z } from "zod";

const rooms = new Map<string, {
  id: string;
  createdAt: number;
  players: { id: string; name: string }[];
  gameState: any;
  maxPlayers: number;
}>();

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
