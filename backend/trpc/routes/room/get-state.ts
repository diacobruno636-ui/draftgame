import { publicProcedure } from "../../create-context";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

export default publicProcedure
  .input(z.object({ 
    roomCode: z.string()
  }))
  .query(async ({ input }) => {
    const room = await prisma.room.findUnique({
      where: { code: input.roomCode },
      include: { 
        players: {
          orderBy: { joinedAt: 'asc' }
        }
      },
    });

    if (!room) {
      throw new Error("Sala no encontrada");
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
  });
