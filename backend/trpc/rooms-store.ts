export interface Room {
  id: string;
  createdAt: number;
  players: { id: string; name: string }[];
  gameState: any;
  maxPlayers: number;
}

export const rooms = new Map<string, Room>();

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
