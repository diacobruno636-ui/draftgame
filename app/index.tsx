import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame, getRarity } from "@/contexts/GameContext";
import { Footballer } from "@/mocks/footballers";
import { ChevronUp, Plus, Minus, ChevronDown, Flame } from "lucide-react-native";
import { COLORS } from "@/constants/colors";
import { trpc } from "@/lib/trpc";

const { width } = Dimensions.get("window");

export default function GameScreen() {
  const {
    phase,
    players,
    targetFootballer,
    basePrice,
    currentBid,
    timeRemaining,
    hints,
    currentPosition,
    transferOffers,
    skipsPerPosition,
    initializePlayers,
    startAuction,
    incrementBid,
    resetGame,
    getEligiblePlayers,
    getPlayerPositionCounts,
    castVote,
    getVoteResults,
    createTransferOffer,
    respondToTransfer,
    proceedFromTransfer,
    skipFootballer,
  } = useGame();

  const [gameMode, setGameMode] = useState<"select" | "ia" | "friends" | null>(null);
  const [multiplayerMode, setMultiplayerMode] = useState<"create" | "join" | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [numPlayersInput, setNumPlayersInput] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState<{ [key: string]: boolean }>({});
  const [showResults, setShowResults] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string>("");
  const [transferTo, setTransferTo] = useState<string>("");
  const [offeredFootballerId, setOfferedFootballerId] = useState<string>("");
  const [requestedFootballerId, setRequestedFootballerId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [showFromPlayerPicker, setShowFromPlayerPicker] = useState(false);
  const [showToPlayerPicker, setShowToPlayerPicker] = useState(false);
  const [showOfferedPlayerPicker, setShowOfferedPlayerPicker] = useState(false);
  const [showRequestedPlayerPicker, setShowRequestedPlayerPicker] = useState(false);
  const [, forceUpdate] = useState(0);

  const sparkleAnim1 = useState(new Animated.Value(0))[0];
  const sparkleAnim2 = useState(new Animated.Value(0))[0];
  const sparkleAnim3 = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const timerPulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (phase === "voting") {
      setHasVoted({});
      setShowResults(false);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "revealed" && targetFootballer) {
      const isPrime = targetFootballer.isPrime || false;
      const isHighRating = targetFootballer.rating >= 90;

      if (isPrime || isHighRating) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim1, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim1, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();

        Animated.loop(
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(sparkleAnim2, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim2, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();

        Animated.loop(
          Animated.sequence([
            Animated.delay(600),
            Animated.timing(sparkleAnim3, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim3, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      if (isPrime) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [phase, targetFootballer, sparkleAnim1, sparkleAnim2, sparkleAnim3, pulseAnim]);

  useEffect(() => {
    if (phase === "active" && timeRemaining <= 5) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulseAnim, {
            toValue: 1.15,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      timerPulseAnim.setValue(1);
    }
  }, [phase, timeRemaining, timerPulseAnim]);

  useEffect(() => {
    if (phase === "transfer" && transferOffers.some(o => o.status === "pending")) {
      const interval = setInterval(() => {
        forceUpdate(prev => prev + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [phase, transferOffers]);

  const createRoomMutation = trpc.room.create.useMutation();
  const joinRoomMutation = trpc.room.join.useMutation();

  const handleCreateRoom = async () => {
    try {
      console.log("[Room] Creating room...");
      const result = await createRoomMutation.mutateAsync();
      console.log("[Room] Room created successfully:", result);
      setCreatedRoomCode(result.roomCode);
    } catch (error: any) {
      console.error("[Room] Error creating room:", error);
      console.error("[Room] Error details:", {
        message: error?.message,
        cause: error?.cause,
        data: error?.data,
      });
      alert(`Error al crear sala: ${error?.message || "Error desconocido"}`);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !playerName.trim()) {
      alert("Por favor ingresa el código de sala y tu nombre");
      return;
    }

    try {
      const result = await joinRoomMutation.mutateAsync({
        roomCode: roomCode.toUpperCase(),
        playerName,
      });
      console.log("Unido a la sala:", result);
      const count = result.room.players.length;
      const names = result.room.players.map(p => p.name);
      initializePlayers(count, names);
    } catch (error: any) {
      console.error("Error al unirse a la sala:", error);
      alert(error.message || "Error al unirse a la sala");
    }
  };

  const handleSetupComplete = () => {
    const count = parseInt(numPlayersInput);
    if (count >= 2 && count <= 6 && playerNames.length === count) {
      initializePlayers(count, playerNames);
    }
  };

  const handleStartAuction = () => {
    startAuction();
  };

  const handleSkip = () => {
    const currentPos = currentPosition;
    const posKey = currentPos;
    const skips = skipsPerPosition[posKey] || 0;
    
    if (skips >= 2) {
      alert("Ya has saltado 2 jugadores en esta posición. No puedes saltar más.");
      return;
    }
    
    skipFootballer();
  };

  const renderSetupPhase = () => {
    if (gameMode === null) {
      return (
        <View style={styles.setupContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xpzuixyvghqwl258485ob" }}
              style={styles.gameLogo}
              resizeMode="contain"
            />
            <Text style={styles.gameTitle}>DRAFT KINGS</Text>
            <Text style={styles.gameSubtitle}>FOOTBALL AUCTION</Text>
          </View>

          <View style={styles.setupCard}>
            <Text style={styles.setupCardTitle}>Selecciona Modo de Juego</Text>
            
            <TouchableOpacity 
              style={styles.modeButton}
              onPress={() => setGameMode("ia")}
            >
              <Text style={styles.modeButtonIcon}>🤖</Text>
              <Text style={styles.modeButtonText}>Jugar Contra IA</Text>
              <Text style={styles.modeButtonSubtext}>Juega solo contra la computadora</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeButton}
              onPress={() => setGameMode("friends")}
            >
              <Text style={styles.modeButtonIcon}>👥</Text>
              <Text style={styles.modeButtonText}>Jugar Con Amigos</Text>
              <Text style={styles.modeButtonSubtext}>Crea o únete a una sala online</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (gameMode === "friends" && multiplayerMode === null) {
      return (
        <View style={styles.setupContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xpzuixyvghqwl258485ob" }}
              style={styles.gameLogo}
              resizeMode="contain"
            />
            <Text style={styles.gameTitle}>DRAFT KINGS</Text>
            <Text style={styles.gameSubtitle}>FOOTBALL AUCTION</Text>
          </View>

          <View style={styles.setupCard}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setGameMode(null)}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            <Text style={styles.setupCardTitle}>Modo Multijugador</Text>
            
            <TouchableOpacity 
              style={styles.modeButton}
              onPress={() => {
                setMultiplayerMode("create");
                handleCreateRoom();
              }}
            >
              <Text style={styles.modeButtonIcon}>➕</Text>
              <Text style={styles.modeButtonText}>Crear Sala</Text>
              <Text style={styles.modeButtonSubtext}>Genera un código para tus amigos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeButton}
              onPress={() => setMultiplayerMode("join")}
            >
              <Text style={styles.modeButtonIcon}>🔑</Text>
              <Text style={styles.modeButtonText}>Unirse a Sala</Text>
              <Text style={styles.modeButtonSubtext}>Ingresa el código de tu amigo</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (gameMode === "friends" && multiplayerMode === "create" && createdRoomCode) {
      return (
        <View style={styles.setupContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xpzuixyvghqwl258485ob" }}
              style={styles.gameLogo}
              resizeMode="contain"
            />
            <Text style={styles.gameTitle}>DRAFT KINGS</Text>
            <Text style={styles.gameSubtitle}>FOOTBALL AUCTION</Text>
          </View>

          <View style={styles.setupCard}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setMultiplayerMode(null);
                setCreatedRoomCode("");
              }}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            <Text style={styles.setupCardTitle}>¡Sala Creada!</Text>
            
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeLabel}>CÓDIGO DE SALA</Text>
              <Text style={styles.roomCodeText}>{createdRoomCode}</Text>
              <Text style={styles.roomCodeSubtext}>Comparte este código con tus amigos</Text>
            </View>

            <Text style={styles.waitingText}>Esperando jugadores...</Text>
            
            <TouchableOpacity 
              style={styles.startGameButton}
              onPress={() => {
                const count = parseInt(numPlayersInput) || 2;
                const names = Array(count).fill("").map((_, i) => `Jugador ${i + 1}`);
                initializePlayers(count, names);
              }}
            >
              <Text style={styles.startGameButtonText}>COMENZAR PARTIDA</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (gameMode === "friends" && multiplayerMode === "join") {
      return (
        <View style={styles.setupContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xpzuixyvghqwl258485ob" }}
              style={styles.gameLogo}
              resizeMode="contain"
            />
            <Text style={styles.gameTitle}>DRAFT KINGS</Text>
            <Text style={styles.gameSubtitle}>FOOTBALL AUCTION</Text>
          </View>

          <View style={styles.setupCard}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setMultiplayerMode(null)}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            <Text style={styles.setupCardTitle}>Unirse a Sala</Text>
            
            <Text style={styles.inputLabel}>Tu Nombre</Text>
            <TextInput
              style={styles.playerInput}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Código de Sala</Text>
            <TextInput
              style={styles.playerInput}
              value={roomCode}
              onChangeText={setRoomCode}
              placeholder="Ej: ABC123"
              placeholderTextColor="#666"
              autoCapitalize="characters"
            />

            <TouchableOpacity 
              style={[styles.startGameButton, (!roomCode || !playerName) && styles.startGameButtonDisabled]}
              onPress={handleJoinRoom}
              disabled={!roomCode || !playerName}
            >
              <Text style={styles.startGameButtonText}>UNIRSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
    <View style={styles.setupContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xpzuixyvghqwl258485ob" }}
          style={styles.gameLogo}
          resizeMode="contain"
        />
        <Text style={styles.gameTitle}>DRAFT KINGS</Text>
        <Text style={styles.gameSubtitle}>FOOTBALL AUCTION</Text>
      </View>
      
      <View style={styles.setupCard}>
        {gameMode === "ia" && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setGameMode(null)}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.setupCardTitle}>Nueva Partida</Text>
        <Text style={styles.setupCardSubtitle}>Formación 4-3-3</Text>
        
        <View style={styles.playerCountSection}>
          <Text style={styles.playerCountLabel}>Jugadores</Text>
          <View style={styles.playerCountButtons}>
            {[2, 3, 4, 5, 6].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.playerCountButton,
                  parseInt(numPlayersInput) === count && styles.playerCountButtonActive
                ]}
                onPress={() => {
                  setNumPlayersInput(count.toString());
                  setPlayerNames(Array(count).fill(""));
                }}
              >
                <Text style={[
                  styles.playerCountButtonText,
                  parseInt(numPlayersInput) === count && styles.playerCountButtonTextActive
                ]}>{count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {playerNames.length > 0 && (
          <View style={styles.playersInputSection}>
            {playerNames.map((name, index) => (
              <View key={index} style={styles.playerInputRow}>
                <Text style={styles.playerInputLabel}>P{index + 1}</Text>
                <TextInput
                  style={styles.playerInput}
                  value={name}
                  onChangeText={(text) => {
                    const newNames = [...playerNames];
                    newNames[index] = text;
                    setPlayerNames(newNames);
                  }}
                  placeholder={`Jugador ${index + 1}`}
                  placeholderTextColor="#666"
                />
              </View>
            ))}
          </View>
        )}

        {playerNames.length > 0 && playerNames.every((n) => n.trim() !== "") && (
          <TouchableOpacity style={styles.startGameButton} onPress={handleSetupComplete}>
            <Text style={styles.startGameButtonText}>COMENZAR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
    );
  };

  const renderWaitingPhase = () => {
    const currentPos = currentPosition;
    const posKey = currentPos;
    const skips = skipsPerPosition[posKey] || 0;

    const playersWithRatings = players.map((player) => {
      const totalRating = player.squad.reduce((sum, footballer) => sum + footballer.rating, 0);
      const bestPlayer = player.squad.length > 0 
        ? player.squad.reduce((best, current) => current.rating > best.rating ? current : best, player.squad[0])
        : null;
      return { ...player, totalRating, bestPlayer };
    });
    const sortedByRatings = [...playersWithRatings].sort((a, b) => b.totalRating - a.totalRating);

    const positionName = currentPosition === "Goalkeeper" ? "Arqueros" :
                         currentPosition === "Defender" ? "Defensas" :
                         currentPosition === "Midfielder" ? "Mediocampistas" : "Delanteros";

    return (
      <ScrollView style={styles.waitingContainer}>
        <View style={styles.statsHeader}>
          <View style={styles.statsHeaderGradient}>
            <Text style={styles.statsTitle}>ESTADÍSTICAS</Text>
            <View style={styles.statsDivider} />
            
            <View style={styles.nextPositionCard}>
              <Text style={styles.nextPositionLabel}>PRÓXIMA POSICIÓN</Text>
              <Text style={styles.nextPositionValue}>{positionName}</Text>
            </View>
            
            <View style={styles.skipsCard}>
              <Text style={styles.skipsLabel}>Saltos Disponibles</Text>
              <View style={styles.skipsIndicator}>
                {[0, 1].map((i) => (
                  <View key={i} style={[styles.skipDot, i < (2 - skips) && styles.skipDotActive]} />
                ))}
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.leaderboardSection}>
          <Text style={styles.leaderboardTitle}>RANKING DE EQUIPOS</Text>
          <View style={styles.leaderboardCards}>
            {sortedByRatings.map((player, index) => {
              const counts = getPlayerPositionCounts(player);
              const bestPlayerInfo = player.bestPlayer;
              const bestRarity = bestPlayerInfo ? getRarity(bestPlayerInfo) : "N/A";
              const isLeader = index === 0;
              
              const getRarityColor = (rarity: string) => {
                if (rarity === "BRONZE") return COLORS.bronze;
                if (rarity === "SILVER") return COLORS.silver;
                if (rarity === "GOLD") return COLORS.gold;
                if (rarity === "LEGEND") return COLORS.legendRed;
                if (rarity === "GOAT") return COLORS.gold;
                if (rarity === "FUTTIES") return COLORS.futties;
                return "#fff";
              };

              const getRatingColor = (rating: number) => {
                if (rating >= 90) return "#FF4444";
                if (rating >= 85) return COLORS.gold;
                return "#fff";
              };
              
              return (
                <View key={player.id} style={[styles.modernPlayerCard, isLeader && styles.leaderCard]}>
                  <View style={styles.modernCardHeader}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </Text>
                    </View>
                    <Text style={[styles.modernPlayerName, isLeader && styles.leaderName]}>{player.name}</Text>
                  </View>
                  
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>RATING</Text>
                      <Text style={styles.statBoxValue}>{player.totalRating}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>PRESUPUESTO</Text>
                      <Text style={[styles.statBoxValue, styles.budgetValue]}>${player.budget}M</Text>
                    </View>
                  </View>
                  
                  <View style={styles.positionBarsContainer}>
                    <View style={styles.positionBar}>
                      <Text style={styles.positionBarLabel}>POR</Text>
                      <View style={styles.positionBarTrack}>
                        <View style={[styles.positionBarFill, { width: `${(counts.Goalkeeper / 1) * 100}%` }]} />
                      </View>
                      <Text style={styles.positionBarCount}>{counts.Goalkeeper}/1</Text>
                    </View>
                    <View style={styles.positionBar}>
                      <Text style={styles.positionBarLabel}>DEF</Text>
                      <View style={styles.positionBarTrack}>
                        <View style={[styles.positionBarFill, { width: `${(counts.Defender / 4) * 100}%` }]} />
                      </View>
                      <Text style={styles.positionBarCount}>{counts.Defender}/4</Text>
                    </View>
                    <View style={styles.positionBar}>
                      <Text style={styles.positionBarLabel}>MED</Text>
                      <View style={styles.positionBarTrack}>
                        <View style={[styles.positionBarFill, { width: `${(counts.Midfielder / 3) * 100}%` }]} />
                      </View>
                      <Text style={styles.positionBarCount}>{counts.Midfielder}/3</Text>
                    </View>
                    <View style={styles.positionBar}>
                      <Text style={styles.positionBarLabel}>DEL</Text>
                      <View style={styles.positionBarTrack}>
                        <View style={[styles.positionBarFill, { width: `${(counts.Forward / 3) * 100}%` }]} />
                      </View>
                      <Text style={styles.positionBarCount}>{counts.Forward}/3</Text>
                    </View>
                  </View>
                  
                  {bestPlayerInfo && (
                    <View style={styles.bestPlayerBadge}>
                      <Text style={styles.bestPlayerIcon}>⭐</Text>
                      <View style={styles.bestPlayerInfo}>
                        <Text style={styles.bestPlayerTitle}>Mejor Jugador</Text>
                        <Text style={styles.bestPlayerNameText}>
                          {bestPlayerInfo.name.split(" ")[0]} • <Text style={{ color: getRarityColor(bestRarity) }}>{bestRarity}</Text> • <Text style={{ color: getRatingColor(bestPlayerInfo.rating) }}>{bestPlayerInfo.rating}</Text>{bestPlayerInfo.rating >= 90 ? " 🔥" : ""}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.modernStartButton} onPress={handleStartAuction}>
          <Text style={styles.modernStartButtonText}>INICIAR SUBASTA</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderActivePhase = () => {
    const eligiblePlayers = getEligiblePlayers();
    const canSkip = (skipsPerPosition[currentPosition] || 0) < 2;
    const isTimerCritical = timeRemaining <= 5;
    
    return (
      <ScrollView style={styles.activeContainer}>
        <View style={[styles.timerContainer, isTimerCritical && styles.timerContainerCritical]}>
          <Animated.View style={{ transform: [{ scale: isTimerCritical ? timerPulseAnim : 1 }] }}>
            <Text style={[styles.timerText, isTimerCritical && styles.timerTextCritical]}>⏱️ {timeRemaining}s</Text>
            {isTimerCritical && (
              <View style={styles.timerEffects}>
                <Text style={styles.timerSparkle}>✨</Text>
                <Text style={[styles.timerSparkle, { marginLeft: 10 }]}>✨</Text>
                <Text style={[styles.timerSparkle, { marginLeft: 10 }]}>✨</Text>
              </View>
            )}
          </Animated.View>
        </View>

        <View style={styles.footballerContainer}>
          <View style={styles.silhouetteContainer}>
            <Image
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/cqoqb4yg1afmg2xg77vde" }}
              style={styles.silhouetteImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.hintsContainer}>
            {hints.map((hint, index) => (
              <View key={index} style={styles.hint}>
                <Text style={styles.hintText}>
                  {hint.type === "league" && `🏆 ${hint.value}`}
                  {hint.type === "nationality" && `🌍 ${hint.value}`}
                  {hint.type === "age" && `🎂 ${hint.value}`}
                  {hint.type === "position" && `⚽ ${hint.value}`}
                  {hint.type === "physical" && `📏 ${hint.value}`}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.biddingSection}>
          <Text style={styles.basePriceText}>Precio Base: ${basePrice}M</Text>
          {currentBid && (
            <View style={styles.currentBidContainer}>
              <Text style={styles.currentBidText}>
                💵 Oferta Actual: ${currentBid.amount}M
              </Text>
              <Text style={styles.bidderText}>por {currentBid.playerName}</Text>
            </View>
          )}
        </View>

        <Text style={styles.eligibleTitle}>Jugadores Elegibles:</Text>
        {eligiblePlayers.map((player) => {
          return (
            <View key={player.id} style={styles.bidderCard}>
              <View style={styles.bidderInfo}>
                <Text style={styles.bidderName}>{player.name}</Text>
                <Text style={styles.bidderBudget}>💰 ${player.budget}M</Text>
              </View>
              <TouchableOpacity
                style={styles.bidButtonGreen}
                onPress={() => incrementBid(player.id)}
              >
                <ChevronUp size={24} color="#fff" />
                <Text style={styles.bidButtonText}>+5M</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {canSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>
              ⏭️ Saltar Jugador ({(skipsPerPosition[currentPosition] || 0)}/2)
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.playersSquadSection}>
          <Text style={styles.squadsSectionTitle}>Plantillas Actuales:</Text>
          {players.map((player) => {
            const counts = getPlayerPositionCounts(player);
            return (
              <View key={player.id} style={styles.compactPlayerCard}>
                <View style={styles.compactPlayerHeader}>
                  <Text style={styles.compactPlayerName}>{player.name}</Text>
                  <Text style={styles.compactPlayerBudget}>💰 ${player.budget}M</Text>
                </View>
                <Text style={styles.compactSquadCount}>
                  POR: {counts.Goalkeeper} | DEF: {counts.Defender} | MED: {counts.Midfielder} | DEL: {counts.Forward}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderRevealedPhase = () => {
    const rarity = targetFootballer ? getRarity(targetFootballer) : "BRONZE";
    const rarityColors: { [key: string]: string } = {
      BRONZE: COLORS.bronze,
      SILVER: COLORS.silver,
      GOLD: COLORS.gold,
      LEGEND: COLORS.legendRed,
      GOAT: COLORS.gold,
      FUTTIES: COLORS.futties,
    };

    const getRatingColor = (rating: number) => {
      if (rating >= 90) return "#FF4444";
      if (rating >= 85) return COLORS.gold;
      if (rating >= 82) return COLORS.silver;
      return COLORS.bronze;
    };

    const isPrime = targetFootballer?.isPrime || false;
    const isHighRating = (targetFootballer?.rating || 0) >= 90;

    return (
      <ScrollView style={styles.revealedContainer}>
        <Text style={styles.revealedTitle}>🎉 ¡Jugador Ganado!</Text>
        {targetFootballer && currentBid && (
          <View style={styles.revealedCard}>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColors[rarity] }]}>
              <Text style={styles.rarityText}>{rarity}</Text>
            </View>
            <Image
              source={{ uri: targetFootballer.imageUrl }}
              style={styles.revealedImage}
              resizeMode="contain"
            />
            <Text style={[
              styles.revealedName,
              targetFootballer.isPrime && styles.primeText
            ]}>
              {targetFootballer.name}
            </Text>
            {targetFootballer.isLegend && (
              <Text style={styles.legendBadge}>⭐ LEYENDA ⭐</Text>
            )}
            {targetFootballer.isPrime && (
              <Text style={styles.primeBadge}>👑 PRIME 👑</Text>
            )}
            <Text style={styles.revealedPosition}>{targetFootballer.position}</Text>
            <Text style={styles.revealedInfo}>
              {targetFootballer.nationality} | {targetFootballer.league}
            </Text>
            <View style={[styles.ratingContainer, isPrime && styles.ratingContainerPrime]}>
              <Text style={styles.revealedRatingLabel}>RATING</Text>
              <View style={styles.ratingValueContainer}>
                {isPrime ? (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Text style={[styles.revealedRatingValue, { color: getRatingColor(targetFootballer.rating) }, styles.primeRatingText]}>
                      {targetFootballer.rating}
                    </Text>
                  </Animated.View>
                ) : (
                  <Text style={[styles.revealedRatingValue, { color: getRatingColor(targetFootballer.rating) }]}>
                    {targetFootballer.rating}
                  </Text>
                )}
                {(isPrime || isHighRating) && (
                  <View style={styles.effectsContainer}>
                    {isPrime && <Text style={styles.goatEmoji}>🐐</Text>}
                    <Animated.Text style={[styles.sparkEffect, { opacity: sparkleAnim1 }]}>✨</Animated.Text>
                    <Animated.Text style={[styles.sparkEffect, { opacity: sparkleAnim2 }]}>✨</Animated.Text>
                    <Animated.Text style={[styles.sparkEffect, { opacity: sparkleAnim3 }]}>✨</Animated.Text>
                    {isHighRating && <Flame size={24} color="#FF4444" />}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.winnerInfo}>
              <Text style={styles.winnerText}>Ganador: {currentBid.playerName}</Text>
              <Text style={styles.winnerAmount}>💰 ${currentBid.amount}M</Text>
            </View>
          </View>
        )}

        <View style={styles.playersSquadSection}>
          <Text style={styles.squadsSectionTitle}>Plantillas Actuales:</Text>
          {players.map((player) => {
            const counts = getPlayerPositionCounts(player);
            return (
              <View key={player.id} style={styles.compactPlayerCard}>
                <View style={styles.compactPlayerHeader}>
                  <Text style={styles.compactPlayerName}>{player.name}</Text>
                  <Text style={styles.compactPlayerBudget}>💰 ${player.budget}M</Text>
                </View>
                <Text style={styles.compactSquadCount}>
                  POR: {counts.Goalkeeper} | DEF: {counts.Defender} | MED: {counts.Midfielder} | DEL: {counts.Forward}
                </Text>
                {player.squad.length > 0 && (
                  <View style={styles.miniSquadGrid}>
                    {player.squad.map((footballer: Footballer) => (
                      <View key={footballer.id} style={styles.miniSquadCard}>
                        <Text style={styles.miniSquadName} numberOfLines={1}>{footballer.name.split(" ")[0]}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.continueText}>Continuando en 7 segundos...</Text>
      </ScrollView>
    );
  };

  const renderTransferPhase = () => {
    const activeOffers = transferOffers.filter((o) => o.status === "pending");
    
    return (
    <ScrollView style={styles.transferContainer}>
      <Text style={styles.transferTitle}>🔄 Periodo de Transferencias</Text>
      
      <View style={styles.transferForm}>
        <Text style={styles.transferLabel}>Crear Oferta de Transferencia:</Text>
        
        <Text style={styles.inputLabel}>De (tu nombre):</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowFromPlayerPicker(!showFromPlayerPicker)}
        >
          <Text style={styles.pickerButtonText}>{transferFrom || "Seleccionar jugador"}</Text>
          <ChevronDown size={20} color="#4CAF50" />
        </TouchableOpacity>
        {showFromPlayerPicker && (
          <View style={styles.pickerDropdown}>
            {players.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.pickerItem}
                onPress={() => {
                  setTransferFrom(player.name);
                  setShowFromPlayerPicker(false);
                  setOfferedFootballerId("");
                }}
              >
                <Text style={styles.pickerItemText}>{player.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.inputLabel}>Para:</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowToPlayerPicker(!showToPlayerPicker)}
        >
          <Text style={styles.pickerButtonText}>{transferTo || "Seleccionar jugador"}</Text>
          <ChevronDown size={20} color="#4CAF50" />
        </TouchableOpacity>
        {showToPlayerPicker && (
          <View style={styles.pickerDropdown}>
            {players.filter(p => p.name !== transferFrom).map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.pickerItem}
                onPress={() => {
                  setTransferTo(player.name);
                  setShowToPlayerPicker(false);
                  setRequestedFootballerId("");
                }}
              >
                <Text style={styles.pickerItemText}>{player.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {transferFrom && (
          <>
            <Text style={styles.inputLabel}>Tu Futbolista (ofrecer):</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowOfferedPlayerPicker(!showOfferedPlayerPicker)}
            >
              <Text style={styles.pickerButtonText}>
                {offeredFootballerId
                  ? players.find(p => p.name === transferFrom)?.squad.find(f => f.id === offeredFootballerId)?.name || "Seleccionar"
                  : "Seleccionar futbolista"}
              </Text>
              <ChevronDown size={20} color="#4CAF50" />
            </TouchableOpacity>
            {showOfferedPlayerPicker && (
              <View style={styles.pickerDropdown}>
                {players.find(p => p.name === transferFrom)?.squad.map((footballer) => (
                  <TouchableOpacity
                    key={footballer.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setOfferedFootballerId(footballer.id);
                      setShowOfferedPlayerPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{footballer.name} (⭐ {footballer.rating})</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {transferTo && (
          <>
            <Text style={styles.inputLabel}>Futbolista solicitado:</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRequestedPlayerPicker(!showRequestedPlayerPicker)}
            >
              <Text style={styles.pickerButtonText}>
                {requestedFootballerId
                  ? players.find(p => p.name === transferTo)?.squad.find(f => f.id === requestedFootballerId)?.name || "Seleccionar"
                  : "Seleccionar futbolista"}
              </Text>
              <ChevronDown size={20} color="#4CAF50" />
            </TouchableOpacity>
            {showRequestedPlayerPicker && (
              <View style={styles.pickerDropdown}>
                {players.find(p => p.name === transferTo)?.squad.map((footballer) => (
                  <TouchableOpacity
                    key={footballer.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setRequestedFootballerId(footballer.id);
                      setShowRequestedPlayerPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{footballer.name} (⭐ {footballer.rating})</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <Text style={styles.inputLabel}>Monto adicional (M):</Text>
        <View style={styles.amountControls}>
          <TouchableOpacity
            style={styles.amountButton}
            onPress={() => setTransferAmount(Math.max(0, transferAmount - 5))}
          >
            <Minus size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.amountDisplay}>
            <Text style={styles.amountText}>${transferAmount}M</Text>
          </View>
          <TouchableOpacity
            style={styles.amountButton}
            onPress={() => setTransferAmount(transferAmount + 5)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.createOfferButton, (!transferFrom || !transferTo || !offeredFootballerId || !requestedFootballerId) && styles.createOfferButtonDisabled]}
          onPress={() => {
            const fromPlayer = players.find((p) => p.name === transferFrom);
            const toPlayer = players.find((p) => p.name === transferTo);
            
            if (fromPlayer && toPlayer && offeredFootballerId && requestedFootballerId) {
              createTransferOffer(
                fromPlayer.id,
                toPlayer.id,
                offeredFootballerId,
                requestedFootballerId,
                transferAmount
              );
              setTransferFrom("");
              setTransferTo("");
              setOfferedFootballerId("");
              setRequestedFootballerId("");
              setTransferAmount(0);
            }
          }}
          disabled={!transferFrom || !transferTo || !offeredFootballerId || !requestedFootballerId}
        >
          <Text style={styles.createOfferButtonText}>Crear Oferta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.offersSection}>
        <Text style={styles.offersSectionTitle}>Ofertas Activas:</Text>
        {activeOffers.map((offer) => {
          const fromPlayer = players.find((p) => p.id === offer.fromPlayerId);
          const toPlayer = players.find((p) => p.id === offer.toPlayerId);
          const offeredFootballer = fromPlayer?.squad.find((f) => f.id === offer.offeredFootballerId);
          const requestedFootballer = toPlayer?.squad.find((f) => f.id === offer.requestedFootballerId);
          const timeLeft = Math.max(0, Math.ceil((offer.expiresAt - Date.now()) / 1000));

          return (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.offerTimerText}>⏱️ {timeLeft}s</Text>
              </View>
              <Text style={styles.offerText}>
                {fromPlayer?.name} ofrece {offeredFootballer?.name || "Jugador desconocido"}
                {offer.offerAmount > 0 && ` + ${offer.offerAmount}M`} por {requestedFootballer?.name || "Jugador desconocido"} de {toPlayer?.name}
              </Text>
              <Text style={styles.offerPlayerNames}>
                Comprador: {fromPlayer?.name} | Vendedor: {toPlayer?.name}
              </Text>
              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => respondToTransfer(offer.id, true)}
                >
                  <Text style={styles.acceptButtonText}>✅ Aceptar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => respondToTransfer(offer.id, false)}
                >
                  <Text style={styles.rejectButtonText}>❌ Rechazar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {activeOffers.length === 0 && (
          <Text style={styles.noOffersText}>No hay ofertas activas</Text>
        )}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={proceedFromTransfer}>
        <Text style={styles.continueButtonText}>Continuar al Siguiente Round</Text>
      </TouchableOpacity>

      <View style={styles.playersSquadSection}>
        <Text style={styles.squadsSectionTitle}>Plantillas Actuales:</Text>
        {players.map((player) => {
          const counts = getPlayerPositionCounts(player);
          return (
            <View key={player.id} style={styles.compactPlayerCard}>
              <View style={styles.compactPlayerHeader}>
                <Text style={styles.compactPlayerName}>{player.name}</Text>
                <Text style={styles.compactPlayerBudget}>💰 ${player.budget}M</Text>
              </View>
              <Text style={styles.compactSquadCount}>
                POR: {counts.Goalkeeper} | DEF: {counts.Defender} | MED: {counts.Midfielder} | DEL: {counts.Forward}
              </Text>
              {player.squad.map((footballer) => (
                <Text key={footballer.id} style={styles.squadPlayerItem}>
                  {footballer.name} (ID: {footballer.id})
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
    );
  };

  const renderVotingPhase = () => {
    const allVoted = players.every((p) => hasVoted[p.id]);

    const handleVote = (voterId: string, votedForId: string) => {
      if (voterId === votedForId) return;
      castVote(voterId, votedForId);
      setHasVoted({ ...hasVoted, [voterId]: true });
    };

    const voteResults = getVoteResults();
    const playersWithRatings = players.map((player) => {
      const totalRating = player.squad.reduce((sum, footballer) => sum + footballer.rating, 0);
      return { ...player, totalRating };
    });
    const sortedByRatings = [...playersWithRatings].sort((a, b) => b.totalRating - a.totalRating);

    return (
      <ScrollView style={styles.votingContainer}>
        <Text style={styles.votingTitle}>🗳️ ¡Vota por el Mejor Equipo!</Text>

        {!allVoted ? (
          <View>
            {players.map((voter) => (
              <View key={voter.id} style={styles.voterSection}>
                <Text style={styles.voterName}>
                  {voter.name} {hasVoted[voter.id] ? "✅" : "- Tu turno"}
                </Text>
                {!hasVoted[voter.id] && (
                  <View style={styles.voteOptions}>
                    {players
                      .filter((p) => p.id !== voter.id)
                      .map((candidate) => (
                        <TouchableOpacity
                          key={candidate.id}
                          style={styles.voteButton}
                          onPress={() => handleVote(voter.id, candidate.id)}
                        >
                          <Text style={styles.voteButtonText}>
                            Votar por {candidate.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </View>
            ))}

            {allVoted && (
              <TouchableOpacity
                style={styles.showResultsButton}
                onPress={() => setShowResults(true)}
              >
                <Text style={styles.showResultsButtonText}>Ver Resultados</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {(showResults || allVoted) && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>📊 Resultados:</Text>
            {sortedByRatings.map((player, index) => {
              const votesReceived = voteResults[player.id];
              return (
                <View
                  key={player.id}
                  style={[
                    styles.finalPlayerCard,
                    index === 0 && styles.winnerCard,
                  ]}
                >
                  <View style={styles.finalPlayerHeader}>
                    <Text style={styles.finalPlayerRank}>
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </Text>
                    <Text style={styles.finalPlayerName}>{player.name}</Text>
                    <Text style={styles.voteCount}>🗳️ {votesReceived}</Text>
                  </View>

                  <Text style={styles.finalPlayerSpent}>
                    💰 Gastó: ${player.totalSpent}M | Restante: ${player.budget}M
                  </Text>
                  <Text style={styles.totalRatingText}>
                    ⚡ Rating Total: {player.totalRating}
                  </Text>

                  <Text style={styles.squadTitle}>FORMACIÓN INICIAL</Text>
                  
                  <View style={styles.formationLayout}>
                    <View style={styles.formationPlayersList}>
                      {player.squad.map((footballer: Footballer, idx) => (
                        <View key={footballer.id} style={styles.formationPlayerRow}>
                          <View style={styles.formationPositionBadge}>
                            <Text style={styles.formationPositionText}>{idx + 1}</Text>
                          </View>
                          <View style={styles.formationPlayerInfo}>
                            <Text style={[styles.formationPlayerName, footballer.isPrime && styles.primeText]} numberOfLines={1}>
                              {footballer.name.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.formationField}>
                      <View style={styles.formationLine}>
                        {player.squad.filter(f => f.position === "Forward").map((footballer, idx) => (
                          <View key={footballer.id} style={styles.formationPlayerCircle}>
                            <Text style={styles.formationCircleNumber}>{idx + 9}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <View style={styles.formationLine}>
                        {player.squad.filter(f => f.position === "Midfielder").map((footballer, idx) => (
                          <View key={footballer.id} style={styles.formationPlayerCircle}>
                            <Text style={styles.formationCircleNumber}>{idx + 6}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <View style={styles.formationLine}>
                        {player.squad.filter(f => f.position === "Defender").map((footballer, idx) => (
                          <View key={footballer.id} style={styles.formationPlayerCircle}>
                            <Text style={styles.formationCircleNumber}>{idx + 2}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <View style={styles.formationLine}>
                        {player.squad.filter(f => f.position === "Goalkeeper").map((footballer) => (
                          <View key={footballer.id} style={styles.formationPlayerCircle}>
                            <Text style={styles.formationCircleNumber}>1</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>Jugar de Nuevo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {phase === "setup" && renderSetupPhase()}
      {phase === "waiting" && renderWaitingPhase()}
      {phase === "active" && renderActivePhase()}
      {phase === "revealed" && renderRevealedPhase()}
      {phase === "transfer" && renderTransferPhase()}
      {phase === "voting" && renderVotingPhase()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  setupContainer: {
    flex: 1,
    backgroundColor: COLORS.dark,
    justifyContent: "center",
    alignItems: "center" as const,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center" as const,
    marginBottom: 60,
  },
  gameLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.gold,
  },
  gameTitle: {
    fontSize: 36,
    fontWeight: "900" as const,
    color: "#fff",
    letterSpacing: 4,
    marginBottom: 8,
  },
  gameSubtitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.gold,
    letterSpacing: 2,
  },
  setupCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 24,
    padding: 32,
    width: "100%" as const,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  setupCardTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 8,
  },
  setupCardSubtitle: {
    fontSize: 14,
    color: COLORS.gold,
    marginBottom: 32,
  },
  playerCountSection: {
    marginBottom: 32,
  },
  playerCountLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 16,
  },
  playerCountButtons: {
    flexDirection: "row" as const,
    gap: 12,
    justifyContent: "center" as const,
  },
  playerCountButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.dark,
    borderWidth: 2,
    borderColor: COLORS.darkBorder,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  playerCountButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  playerCountButtonText: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#888",
  },
  playerCountButtonTextActive: {
    color: "#fff",
  },
  playersInputSection: {
    gap: 12,
    marginBottom: 32,
  },
  playerInputRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  playerInputLabel: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: COLORS.gold,
    width: 30,
  },
  playerInput: {
    flex: 1,
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  startGameButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 18,
    alignItems: "center" as const,
  },
  startGameButtonText: {
    fontSize: 18,
    fontWeight: "900" as const,
    color: "#fff",
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.gold,
    textAlign: "center",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  startButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  waitingContainer: {
    flex: 1,
  },
  statsHeader: {
    backgroundColor: COLORS.dark,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  statsHeaderGradient: {
    alignItems: "center" as const,
  },
  statsTitle: {
    fontSize: 32,
    fontWeight: "900" as const,
    color: "#fff",
    letterSpacing: 4,
    marginBottom: 16,
  },
  statsDivider: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    marginBottom: 24,
  },
  nextPositionCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 20,
    width: "100%" as const,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: COLORS.gold,
    marginBottom: 16,
  },
  nextPositionLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  nextPositionValue: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: "#fff",
  },
  skipsCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  skipsLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#888",
  },
  skipsIndicator: {
    flexDirection: "row" as const,
    gap: 8,
  },
  skipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2a3050",
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  skipDotActive: {
    backgroundColor: COLORS.gold,
  },
  leaderboardSection: {
    padding: 20,
  },
  leaderboardTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 20,
  },
  leaderboardCards: {
    gap: 16,
  },
  modernPlayerCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  leaderCard: {
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: "#252a4a",
  },
  modernCardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 16,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  rankBadgeText: {
    fontSize: 20,
  },
  modernPlayerName: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#fff",
    flex: 1,
  },
  leaderName: {
    color: COLORS.gold,
  },
  statsRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 12,
    alignItems: "center" as const,
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#888",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: "900" as const,
    color: COLORS.gold,
  },
  budgetValue: {
    color: COLORS.gold,
  },
  positionBarsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  positionBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  positionBarLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#888",
    width: 30,
  },
  positionBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.dark,
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  positionBarFill: {
    height: "100%" as const,
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  positionBarCount: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: COLORS.gold,
    width: 35,
    textAlign: "right" as const,
  },
  bestPlayerBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 12,
  },
  bestPlayerIcon: {
    fontSize: 24,
  },
  bestPlayerInfo: {
    flex: 1,
  },
  bestPlayerTitle: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#888",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bestPlayerNameText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
  },
  modernStartButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: "center" as const,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modernStartButtonText: {
    fontSize: 18,
    fontWeight: "900" as const,
    color: "#fff",
    letterSpacing: 2,
  },
  positionText: {
    fontSize: 20,
    color: COLORS.gold,
    textAlign: "center",
    marginBottom: 10,
  },
  skipInfoText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 30,
  },
  playersGrid: {
    marginBottom: 30,
  },
  playerCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  leadingPlayerCard: {
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: "#2a2f4a",
  },
  playerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  playerRank: {
    fontSize: 20,
    fontWeight: "bold" as const,
  },
  bestPlayerContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2a3050",
  },
  bestPlayerLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  bestPlayerName: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: "bold" as const,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  budget: {
    fontSize: 16,
    color: COLORS.gold,
    marginBottom: 4,
  },
  squadCount: {
    fontSize: 14,
    color: "#888",
  },
  activeContainer: {
    flex: 1,
    padding: 20,
  },
  timerContainer: {
    alignItems: "center" as const,
    marginBottom: 30,
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  timerContainerCritical: {
    backgroundColor: "#3a1515",
    borderColor: "#FF4444",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "900" as const,
    color: COLORS.gold,
    letterSpacing: 2,
  },
  timerTextCritical: {
    color: "#FF4444",
  },
  footballerContainer: {
    alignItems: "center" as const,
    marginBottom: 30,
    backgroundColor: COLORS.darkCard,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.darkBorder,
  },
  silhouetteContainer: {
    width: width - 100,
    height: 300,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    position: "relative" as const,
  },
  silhouetteImage: {
    width: 240,
    height: 300,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  hintsContainer: {
    marginTop: 20,
    width: "100%",
  },
  hint: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  hintText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  biddingSection: {
    alignItems: "center" as const,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  basePriceText: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: COLORS.gold,
    marginBottom: 10,
  },
  currentBidContainer: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  currentBidText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.gold,
  },
  bidderText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
  },
  eligibleTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: COLORS.gold,
    marginBottom: 16,
    marginHorizontal: 20,
    letterSpacing: 1,
  },
  bidderCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  bidderBudget: {
    fontSize: 16,
    color: COLORS.gold,
  },
  bidButtonGreen: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bidButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  skipButton: {
    backgroundColor: "#FF9800",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  revealedContainer: {
    flex: 1,
    padding: 20,
  },
  revealedTitle: {
    fontSize: 36,
    fontWeight: "900" as const,
    color: COLORS.gold,
    marginBottom: 30,
    textAlign: "center" as const,
    letterSpacing: 3,
  },
  revealedCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 24,
    padding: 32,
    alignItems: "center" as const,
    borderWidth: 3,
    borderColor: COLORS.gold,
    marginHorizontal: 20,
  },
  rarityBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  rarityText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  revealedImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  revealedName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  revealedPosition: {
    fontSize: 20,
    color: COLORS.gold,
    marginBottom: 8,
  },
  revealedInfo: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
    textAlign: "center",
  },
  winnerInfo: {
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  winnerText: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 8,
  },
  winnerAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.gold,
  },
  continueText: {
    fontSize: 16,
    color: "#888",
    marginTop: 30,
    textAlign: "center",
    marginBottom: 20,
  },
  ratingContainer: {
    alignItems: "center" as const,
    marginBottom: 20,
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 16,
    width: "100%" as const,
  },
  revealedRatingLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#888",
    letterSpacing: 2,
    marginBottom: 8,
  },
  ratingValueContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  revealedRatingValue: {
    fontSize: 48,
    fontWeight: "900" as const,
  },
  ratingContainerPrime: {
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  primeRatingText: {
    textShadowColor: COLORS.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  effectsContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  sparkEffect: {
    fontSize: 20,
  },
  goatEmoji: {
    fontSize: 28,
    marginRight: 4,
  },
  timerEffects: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    marginTop: 8,
  },
  timerSparkle: {
    fontSize: 16,
    color: "#FF4444",
  },
  finalPlayerCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  finalPlayerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  finalPlayerRank: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.gold,
  },
  finalPlayerName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  finalPlayerSpent: {
    fontSize: 16,
    color: "#888",
  },
  squadTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    marginTop: 12,
  },
  formationText: {
    fontSize: 14,
    color: COLORS.gold,
    marginBottom: 16,
  },
  squadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  squadCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    padding: 8,
    width: (width - 80) / 3,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  squadImage: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  squadName: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
  squadPos: {
    fontSize: 10,
    color: "#888",
    textAlign: "center",
  },
  squadRating: {
    fontSize: 10,
    color: COLORS.gold,
    textAlign: "center",
    marginTop: 2,
  },
  playersSquadSection: {
    marginTop: 30,
    paddingBottom: 20,
  },
  squadsSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  compactPlayerCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  compactPlayerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  compactPlayerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  compactPlayerBudget: {
    fontSize: 14,
    color: COLORS.gold,
  },
  compactSquadCount: {
    fontSize: 12,
    color: "#888",
  },
  miniSquadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  miniSquadCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  miniSquadName: {
    fontSize: 10,
    color: COLORS.gold,
  },
  votingContainer: {
    flex: 1,
    padding: 20,
  },
  votingTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.gold,
    textAlign: "center",
    marginBottom: 30,
  },
  voterSection: {
    marginBottom: 30,
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  voterName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  voteOptions: {
    gap: 12,
  },
  voteButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  showResultsButton: {
    backgroundColor: "#FF9800",
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    alignItems: "center",
  },
  showResultsButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  resultsSection: {
    marginTop: 30,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  winnerCard: {
    borderWidth: 3,
    borderColor: COLORS.gold,
    backgroundColor: "#2a2f4a",
  },
  voteCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gold,
  },
  resetButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  primeText: {
    color: COLORS.gold,
  },
  legendBadge: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 8,
  },
  primeBadge: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 8,
  },
  totalRatingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 8,
  },
  transferContainer: {
    flex: 1,
    padding: 20,
  },
  transferTitle: {
    fontSize: 32,
    fontWeight: "900" as const,
    color: COLORS.gold,
    textAlign: "center" as const,
    marginBottom: 30,
    letterSpacing: 2,
  },
  transferForm: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  transferLabel: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: COLORS.gold,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
    marginTop: 12,
  },
  createOfferButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
    alignItems: "center",
  },
  createOfferButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  offersSection: {
    marginBottom: 20,
  },
  offersSectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: COLORS.gold,
    marginBottom: 16,
    letterSpacing: 1,
  },
  offerCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  offerText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 12,
  },
  offerActions: {
    flexDirection: "row",
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#F44336",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  continueButton: {
    backgroundColor: "#FF9800",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  squadPlayerItem: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  offerHeader: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  offerTimerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF9800",
  },
  offerPlayerNames: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
  },
  noOffersText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  pickerButton: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  pickerDropdown: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
    maxHeight: 200,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a3050",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#fff",
  },
  amountControls: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginTop: 8,
  },
  amountButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    padding: 12,
    width: 50,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  amountDisplay: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: "center" as const,
  },
  amountText: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: COLORS.gold,
  },
  createOfferButtonDisabled: {
    opacity: 0.5,
  },
  formationLayout: {
    flexDirection: "row" as const,
    gap: 16,
    marginTop: 16,
  },
  formationPlayersList: {
    flex: 1,
  },
  formationPlayerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#1a2847",
    marginBottom: 6,
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  formationPositionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#991b1b",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  formationPositionText: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: "#fff",
  },
  formationPlayerInfo: {
    flex: 1,
  },
  formationPlayerName: {
    fontSize: 11,
    fontWeight: "bold" as const,
    color: "#fff",
  },
  formationField: {
    flex: 1,
    backgroundColor: "#0f4125",
    borderRadius: 12,
    padding: 12,
    justifyContent: "space-between" as const,
    minHeight: 300,
  },
  formationLine: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    alignItems: "center" as const,
  },
  formationPlayerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#991b1b",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 3,
    borderColor: "#fff",
  },
  formationCircleNumber: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: "#fff",
  },
  modeButton: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: "center" as const,
  },
  modeButtonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modeButtonText: {
    fontSize: 20,
    fontWeight: "900" as const,
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  modeButtonSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center" as const,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: "600" as const,
  },
  roomCodeContainer: {
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 24,
    marginVertical: 24,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  roomCodeLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#888",
    letterSpacing: 2,
    marginBottom: 12,
  },
  roomCodeText: {
    fontSize: 48,
    fontWeight: "900" as const,
    color: COLORS.gold,
    letterSpacing: 8,
    marginBottom: 12,
  },
  roomCodeSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center" as const,
  },
  waitingText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center" as const,
    marginBottom: 24,
  },
  startGameButtonDisabled: {
    opacity: 0.5,
  },
});
