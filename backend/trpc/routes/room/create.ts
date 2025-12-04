import { publicProcedure } from "../../create-context";

const rooms = new Map<string, {
  id: string;
  createdAt: number;
  players: { id: string; name: string }[];
  gameState: any;
  maxPlayers: number;
}>();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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
