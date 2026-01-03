import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";

interface Party {
  code: string;
  tourId: string;
  hostId: string;
  config: {
    narrationStyle: "verbose" | "quick" | "balanced";
  };
  joinMode: "open" | "pin";
  pin?: string;
  members: Map<
    string,
    {
      id: string;
      name: string;
      ready: boolean;
      location?: { lat: number; lng: number };
    }
  >;
  status: "lobby" | "active" | "completed";
  currentStop: number;
  createdAt: Date;
}

// In-memory party storage - will be replaced with Redis/DB
const parties = new Map<string, Party>();

function generateCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

export async function partyRoutes(app: FastifyInstance) {
  // GET /party/ongoing - List active parties (for nearby discovery)
  app.get("/ongoing", async () => {
    const activeParties = Array.from(parties.values())
      .filter((p) => p.status === "active")
      .map((p) => ({
        code: p.code,
        tourId: p.tourId,
        joinMode: p.joinMode,
        memberCount: p.members.size,
        createdAt: p.createdAt,
      }));

    return { parties: activeParties };
  });

  // POST /party - Create a new party
  app.post<{
    Body: {
      tourId: string;
      hostId: string;
      hostName: string;
      config: Party["config"];
      joinMode: "open" | "pin";
      pin?: string;
    };
  }>("/", async (request) => {
    const { tourId, hostId, hostName, config, joinMode, pin } = request.body;

    const code = generateCode();
    const party: Party = {
      code,
      tourId,
      hostId,
      config,
      joinMode,
      pin,
      members: new Map([
        [hostId, { id: hostId, name: hostName, ready: true }],
      ]),
      status: "active", // Start immediately, no lobby
      currentStop: 0,
      createdAt: new Date(),
    };

    parties.set(code, party);

    return {
      code,
      party: {
        ...party,
        members: Array.from(party.members.values()),
      },
    };
  });

  // GET /party/:code - Get party state
  app.get<{ Params: { code: string } }>("/:code", async (request, reply) => {
    const { code } = request.params;
    const party = parties.get(code.toUpperCase());

    if (!party) {
      return reply.status(404).send({ error: "Party not found" });
    }

    return {
      party: {
        ...party,
        members: Array.from(party.members.values()),
      },
    };
  });

  // POST /party/:code/join - Join a party
  app.post<{
    Params: { code: string };
    Body: { userId: string; name: string; pin?: string };
  }>("/:code/join", async (request, reply) => {
    const { code } = request.params;
    const { userId, name, pin } = request.body;

    const party = parties.get(code.toUpperCase());

    if (!party) {
      return reply.status(404).send({ error: "Party not found" });
    }

    if (party.status === "completed") {
      return reply.status(400).send({ error: "Tour has ended" });
    }

    // Check PIN if required
    if (party.joinMode === "pin" && party.pin !== pin) {
      return reply.status(401).send({ error: "Invalid PIN" });
    }

    party.members.set(userId, { id: userId, name, ready: true });

    return {
      party: {
        ...party,
        members: Array.from(party.members.values()),
      },
    };
  });

  // DELETE /party/:code - End/delete a party
  app.delete<{ Params: { code: string } }>("/:code", async (request, reply) => {
    const { code } = request.params;
    const deleted = parties.delete(code.toUpperCase());

    if (!deleted) {
      return reply.status(404).send({ error: "Party not found" });
    }

    return { success: true };
  });

  // POST /party/:code/ready - Mark self as ready
  app.post<{
    Params: { code: string };
    Body: { userId: string };
  }>("/:code/ready", async (request, reply) => {
    const { code } = request.params;
    const { userId } = request.body;

    const party = parties.get(code.toUpperCase());

    if (!party) {
      return reply.status(404).send({ error: "Party not found" });
    }

    const member = party.members.get(userId);
    if (member) {
      member.ready = true;
    }

    const allReady = Array.from(party.members.values()).every((m) => m.ready);

    return {
      ready: true,
      allReady,
      members: Array.from(party.members.values()),
    };
  });

  // WebSocket /party/:code/live - Real-time party sync
  app.get<{ Params: { code: string } }>(
    "/:code/live",
    { websocket: true },
    (socket, request) => {
      const { code } = request.params;
      const party = parties.get(code.toUpperCase());

      if (!party) {
        socket.close(4004, "Party not found");
        return;
      }

      socket.on("message", (rawMessage: Buffer) => {
        try {
          const message = JSON.parse(rawMessage.toString());

          switch (message.type) {
            case "location":
              // Update member location
              const member = party.members.get(message.userId);
              if (member) {
                member.location = message.location;
              }
              // Broadcast to all - TODO: implement proper broadcast
              break;

            case "start":
              // Host starts the tour
              if (message.userId === party.hostId) {
                party.status = "active";
                // Broadcast start signal
              }
              break;

            case "advance":
              // Host advances to next stop
              if (message.userId === party.hostId) {
                party.currentStop++;
                // Broadcast advance signal
              }
              break;

            case "play":
              // Trigger audio playback for current stop
              // Broadcast play signal to all
              break;
          }
        } catch (e) {
          console.error("Invalid message:", e);
        }
      });

      socket.on("close", () => {
        // Handle disconnect
      });
    }
  );
}
