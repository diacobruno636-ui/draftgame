import { publicProcedure } from "../../create-context";
import { rooms } from "../../rooms-store";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string()
  }))
  .query(async ({ input }) => {
    try {
      const room = rooms.get(input.roomCode);

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sala no encontrada",
        });
      }

      return {
        room: {
          code: input.roomCode,
          gameState: room.gameState,
          isActive: true,
          maxPlayers: room.maxPlayers,
        },
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          budget: 1000,
          totalSpent: 0,
          isActive: true,
          squad: [],
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
