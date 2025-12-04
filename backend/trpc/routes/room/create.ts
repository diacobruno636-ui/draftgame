import { publicProcedure } from "../../create-context";
import { prisma } from "../../../lib/prisma";

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default publicProcedure.mutation(async () => {
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
  
  const room = await prisma.room.create({
    data: {
      code: roomCode,
      maxPlayers: 6,
      gameState: null,
      isActive: true,
    },
  });

  return {
    roomCode: room.code,
    message: "Sala creada exitosamente",
  };
});
