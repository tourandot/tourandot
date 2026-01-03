import { FastifyInstance } from "fastify";
import { getAudioKey, getAudioUrl, checkAudioFiles } from "../services/storage.js";

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
        lat: 37.7749,
        lng: -122.4194,
      },
      {
        id: "stop-2",
        order: 2,
        title: "Old Market Square",
        description: "Where merchants have gathered for centuries",
        lat: 37.776,
        lng: -122.418,
      },
    ],
    route: {
      // GeoJSON LineString coordinates
      coordinates: [],
    },
  },
};

// Stop narrations - keyed by stop_id, then by style
interface StopNarration {
  stopId: string;
  style: "quick" | "balanced" | "verbose";
  text: string;
  audioUrl?: string;
  durationSeconds?: number;
}

// Individual facts for "More Facts" feature - requested one at a time
interface StopFact {
  id: string;
  stopId: string;
  order: number;
  text: string;
  audioUrl?: string;
  durationSeconds?: number;
}

const stopNarrations: Record<string, StopNarration[]> = {
  "stop-1": [
    {
      stopId: "stop-1",
      style: "quick",
      text: `Welcome to City Hall, built in 1915 in the Beaux-Arts style. This grand building replaced the original that was destroyed in the 1906 earthquake. Its dome rises 307 feet—taller than the U.S. Capitol. Look up to see the ornate gold leaf detailing that was restored in the 1990s renovation.`,
    },
    {
      stopId: "stop-1",
      style: "balanced",
      text: `You're standing before City Hall, one of the most beautiful civic buildings in America. Completed in 1915, it rose from the ashes of the 1906 earthquake that devastated this city. Architects Arthur Brown Jr. and John Bakewell designed it in the Beaux-Arts style, drawing inspiration from St. Peter's Basilica in Rome.

The dome you see reaches 307 feet at its peak—intentionally designed to exceed the U.S. Capitol by about 40 feet. Some say this was the architects' way of expressing the city's ambition and independence.

Inside, the grand rotunda features a sweeping marble staircase where countless couples have married over the decades. The building underwent a major seismic retrofit in the 1990s, and the dome was regilded with real gold leaf—the same material that once drew prospectors here during the Gold Rush.`,
    },
    {
      stopId: "stop-1",
      style: "verbose",
      text: `Welcome to City Hall, widely considered one of the finest examples of Beaux-Arts architecture in the United States. The building you see today was completed in 1915, but its story begins with tragedy.

The original City Hall, an ornate Victorian structure, took 27 years to build due to corruption and mismanagement. When the devastating earthquake struck on April 18, 1906, it collapsed almost immediately—a symbol of the graft that had plagued its construction. The new City Hall was built to prove the city could do better.

Architects Arthur Brown Jr. and John Bakewell Jr.—both trained at the prestigious École des Beaux-Arts in Paris—won the design competition. They created a masterpiece inspired by St. Peter's Basilica and Les Invalides in Paris. The dome rises 307 feet and 6 inches, deliberately surpassing the U.S. Capitol dome by about 40 feet.

The exterior features Doric columns, baroque details, and sculptures by Henri Crenier representing "Commerce" and "Navigation." The building material is California granite, with the dome clad in copper and gold leaf.

Inside, the grand rotunda has hosted everything from state funerals to joyous wedding ceremonies. Harvey Milk and George Moscone were assassinated here in 1978, and the building saw massive celebrations when same-sex marriages were first performed in 2004.

During the 1989 Loma Prieta earthquake, the building suffered significant damage. A four-year, $300 million seismic retrofit followed, during which the entire building was essentially lifted and placed on base isolators—massive shock absorbers that allow the structure to move independently from the ground during an earthquake. The dome was regilded with real gold leaf during this restoration, reconnecting the building to the city's Gold Rush heritage.`,
    },
  ],
  "stop-2": [
    {
      stopId: "stop-2",
      style: "quick",
      text: `This is Old Market Square, the commercial heart of the city since 1850. Merchants, farmers, and traders gathered here to sell goods brought by ship and wagon. The cobblestones beneath your feet are original—worn smooth by over 170 years of foot traffic. The fountain at the center was added in 1892.`,
    },
    {
      stopId: "stop-2",
      style: "balanced",
      text: `Welcome to Old Market Square, where commerce has thrived for over 170 years. In the 1850s, this was the busiest spot in the region—a chaotic, vibrant marketplace where Gold Rush miners bought supplies, farmers sold produce, and merchants hawked everything from pickaxes to patent medicines.

The cobblestones you're walking on are original, laid in 1868 to replace the wooden planks that kept rotting in the fog. Local legend says some stones were actually ship ballast, brought from Europe in the hulls of trading vessels.

The ornate fountain at the square's center was commissioned in 1892 by the Merchants' Association. It depicts Neptune surrounded by sea creatures—a nod to the city's maritime heritage. During the Gold Rush, water was so scarce that people paid a dollar a bucket. The fountain was a symbol of abundance and progress.

The buildings surrounding the square represent different eras. The brick Italianate structures on the east side date to the 1870s. The Beaux-Arts bank building on the north corner was built in 1905—and remarkably survived the 1906 earthquake with only minor damage.`,
    },
    {
      stopId: "stop-2",
      style: "verbose",
      text: `You've arrived at Old Market Square, the commercial and social heart of this city for over 170 years. To truly appreciate this space, you need to imagine it as it was in 1850: a muddy, chaotic marketplace where fortunes were made and lost daily.

During the Gold Rush, this square was ground zero for commerce. Ships arrived daily at the nearby wharf, their holds full of goods from around the world. Merchants would rush to the docks, buy entire cargoes sight unseen, then haul their purchases here to sell at enormous markups. A shovel that cost $1 in New York might sell for $50 here. Eggs from Chile were worth their weight in gold—almost literally.

The cobblestones beneath your feet were laid in 1868, replacing wooden planks that required constant maintenance due to the damp climate. These granite setts were quarried locally and hand-laid by Chinese laborers who were paid a fraction of what white workers earned. Local historians believe some stones may have come from ship ballast—heavy material carried in empty vessels for stability—though this has never been conclusively proven.

The Neptune Fountain you see at the square's center was installed in 1892. Sculptor Antonio Ferretti spent three years creating the bronze figures. Neptune holds his trident aloft, surrounded by dolphins, seahorses, and allegorical figures representing the four major rivers that supplied the city's water. The fountain was controversial at the time—some citizens thought the $40,000 cost was extravagant. Today it's on the National Register of Historic Places.

Look at the buildings surrounding the square. The red brick structures on the eastern edge are Italianate commercial buildings from the 1870s, featuring cast-iron facades manufactured in New York and shipped around Cape Horn. The grand Beaux-Arts building on the north corner is the former Merchants Bank, built in 1905. Its massive vault doors and reinforced foundations helped it survive the 1906 earthquake largely intact, and it became a makeshift relief center in the disaster's aftermath.

The western side of the square was completely rebuilt in the 1920s after a fire. These Art Deco buildings, with their geometric ornaments and streamlined facades, represent the city's recovery and modernization.`,
    },
  ],
};

