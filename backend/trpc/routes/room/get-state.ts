import { publicProcedure } from "../../create-context";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string()
  }))
  .query(async ({ input }) => {
    try {
      const room = await prisma.room.findUnique({
        where: { code: input.roomCode },
        include: { 
          players: {
            orderBy: { joinedAt: 'asc' }
          }
        },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sala no encontrada",
        });
      }

      return {
        room: {
          code: room.code,
          gameState: room.gameState ? JSON.parse(room.gameState) : null,
          isActive: room.isActive,
          maxPlayers: room.maxPlayers,
        },
        players: room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          budget: p.budget,
          totalSpent: p.totalSpent,
          isActive: p.isActive,
          squad: p.squadData ? JSON.parse(p.squadData) : [],
        })),
      };
    } catch (error: any) {
      console.error("[room.getState] Error getting room state:", error);
      
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error?.message || "Error al obtener el estado de la sala",
      });
    }
  });
