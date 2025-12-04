import { publicProcedure } from "../../create-context";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

export default publicProcedure
  .input(z.object({ 
    playerId: z.string(),
    budget: z.number().optional(),
    totalSpent: z.number().optional(),
    squad: z.array(z.any()).optional(),
  }))
  .mutation(async ({ input }) => {
    const player = await prisma.roomPlayer.findUnique({
      where: { id: input.playerId },
    });

    if (!player) {
      throw new Error("Jugador no encontrado");
    }

    await prisma.roomPlayer.update({
      where: { id: input.playerId },
      data: {
        ...(input.budget !== undefined && { budget: input.budget }),
        ...(input.totalSpent !== undefined && { totalSpent: input.totalSpent }),
        ...(input.squad !== undefined && { squadData: JSON.stringify(input.squad) }),
      },
    });

    return {
      success: true,
      message: "Jugador actualizado",
    };
  });
