import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import createRoomRoute from "./routes/room/create";
import joinRoomRoute from "./routes/room/join";
import getRoomStateRoute from "./routes/room/get-state";
import updateStateRoute from "./routes/room/update-state";
import updatePlayerRoute from "./routes/room/update-player";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  room: createTRPCRouter({
    create: createRoomRoute,
    join: joinRoomRoute,
    getState: getRoomStateRoute,
    updateState: updateStateRoute,
    updatePlayer: updatePlayerRoute,
  }),
});

export type AppRouter = typeof appRouter;
