import { prisma } from "@/backend/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../create-context";

export default publicProcedure
  .input(
    z.object({
      roomCode: z.string(),
      gameState: z.any(),
    })
  )
  .mutation(async ({ input }) => {
    const normalizedCode = input.roomCode.trim().toUpperCase();

    try {
      const serializedState = input.gameState === null ? null : JSON.stringify(input.gameState);

      const updatedRoom = await prisma.room.update({
        where: { code: normalizedCode },
        data: {
          gameState: serializedState,
        },
        select: { id: true },
      });

      if (!updatedRoom) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sala no encontrada",
        });
      }

      return {
        success: true,
        message: "Estado del juego actualizado",
      };
    } catch (error: any) {
      if (error instanceof TRPCError) {
        throw error;
      }

      if (error?.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sala no encontrada",
        });
      }

      console.error("[room.updateState] Error updating game state", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error?.message || "No se pudo actualizar el estado del juego",
      });
    }
  });
