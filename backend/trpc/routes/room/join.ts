import { publicProcedure } from "../../create-context";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string(), 
    playerName: z.string() 
  }))
  .mutation(async ({ input }) => {
    const room = await prisma.room.findUnique({
      where: { code: input.roomCode },
      include: { players: true },
    });

    if (!room) {
      throw new Error("Sala no encontrada");
    }

    if (!room.isActive) {
      throw new Error("La sala ya no está activa");
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error("La sala está llena");
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

    return {
      roomCode: room.code,
      playerId: player.id,
      playerName: player.name,
      message: "Te has unido a la sala exitosamente",
    };
  });
