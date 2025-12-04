import { prisma } from "@/backend/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../create-context";

export default publicProcedure
  .input(
    z.object({
      roomCode: z.string(),
      playerId: z.string(),
      budget: z.number().optional(),
      totalSpent: z.number().optional(),
      squad: z.array(z.any()).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const normalizedCode = input.roomCode.trim().toUpperCase();

    try {
      const room = await prisma.room.findUnique({
        where: { code: normalizedCode },
        select: { id: true },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sala no encontrada",
        });
      }

      const player = await prisma.roomPlayer.findFirst({
        where: {
          id: input.playerId,
          roomId: room.id,
        },
        select: { id: true },
      });

      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Jugador no encontrado",
        });
      }

      const updateData: {
        budget?: number;
        totalSpent?: number;
        squadData?: string | null;
      } = {};

      if (typeof input.budget === "number") {
        updateData.budget = input.budget;
      }

      if (typeof input.totalSpent === "number") {
        updateData.totalSpent = input.totalSpent;
      }

      if (input.squad !== undefined) {
        updateData.squadData = JSON.stringify(input.squad);
      }

      if (Object.keys(updateData).length === 0) {
        return {
          success: true,
          message: "Nada que actualizar",
        };
      }

      await prisma.roomPlayer.update({
        where: { id: player.id },
        data: updateData,
      });

      return {
        success: true,
        message: "Jugador actualizado",
      };
    } catch (error: any) {
      if (error instanceof TRPCError) {
        throw error;
      }

      if (error?.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Jugador no encontrado",
        });
      }

      console.error("[room.updatePlayer] Error updating player", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error?.message || "No se pudo actualizar al jugador",
      });
    }
  });
