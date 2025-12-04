export interface Room {
  id: string;
  createdAt: number;
  players: {
    id: string;
    name: string;
  }[];
  gameState: any;
  maxPlayers: number;
}

export const rooms = new Map<string, Room>();

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  
  return code;
}
