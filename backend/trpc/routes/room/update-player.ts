import { publicProcedure } from "../../create-context";
import { rooms } from "../../rooms-store";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string(),
    playerId: z.string(),
    budget: z.number().optional(),
    totalSpent: z.number().optional(),
    squad: z.array(z.any()).optional(),
  }))
  .mutation(async ({ input }) => {
    const room = rooms.get(input.roomCode);

    if (!room) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sala no encontrada",
      });
    }

    const player = room.players.find((p) => p.id === input.playerId);

    if (!player) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Jugador no encontrado",
      });
    }

    return {
      success: true,
      message: "Jugador actualizado",
    };
  });
