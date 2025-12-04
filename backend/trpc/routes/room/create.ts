import { publicProcedure } from "../../create-context";
import { rooms, generateRoomCode } from "../../rooms-store";

export default publicProcedure.mutation(() => {
  const roomCode = generateRoomCode();
  
  rooms.set(roomCode, {
    id: roomCode,
    createdAt: Date.now(),
    players: [],
    gameState: null,
    maxPlayers: 6,
  });

  return {
    roomCode,
    message: "Sala creada exitosamente",
  };
});
