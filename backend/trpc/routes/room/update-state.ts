import { publicProcedure } from "../../create-context";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string(),
    gameState: z.any(),
  }))
  .mutation(async ({ input }) => {
    const room = await prisma.room.findUnique({
      where: { code: input.roomCode },
    });

    if (!room) {
      throw new Error("Sala no encontrada");
    }

    await prisma.room.update({
      where: { code: input.roomCode },
      data: {
        gameState: JSON.stringify(input.gameState),
      },
    });

    return {
      success: true,
      message: "Estado del juego actualizado",
    };
  });
