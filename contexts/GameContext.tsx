import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useRef, useState } from "react";
import { Footballer, footballers } from "@/mocks/footballers";
import { AuctionPhase, Player, BidInfo, Position, Hint, TransferOffer, Rarity } from "@/types";

const AUCTION_DURATION = 15;
const INITIAL_BUDGET = 1000;
const DELAY_BETWEEN_AUCTIONS = 7000;
const MAX_SKIPS_PER_POSITION = 2;

const SQUAD_FORMATION = {
  goalkeepers: 1,
  defenders: 4,
  midfielders: 3,
  forwards: 3,
  total: 11,
};

const POSITION_ORDER: Position[] = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

export const getRarity = (footballer: Footballer): Rarity => {
  if (footballer.isPrime) return "GOAT";
  if (footballer.isLegend) return "LEGEND";
  if (footballer.isFutties) return "FUTTIES";
  if (footballer.rating >= 83) return "GOLD";
  if (footballer.rating < 82) return "SILVER";
  return "BRONZE";
};

export const [GameProvider, useGame] = createContextHook(() => {
  const [phase, setPhase] = useState<AuctionPhase>("setup");
  const [players, setPlayers] = useState<Player[]>([]);

  const [targetFootballer, setTargetFootballer] = useState<Footballer | null>(null);
  const [basePrice, setBasePrice] = useState(0);
  const [currentBid, setCurrentBid] = useState<BidInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(AUCTION_DURATION);

  const [hints, setHints] = useState<Hint[]>([]);
  const [silhouetteOpacity, setSilhouetteOpacity] = useState(1);

  const [auctionsCompleted, setAuctionsCompleted] = useState(0);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [votes, setVotes] = useState<{ [voterId: string]: string }>({});
  const [transferOffers, setTransferOffers] = useState<TransferOffer[]>([]);
  const [skipsPerPosition, setSkipsPerPosition] = useState<{ [position: string]: number }>({});

  const usedFootballerIds = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCurrentPosition = useCallback((): Position => {
    return POSITION_ORDER[currentPositionIndex];
  }, [currentPositionIndex]);

  const getPlayerPositionCounts = useCallback((player: Player) => {
    const counts = {
      Goalkeeper: 0,
      Defender: 0,
      Midfielder: 0,
      Forward: 0,
    };

    player.squad.forEach((footballer) => {
      counts[footballer.position]++;
    });

    return counts;
  }, []);

  const getEligiblePlayers = useCallback(() => {
    const currentPosition = getCurrentPosition();
    
    return players.filter((player) => {
      const positionCounts = getPlayerPositionCounts(player);
      const requiredCount = SQUAD_FORMATION[
        currentPosition === "Goalkeeper" ? "goalkeepers" :
        currentPosition === "Defender" ? "defenders" :
        currentPosition === "Midfielder" ? "midfielders" : "forwards"
      ];
      
      return positionCounts[currentPosition] < requiredCount;
    });
  }, [players, getCurrentPosition, getPlayerPositionCounts]);

  const initializePlayers = useCallback((count: number, playerNames: string[]) => {
    const newPlayers: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      budget: INITIAL_BUDGET,
      squad: [],
      totalSpent: 0,
      isActive: true,
    }));

    setPlayers(newPlayers);
    setPhase("waiting");
  }, []);

  const selectRandomFootballer = useCallback((positionIndex: number): Footballer | null => {
    const currentPosition = POSITION_ORDER[positionIndex];
    
    const availableFootballers = footballers.filter(
      (f) =>
        !usedFootballerIds.current.has(f.id) &&
        f.position === currentPosition
    );

    if (availableFootballers.length === 0) {
      return null;
    }

    const primes = availableFootballers.filter(f => f.isPrime);
    const legends = availableFootballers.filter(f => f.isLegend);
    const futties = availableFootballers.filter(f => f.isFutties);
    const regulars = availableFootballers.filter(f => !f.isPrime && !f.isLegend && !f.isFutties);

    const roll = Math.random() * 100;
    
    let selected: Footballer;
    if (roll < 15 && primes.length > 0) {
      const randomIndex = Math.floor(Math.random() * primes.length);
      selected = primes[randomIndex];
    } else if (roll < 25 && legends.length > 0) {
      const randomIndex = Math.floor(Math.random() * legends.length);
      selected = legends[randomIndex];
    } else if (roll < 50 && futties.length > 0) {
      const randomIndex = Math.floor(Math.random() * futties.length);
      selected = futties[randomIndex];
    } else {
      const golds = regulars.filter(f => getRarity(f) === "GOLD");
      const silvers = regulars.filter(f => getRarity(f) === "SILVER");
      const bronzes = regulars.filter(f => getRarity(f) === "BRONZE");
      
      const rarityRoll = Math.random() * 100;
      if (rarityRoll < 40 && golds.length > 0) {
        const randomIndex = Math.floor(Math.random() * golds.length);
        selected = golds[randomIndex];
      } else if (rarityRoll < 80 && silvers.length > 0) {
        const randomIndex = Math.floor(Math.random() * silvers.length);
        selected = silvers[randomIndex];
      } else if (bronzes.length > 0) {
        const randomIndex = Math.floor(Math.random() * bronzes.length);
        selected = bronzes[randomIndex];
      } else {
        const randomIndex = Math.floor(Math.random() * regulars.length);
        selected = regulars[randomIndex];
      }
    }
    
    usedFootballerIds.current.add(selected.id);
    
    return selected;
  }, []);

  const skipFootballer = useCallback(() => {
    if (!targetFootballer) return;
    
    const currentPosition = getCurrentPosition();
    const positionKey = currentPosition;
    const currentSkips = skipsPerPosition[positionKey] || 0;
    const isLastPosition = currentPositionIndex === POSITION_ORDER.length - 1;

    if (currentSkips >= MAX_SKIPS_PER_POSITION) {
      console.log("Max skips reached");
      
      const eligiblePlayers = getEligiblePlayers();
      const availablePlayers = footballers.filter(
        (f) => !usedFootballerIds.current.has(f.id) && 
        f.position === currentPosition
      );
      
      if (availablePlayers.length === 0) {
        setPhase("waiting");
        return;
      }
      
      if (isLastPosition) {
        eligiblePlayers.forEach((player) => {
          const nextPlayer = availablePlayers[0];
          usedFootballerIds.current.add(nextPlayer.id);
          
          setPlayers((prevPlayers) =>
            prevPlayers.map((p) => {
              if (p.id === player.id) {
                return {
                  ...p,
                  budget: Math.max(0, p.budget - 100),
                  squad: [...p.squad, nextPlayer],
                  totalSpent: p.totalSpent + 100,
                };
              }
              return p;
            })
          );
        });
      } else {
        const eligiblePlayers = getEligiblePlayers();
        eligiblePlayers.forEach((player) => {
          setPlayers((prevPlayers) =>
            prevPlayers.map((p) => {
              if (p.id === player.id) {
                return {
                  ...p,
                  budget: Math.max(0, p.budget - 50),
                  totalSpent: p.totalSpent + 50,
                };
              }
              return p;
            })
          );
        });
      }
      
      setPhase("waiting");
      return;
    }

    setSkipsPerPosition((prev) => ({
      ...prev,
      [positionKey]: currentSkips + 1,
    }));

    setPhase("waiting");
  }, [targetFootballer, getCurrentPosition, skipsPerPosition, getEligiblePlayers, currentPositionIndex]);

  const startAuction = useCallback(() => {
    const footballer = selectRandomFootballer(currentPositionIndex);
    
    if (!footballer) {
      if (currentPositionIndex < POSITION_ORDER.length - 1) {
        setCurrentPositionIndex((prev) => prev + 1);
        return;
      } else {
        setPhase("gameOver");
        return;
      }
    }

    const calculatedBasePrice = 45;
    
    setTargetFootballer(footballer);
    setBasePrice(calculatedBasePrice);
    setCurrentBid(null);
    setTimeRemaining(AUCTION_DURATION);
    setHints([]);
    setSilhouetteOpacity(1);
    setPhase("active");
  }, [currentPositionIndex, selectRandomFootballer]);

  const incrementBid = useCallback((playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return false;

    const eligiblePlayers = getEligiblePlayers();
    if (!eligiblePlayers.find((p) => p.id === playerId)) {
      console.log("Player cannot bid for this position");
      return false;
    }

    const minBid = currentBid ? currentBid.amount + 5 : basePrice;
    
    if (minBid > player.budget) {
      console.log("Not enough budget");
      return false;
    }

    setCurrentBid({
      playerId,
      playerName: player.name,
      amount: minBid,
    });

    setTimeRemaining(AUCTION_DURATION);

    return true;
  }, [players, currentBid, basePrice, getEligiblePlayers]);

  const resetAuction = useCallback(() => {
    setPhase("waiting");
    setTargetFootballer(null);
    setBasePrice(0);
    setCurrentBid(null);
    setTimeRemaining(AUCTION_DURATION);
    setHints([]);
    setSilhouetteOpacity(1);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const resetGame = useCallback(() => {
    setPhase("setup");
    setPlayers([]);
    setTargetFootballer(null);
    setBasePrice(0);
    setCurrentBid(null);
    setTimeRemaining(AUCTION_DURATION);
    setHints([]);
    setSilhouetteOpacity(1);
    setAuctionsCompleted(0);
    setCurrentPositionIndex(0);
    setVotes({});
    setTransferOffers([]);
    setSkipsPerPosition({});
    usedFootballerIds.current.clear();

    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (phase !== "active") return;

    if (timeRemaining > 0) {
      timerRef.current = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
    } else {
      if (currentBid && targetFootballer) {
        const eligiblePlayers = getEligiblePlayers();
        const bidAmount = eligiblePlayers.find(p => p.id === currentBid.playerId)?.budget || 0;
        const finalAmount = bidAmount < currentBid.amount ? bidAmount : currentBid.amount;

        setPlayers((prevPlayers) =>
          prevPlayers.map((p) => {
            if (p.id === currentBid.playerId) {
              return {
                ...p,
                budget: p.budget - finalAmount,
                squad: [...p.squad, targetFootballer],
                totalSpent: p.totalSpent + finalAmount,
              };
            }
            return p;
          })
        );

        setAuctionsCompleted((prev) => prev + 1);
        setPhase("revealed");
      } else {
        skipFootballer();
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, timeRemaining, currentBid, targetFootballer, getEligiblePlayers, skipFootballer]);

  useEffect(() => {
    if (phase === "revealed") {
      const timeout = setTimeout(() => {
        const isComplete = players.every((p) => p.squad.length === SQUAD_FORMATION.total);
        
        if (isComplete) {
          setPhase("voting");
          return;
        }

        const currentPosition = POSITION_ORDER[currentPositionIndex];
        const eligibleCount = players.filter((player) => {
          const counts = getPlayerPositionCounts(player);
          const requiredCount = SQUAD_FORMATION[
            currentPosition === "Goalkeeper" ? "goalkeepers" :
            currentPosition === "Defender" ? "defenders" :
            currentPosition === "Midfielder" ? "midfielders" : "forwards"
          ];
          
          return counts[currentPosition] < requiredCount;
        }).length;

        if (eligibleCount === 0) {
          if (currentPositionIndex < POSITION_ORDER.length - 1) {
            if (currentPositionIndex > 0) {
              setPhase("transfer");
            } else {
              setCurrentPositionIndex((prev) => prev + 1);
              setPhase("waiting");
            }
          } else {
            setPhase("voting");
          }
        } else {
          setPhase("waiting");
        }
      }, DELAY_BETWEEN_AUCTIONS);

      return () => clearTimeout(timeout);
    }
  }, [phase, players, currentPositionIndex, getPlayerPositionCounts]);

  useEffect(() => {
    if (phase !== "active" || !targetFootballer) return;

    const hintSchedule = [
      { time: 13, type: "position" as const, getValue: () => targetFootballer.position },
      { time: 11, type: "age" as const, getValue: () => `${targetFootballer.age} años` },
      { time: 9, type: "nationality" as const, getValue: () => targetFootballer.nationality },
      { time: 6, type: "physical" as const, getValue: () => `${targetFootballer.height}cm` },
      { time: 3, type: "league" as const, getValue: () => targetFootballer.league },
    ];

    hintSchedule.forEach(({ time, type, getValue }) => {
      if (timeRemaining === time) {
        setHints((prev) => {
          if (prev.some(h => h.type === type)) return prev;
          return [...prev, { type, value: getValue(), revealedAt: time }];
        });
        setSilhouetteOpacity((prev) => Math.max(0, prev - 0.2));
      }
    });
  }, [phase, timeRemaining, targetFootballer]);

  const castVote = useCallback((voterId: string, votedForId: string) => {
    setVotes((prev) => ({ ...prev, [voterId]: votedForId }));
  }, []);

  const getVoteResults = useCallback(() => {
    const voteCounts: { [playerId: string]: number } = {};
    players.forEach((p) => {
      voteCounts[p.id] = 0;
    });

    Object.values(votes).forEach((votedForId) => {
      if (voteCounts[votedForId] !== undefined) {
        voteCounts[votedForId]++;
      }
    });

    return voteCounts;
  }, [votes, players]);

  const createTransferOffer = useCallback((fromPlayerId: string, toPlayerId: string, offeredFootballerId: string, requestedFootballerId: string, amount: number) => {
    const now = Date.now();
    const offer: TransferOffer = {
      id: `transfer-${now}`,
      fromPlayerId,
      toPlayerId,
      offeredFootballerId,
      requestedFootballerId,
      offerAmount: amount,
      status: "pending",
      createdAt: now,
      expiresAt: now + 10000,
    };
    setTransferOffers((prev) => [...prev, offer]);
  }, []);

  useEffect(() => {
    if (phase !== "transfer") return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTransferOffers((prev) =>
        prev.map((offer) => {
          if (offer.status === "pending" && now >= offer.expiresAt) {
            return { ...offer, status: "expired" };
          }
          return offer;
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [phase]);

  const respondToTransfer = useCallback((offerId: string, accept: boolean) => {
    setTransferOffers((prev) =>
      prev.map((offer) => {
        if (offer.id === offerId) {
          if (accept) {
            setPlayers((prevPlayers) => {
              const fromPlayer = prevPlayers.find((p) => p.id === offer.fromPlayerId);
              const toPlayer = prevPlayers.find((p) => p.id === offer.toPlayerId);
              
              if (!fromPlayer || !toPlayer) return prevPlayers;

              const requestedFootballer = toPlayer.squad.find((f) => f.id === offer.requestedFootballerId);
              const offeredFootballer = fromPlayer.squad.find((f) => f.id === offer.offeredFootballerId);
              
              if (!requestedFootballer || !offeredFootballer) return prevPlayers;

              return prevPlayers.map((p) => {
                if (p.id === offer.fromPlayerId) {
                  return {
                    ...p,
                    budget: p.budget - offer.offerAmount,
                    squad: [...p.squad.filter((f) => f.id !== offer.offeredFootballerId), requestedFootballer],
                    totalSpent: p.totalSpent + offer.offerAmount,
                  };
                }
                if (p.id === offer.toPlayerId) {
                  return {
                    ...p,
                    budget: p.budget + offer.offerAmount,
                    squad: [...p.squad.filter((f) => f.id !== offer.requestedFootballerId), offeredFootballer],
                    totalSpent: p.totalSpent - offer.offerAmount,
                  };
                }
                return p;
              });
            });
          }
          return { ...offer, status: accept ? "accepted" : "rejected" } as TransferOffer;
        }
        return offer;
      })
    );
  }, []);

  const proceedFromTransfer = useCallback(() => {
    setCurrentPositionIndex((prev) => prev + 1);
    setTransferOffers([]);
    setPhase("waiting");
  }, []);

  return {
    phase,
    players,
    squadRequirements: SQUAD_FORMATION,
    targetFootballer,
    basePrice,
    currentBid,
    timeRemaining,
    hints,
    silhouetteOpacity,
    auctionsCompleted,
    currentPosition: getCurrentPosition(),
    votes,
    transferOffers,
    skipsPerPosition,

    initializePlayers,
    startAuction,
    incrementBid,
    resetGame,
    resetAuction,
    getEligiblePlayers,
    getPlayerPositionCounts,
    castVote,
    getVoteResults,
    createTransferOffer,
    respondToTransfer,
    proceedFromTransfer,
    skipFootballer,
  };
});
