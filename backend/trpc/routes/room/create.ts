import { prisma } from "@/backend/lib/prisma";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../../create-context";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const generateUniqueRoomCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      const randomIndex = Math.floor(Math.random() * CHARSET.length);
      code += CHARSET.charAt(randomIndex);
    }

    const existingRoom = await prisma.room.findUnique({ where: { code } });
    if (!existingRoom) {
      return code;
    }
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "No se pudo generar un código de sala único",
  });
};

export default publicProcedure.mutation(async () => {
  try {
    const roomCode = await generateUniqueRoomCode();

    const room = await prisma.room.create({
      data: {
        code: roomCode,
      },
      select: {
        code: true,
      },
    });

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
