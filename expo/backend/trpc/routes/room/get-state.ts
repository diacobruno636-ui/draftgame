import { prisma } from "@/backend/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../create-context";

type StoredRoomPlayer = {
  id: string;
  name: string;
  budget: number;
  totalSpent: number;
  isActive: boolean;
  squadData: string | null;
};

type StoredRoom = {
  code: string;
  isActive: boolean;
  maxPlayers: number;
  gameState: string | null;
  players: StoredRoomPlayer[];
};

const parseJsonField = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("[room.getState] Failed to parse JSON field", error);
    return null;
  }
};

export default publicProcedure
  .input(
    z.object({
      roomCode: z.string(),
    })
  )
  .query(async ({ input }) => {
    try {
      const normalizedCode = input.roomCode.trim().toUpperCase();

      const room = (await prisma.room.findUnique({
        where: { code: normalizedCode },
        include: { players: true },
      })) as StoredRoom | null;

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sala no encontrada",
        });
      }

      const parsedGameState = parseJsonField<Record<string, unknown>>(room.gameState);

      return {
        room: {
          code: room.code,
          gameState: parsedGameState,
          isActive: room.isActive,
          maxPlayers: room.maxPlayers,
        },
        players: room.players.map((player: StoredRoomPlayer) => ({
          id: player.id,
          name: player.name,
          budget: player.budget,
          totalSpent: player.totalSpent,
          isActive: player.isActive,
          squad: parseJsonField(player.squadData) ?? [],
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
