import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";

interface Party {
  code: string;
  tourId: string;
  hostId: string;
  config: {
    narrationStyle: "verbose" | "quick" | "balanced";
  };
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
  // POST /party - Create a new party
  app.post<{
    Body: {
      tourId: string;
      hostId: string;
      hostName: string;
      config: Party["config"];
    };
  }>("/", async (request) => {
    const { tourId, hostId, hostName, config } = request.body;

    const code = generateCode();
    const party: Party = {
      code,
      tourId,
      hostId,
      config,
      members: new Map([
        [hostId, { id: hostId, name: hostName, ready: false }],
      ]),
      status: "lobby",
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
    Body: { userId: string; name: string };
  }>("/:code/join", async (request, reply) => {
    const { code } = request.params;
    const { userId, name } = request.body;

    const party = parties.get(code.toUpperCase());

    if (!party) {
      return reply.status(404).send({ error: "Party not found" });
    }

    if (party.status !== "lobby") {
      return reply.status(400).send({ error: "Party already started" });
    }

    party.members.set(userId, { id: userId, name, ready: false });

    return {
      party: {
        ...party,
        members: Array.from(party.members.values()),
      },
    };
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
