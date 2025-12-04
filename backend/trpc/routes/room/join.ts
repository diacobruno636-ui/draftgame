import { publicProcedure } from "../../create-context";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string(), 
    playerName: z.string() 
  }))
  .mutation(async ({ input }) => {
    try {
      console.log("[room.join] Joining room:", input.roomCode, "Player:", input.playerName);
      
      const room = await prisma.room.findUnique({
        where: { code: input.roomCode },
        include: { players: true },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sala no encontrada",
        });
      }

      if (!room.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La sala ya no está activa",
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
          name: input.playerName,
          roomId: room.id,
          budget: 1000,
          totalSpent: 0,
          isActive: true,
        },
      });
      
      console.log("[room.join] Player joined successfully:", player.id);

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
