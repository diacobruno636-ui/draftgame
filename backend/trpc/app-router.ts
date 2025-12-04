import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import createRoomRoute from "./routes/room/create";
import joinRoomRoute from "./routes/room/join";
import getRoomStateRoute from "./routes/room/get-state";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  room: createTRPCRouter({
    create: createRoomRoute,
    join: joinRoomRoute,
    getState: getRoomStateRoute,
  }),
});

export type AppRouter = typeof appRouter;
