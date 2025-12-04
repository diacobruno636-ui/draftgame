import { publicProcedure } from "../../create-context";
import { rooms } from "../../rooms-store";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string(),
    gameState: z.any(),
  }))
  .mutation(async ({ input }) => {
    const room = rooms.get(input.roomCode);

    if (!room) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sala no encontrada",
      });
    }

    room.gameState = input.gameState;

    return {
      success: true,
      message: "Estado del juego actualizado",
    };
  });
