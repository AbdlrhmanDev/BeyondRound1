import { NextRequest, NextResponse } from "next/server";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS = "https://overpass-api.de/api/interpreter";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "15", 10) || 15, 5), 25);

  if (!city) return NextResponse.json({ error: "city required" }, { status: 400 });

  try {
    // 1️⃣ Get city relation from Nominatim
    const geoRes = await fetch(
      `${NOMINATIM}?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { "User-Agent": "BeyondRounds/1.0" } }
    );
    const geo = await geoRes.json();
    if (!geo.length || geo[0].osm_type !== "relation") {
      return NextResponse.json(
        { neighborhoods: [] },
        { headers: { "Cache-Control": "public, max-age=3600" } }
      );
    }

    const areaId = 3600000000 + Number(geo[0].osm_id);

    // 2️⃣ Fetch all neighborhoods
    const neighborhoodQuery = `
      [out:json][timeout:25];
      area(${areaId})->.city;
      (
        node["place"~"suburb|neighbourhood|quarter|borough"](area.city);
        way["place"~"suburb|neighbourhood|quarter|borough"](area.city);
        relation["place"~"suburb|neighbourhood|quarter|borough"](area.city);
      );
      out tags;
    `;

    const r1 = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(neighborhoodQuery)}`
    });
    const raw = await r1.json();

    // 3️⃣ Clean names
    const banned = ["siedlung", "wohn", "block", "anlage", "park", "quartier", "campus", "straße"];
    const seen = new Set<string>();

    const neighborhoods = (raw.elements || [])
      .map((el: { tags?: { name?: string } }) => el.tags?.name)
      .filter(Boolean)
      .filter((name: string) => {
        const n = name.toLowerCase();
        if (seen.has(n)) return false;
        if (banned.some((w) => n.includes(w))) return false;
        if (n.length < 2) return false;
        seen.add(n);
        return true;
      });

    if (neighborhoods.length === 0) {
      return NextResponse.json(
        { neighborhoods: [] },
        { headers: { "Cache-Control": "public, max-age=3600" } }
      );
    }

    // 4️⃣ Social density per neighborhood (optional – skip if Overpass fails)
    let scores: Record<string, number> = {};
    try {
      const venueQuery = `
        [out:json][timeout:15];
        area(${areaId})->.city;
        (
          node["amenity"~"cafe|restaurant|bar"](area.city);
          node["leisure"="park"](area.city);
        );
        out tags center;
      `;
      const r2 = await fetch(OVERPASS, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(venueQuery)}`,
      });
      const venues = await r2.json();
      for (const v of venues.elements || []) {
        const suburb = v.tags?.["addr:suburb"] || v.tags?.["addr:neighbourhood"];
        if (!suburb) continue;
        const key = suburb.toLowerCase();
        if (!scores[key]) scores[key] = 0;
        if (v.tags?.amenity === "cafe" || v.tags?.amenity === "restaurant") scores[key] += 2;
        if (v.tags?.amenity === "bar") scores[key] += 1;
        if (v.tags?.leisure === "park") scores[key] += 1;
      }
    } catch {
      // Venue scoring failed – use name order only
    }

    // 5️⃣ Rank neighborhoods
    const umlautMap: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
    const ranked = neighborhoods
      .map((n: string) => ({
        label: n,
        value: n.toLowerCase().replace(/\s+/g, "_").replace(/[äöüß]/g, (c: string) => umlautMap[c] ?? c),
        score: scores[n.toLowerCase()] || 0,
      }))
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json(
      { neighborhoods: ranked, source: "osm" },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { neighborhoods: [] },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  }
}
