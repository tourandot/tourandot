import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { toursRoutes } from "./routes/tours.js";
import { partyRoutes } from "./routes/party.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

await app.register(websocket);

// Health check
app.get("/health", async () => {
  return { status: "ok" };
});

// Register routes
app.register(toursRoutes, { prefix: "/tours" });
app.register(partyRoutes, { prefix: "/party" });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000", 10);
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
