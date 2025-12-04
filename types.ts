import { Footballer } from "@/mocks/footballers";

export type AuctionPhase = 
  | "setup"
  | "naming"
  | "waiting"
  | "active"
  | "ended"
  | "revealed"
  | "gameOver"
  | "voting"
  | "transfer";

export type Hint = {
  type: "league" | "nationality" | "position" | "age" | "physical";
  value: string;
  revealedAt: number;
};

export type Player = {
  id: string;
  name: string;
  budget: number;
  squad: Footballer[];
  totalSpent: number;
  isActive: boolean;
};

export type SquadRequirements = {
  goalkeepers: number;
  defenders: number;
  midfielders: number;
  forwards: number;
  total: number;
};

export type BidInfo = {
  playerId: string;
  playerName: string;
  amount: number;
};

export type AuctionState = {
  phase: AuctionPhase;
  targetFootballer: Footballer | null;
  basePrice: number;
  currentBid: number;
  hints: Hint[];
  timeRemaining: number;
};

export type Position = "Goalkeeper" | "Defender" | "Midfielder" | "Forward";

export type Rarity = "BRONZE" | "SILVER" | "GOLD" | "LEGEND" | "GOAT" | "FUTTIES";

export type TransferOffer = {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredFootballerId: string;
  requestedFootballerId: string;
  offerAmount: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: number;
  expiresAt: number;
};
