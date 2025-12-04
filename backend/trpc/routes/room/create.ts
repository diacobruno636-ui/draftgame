import { publicProcedure } from "../../create-context";
import { rooms, generateRoomCode } from "../../rooms-store";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

export default publicProcedure.mutation(async () => {
  try {
    console.log("[room.create] Starting room creation");
    
    const roomCode = generateRoomCode();
    const roomId = randomBytes(16).toString("hex");
    
    console.log("[room.create] Creating room with code:", roomCode);
    
    const room = {
      id: roomCode,
      createdAt: Date.now(),
      players: [],
      gameState: null,
      maxPlayers: 6,
    };
    
    rooms.set(roomCode, room);
    
    console.log("[room.create] Room created successfully:", roomId);

    return {
      roomCode: roomCode,
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
