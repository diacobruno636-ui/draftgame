import { prisma } from "@/backend/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../create-context";

export default publicProcedure
  .input(
    z.object({
      roomCode: z.string(),
      playerName: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const normalizedCode = input.roomCode.trim().toUpperCase();
      const normalizedName = input.playerName.trim();

      if (!normalizedName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El nombre del jugador es obligatorio",
        });
      }

      const room = await prisma.room.findUnique({
        where: { code: normalizedCode },
        include: { players: true },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sala no encontrada",
        });
      }

      if (room.players.length >= room.maxPlayers) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La sala está llena",
        });
      }

      const player = await prisma.roomPlayer.create({
        data: {
          name: normalizedName,
          roomId: room.id,
        },
        select: {
          id: true,
          name: true,
        },
      });

      return {
        roomCode: room.code,
        playerId: player.id,
        playerName: player.name,
        message: "Te has unido a la sala exitosamente",
      };
    } catch (error: any) {
      console.error("[room.join] Error joining room:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error?.message || "Error al unirse a la sala",
      });
    }
  });
