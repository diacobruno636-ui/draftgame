import { publicProcedure } from "../../create-context";
import { rooms } from "../../rooms-store";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string(), 
    playerName: z.string() 
  }))
  .mutation(async ({ input }) => {
    try {
      console.log("[room.join] Joining room:", input.roomCode, "Player:", input.playerName);
      
      const room = rooms.get(input.roomCode);

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

      const playerId = randomBytes(16).toString("hex");
      const player = {
        id: playerId,
        name: input.playerName,
      };
      
      room.players.push(player);
      
      console.log("[room.join] Player joined successfully:", playerId);

      return {
        roomCode: input.roomCode,
        playerId: playerId,
        playerName: input.playerName,
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
