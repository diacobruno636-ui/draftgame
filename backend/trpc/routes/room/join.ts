import { publicProcedure } from "../../create-context";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";

export default publicProcedure
  .input(z.object({
    roomCode: z.string(),
    playerName: z.string(),
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
      throw new Error("Sala no activa");
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error("Sala llena");
    }

    const player = await prisma.player.create({
      data: {
        name: input.playerName,
        roomId: room.id,
        budget: 20000000,
        totalSpent: 0,
        isActive: true,
      },
    });

    const updatedRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: { players: true },
    });

    return {
      success: true,
      playerId: player.id,
      room: {
        id: updatedRoom!.id,
        code: updatedRoom!.code,
        players: updatedRoom!.players.map(p => ({
          id: p.id,
          name: p.name,
          budget: p.budget,
          totalSpent: p.totalSpent,
          isActive: p.isActive,
        })),
      },
    };
  });
