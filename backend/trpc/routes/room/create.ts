import { publicProcedure } from "../../create-context";
import { prisma } from "../../../lib/prisma";
import { TRPCError } from "@trpc/server";

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default publicProcedure.mutation(async () => {
  try {
    console.log("[room.create] Starting room creation");
    
    let roomCode = generateRoomCode();
    let attempts = 0;
    
    while (attempts < 10) {
      const existing = await prisma.room.findUnique({
        where: { code: roomCode },
      });
      
      if (!existing) break;
      roomCode = generateRoomCode();
      attempts++;
    }
    
    console.log("[room.create] Creating room with code:", roomCode);
    
    const room = await prisma.room.create({
      data: {
        code: roomCode,
        maxPlayers: 6,
        gameState: null,
        isActive: true,
      },
    });
    
    console.log("[room.create] Room created successfully:", room.id);

    return {
      roomCode: room.code,
      message: "Sala creada exitosamente",
    };
  } catch (error: any) {
    console.error("[room.create] Error creating room:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error?.message || "Error al crear la sala",
    });
  }
});
