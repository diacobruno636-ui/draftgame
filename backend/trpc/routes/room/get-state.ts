import { publicProcedure } from "../../create-context";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";

export default publicProcedure
  .input(z.object({
    roomCode: z.string(),
  }))
  .query(async ({ input }) => {
    const room = await prisma.room.findUnique({
      where: { code: input.roomCode },
      include: { 
        players: {
          include: { squad: true },
        },
      },
    });

    if (!room) {
      throw new Error("Sala no encontrada");
    }

    return {
      room: {
        id: room.id,
        code: room.code,
        players: room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          budget: p.budget,
          totalSpent: p.totalSpent,
          isActive: p.isActive,
          squad: p.squad.map((s: any) => ({
            id: s.id,
            footballerId: s.footballerId,
            footballerData: JSON.parse(s.footballerData),
            price: s.price,
          })),
        })),
        gameState: room.gameState ? JSON.parse(room.gameState) : null,
        maxPlayers: room.maxPlayers,
      },
    };
  });