// Individual facts per stop - users can request these one at a time via "More Facts" button
const stopFacts: Record<string, StopFact[]> = {
  "stop-1": [
    {
      id: "stop-1-fact-1",
      stopId: "stop-1",
      order: 1,
      text: `This building has starred in Hollywood! City Hall appeared in "Raiders of the Lost Ark" doubling as a Washington D.C. government building, and Clint Eastwood walked these halls in "Dirty Harry." The grand interiors have made it a favorite for filmmakers seeking that classic civic grandeur.`,
    },
    {
      id: "stop-1-fact-2",
      stopId: "stop-1",
      order: 2,
      text: `During Prohibition, the basement allegedly housed a speakeasy frequented by city officials themselves. While some historians dispute this, maintenance workers over the years have reported finding hidden compartments and old bottles tucked away in the walls. The politicians who enforced the law may have been bending it downstairs.`,
    },
    {
      id: "stop-1-fact-3",
      stopId: "stop-1",
      order: 3,
      text: `The gold leaf covering that magnificent dome weighs only about one pound total—yet it would cost over $400,000 to replace at today's gold prices. Each sheet is thinner than a human hair, applied by hand by master craftsmen during the 1990s restoration.`,
    },
    {
      id: "stop-1-fact-4",
      stopId: "stop-1",
      order: 4,
      text: `Marilyn Monroe and baseball legend Joe DiMaggio were married in this building on January 14, 1954. The ceremony took place in a judge's chambers on the second floor. Their marriage would last only 274 days, but it remains one of the most famous weddings in American pop culture history.`,
    },
    {
      id: "stop-1-fact-5",
      stopId: "stop-1",
      order: 5,
      text: `Before electric lighting was common, the architects solved a tricky problem: how do you illuminate a massive building? Their solution was "light courts"—interior spaces open to the sky that flood the building with natural light. They still function today, creating dramatic shifting shadows as the sun moves across the sky.`,
    },
  ],
  "stop-2": [
    {
      id: "stop-2-fact-1",
      stopId: "stop-2",
      order: 1,
      text: `There's a ship buried beneath your feet! In 1851, a vessel called the Niantic was deliberately beached near here and converted into a warehouse and hotel. As the city expanded, it was buried under landfill and forgotten. Its remains were rediscovered during construction in 1978—champagne bottles and miners' boots still inside.`,
    },
    {
      id: "stop-2-fact-2",
      stopId: "stop-2",
      order: 2,
      text: `This square witnessed the city's first execution in 1852. A man named John Jenkins was hanged by the Vigilance Committee—a group of citizens who took law into their own hands—for stealing a safe. A small plaque on the northeast corner marks the approximate spot where it happened.`,
    },
    {
      id: "stop-2-fact-3",
      stopId: "stop-2",
      order: 3,
      text: `During the 1934 General Strike, this square became ground zero for the labor movement. Workers gathered here by the thousands as the strike paralyzed the entire West Coast for four days. Two strikers were killed by police nearby, and the event transformed American labor relations forever.`,
    },
    {
      id: "stop-2-fact-4",
      stopId: "stop-2",
      order: 4,
      text: `See that hardware store on the corner? It's been in continuous operation since 1864—now run by the sixth generation of the same family. Step inside and you'll find the original wooden floors and pressed tin ceiling. They still sell some of the same types of tools their great-great-great-grandfather stocked.`,
    },
    {
      id: "stop-2-fact-5",
      stopId: "stop-2",
      order: 5,
      text: `Every Saturday since 1943, this square has hosted a farmers' market—one of the longest continuously running in the country. The only interruption was during World War II when gas rationing made it impossible for farmers to drive in. Look closely at the cobblestones near the fountain and you'll spot small brass plaques marking historic events, installed for the 1976 bicentennial.`,
    },
  ],
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

  // GET /tours/:id/narrations - Get all narrations and facts for a tour
  // Returns narrations grouped by stop, with all styles included, plus facts array
  // Includes audio URLs if audio has been generated
  app.get<{
    Params: { id: string };
    Querystring: { style?: string; checkAudio?: string };
  }>("/:id/narrations", async (request, reply) => {
    const { id } = request.params;
    const { style, checkAudio } = request.query;
    const tour = tourDetails[id as keyof typeof tourDetails];

    if (!tour) {
      return reply.status(404).send({ error: "Tour not found" });
    }

    // Build narrations response for each stop
    const narrations: Record<string, StopNarration[]> = {};
    const facts: Record<string, StopFact[]> = {};

    // Collect all audio keys to check
    const audioKeysToCheck: string[] = [];

    for (const stop of tour.stops) {
      const stopNarrationList = stopNarrations[stop.id] || [];
      const stopFactList = stopFacts[stop.id] || [];

      if (style) {
        narrations[stop.id] = stopNarrationList.filter((n) => n.style === style);
      } else {
        narrations[stop.id] = stopNarrationList;
      }

      facts[stop.id] = stopFactList.sort((a, b) => a.order - b.order);

      // Collect keys for audio check
      if (checkAudio === "true") {
        for (const n of narrations[stop.id]) {
          audioKeysToCheck.push(getAudioKey(stop.id, "narration", n.style));
        }
        for (const f of facts[stop.id]) {
          audioKeysToCheck.push(getAudioKey(stop.id, "fact", f.id));
        }
      }
    }

    // Check which audio files exist
    let audioFiles: Map<string, { exists: boolean; url: string }> | null = null;
    if (checkAudio === "true" && audioKeysToCheck.length > 0) {
      try {
        audioFiles = await checkAudioFiles(audioKeysToCheck);
      } catch (error) {
        console.warn("Failed to check audio files:", error);
      }
    }

    // Attach audio URLs to narrations and facts
    if (audioFiles) {
      for (const stop of tour.stops) {
        for (const n of narrations[stop.id]) {
          const key = getAudioKey(stop.id, "narration", n.style);
          const file = audioFiles.get(key);
          if (file?.exists) {
            n.audioUrl = file.url;
          }
        }
        for (const f of facts[stop.id]) {
          const key = getAudioKey(stop.id, "fact", f.id);
          const file = audioFiles.get(key);
          if (file?.exists) {
            f.audioUrl = file.url;
          }
        }
      }
    }

    return {
      tourId: id,
      narrations,
      facts,
    };
  });
}
