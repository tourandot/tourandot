import { FastifyInstance } from "fastify";

// Placeholder tour data - will be replaced with DB
const tours = [
  {
    id: "1",
    title: "Historic Downtown Walk",
    description: "Explore the heart of the city with stories from the past",
    duration: "2 hours",
    stops: 8,
    distance: "3.2 km",
    coverImage: null,
  },
];

const tourDetails = {
  "1": {
    id: "1",
    title: "Historic Downtown Walk",
    description: "Explore the heart of the city with stories from the past",
    duration: "2 hours",
    stops: [
      {
        id: "stop-1",
        order: 1,
        title: "City Hall",
        description: "The historic seat of local government",
        lat: 0,
        lng: 0,
      },
      {
        id: "stop-2",
        order: 2,
        title: "Old Market Square",
        description: "Where merchants have gathered for centuries",
        lat: 0,
        lng: 0,
      },
    ],
    route: {
      // GeoJSON LineString coordinates
      coordinates: [],
    },
  },
};

export async function toursRoutes(app: FastifyInstance) {
  // GET /tours - List all tours
  app.get("/", async () => {
    return { tours };
  });

  // GET /tours/:id - Get tour details
  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;
    const tour = tourDetails[id as keyof typeof tourDetails];

    if (!tour) {
      return reply.status(404).send({ error: "Tour not found" });
    }

    return { tour };
  });
}
