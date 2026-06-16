import { TEAMS } from "./mock-data";

/** Default tonight's nemesis per supported team */
export const DEFAULT_RIVAL: Record<string, string> = {
  FRA: "SEN",
  SEN: "FRA",
  USA: "MEX",
  MEX: "USA",
  ARG: "BRA",
  BRA: "ARG",
};

export function defaultRivalFor(teamCode: string): string {
  return DEFAULT_RIVAL[teamCode] ?? "FRA";
}

export function teamFlag(code: string): string {
  return TEAMS.find((t) => t.code === code)?.flag ?? "⚽";
}

export function teamName(code: string): string {
  return TEAMS.find((t) => t.code === code)?.name ?? code;
}

/** Playful fan-on-fan banter — sports trash talk, not personal */
const ROAST_LINES: Record<string, Record<string, string[]>> = {
  FRA: {
    SEN: [
      "Senegal fans are loud in Harlem — fair — but the scoreboard at MetLife is speaking fluent French tonight.",
      "The Lions roar on Nostrand; we're sending you to Les Bleus territory where the only 'Teranga' is the hospitality of a 2–1 lead.",
      "Bed-Stuy's street screen is pure chaos. Your sliders say skip rival energy — smart.",
    ],
    USA: [
      "USA fans will tell you it's coming home. It's not. It's East Rutherford and we're up.",
      "American Outlaws chapters are cheerful. We're routing you where the commentary isn't 'soccer'.",
    ],
    ARG: [
      "Argentina fans believe in destiny. Destiny took the RER to Paris, not NJ Transit.",
    ],
  },
  SEN: {
    FRA: [
      "French fans in Yorkville act like the match is already over — we're still in it. Lions don't read spreadsheets.",
      "Les Bleus watch parties near MetLife? Tourist energy. You want lions, not croissants.",
      "Secaucus is blue tonight. Good thing Brooklyn exists.",
    ],
    USA: [
      "USA fans doing 'it's called soccer' bits again. Ignore them — find the real African diaspora heat.",
    ],
  },
  USA: {
    MEX: [
      "El Tri fans in Corona throw a fiesta whether they win or lose. You asked for packed — they deliver.",
      "Mexico house parties don't do quiet. Neither does your crowd slider, apparently.",
    ],
  },
  MEX: {
    USA: [
      "USA fans love a watch party with foam fingers. Fine. We're finding you real fútbol energy instead.",
    ],
  },
};

export function pickRoastLine(myTeam: string, rivalTeam: string): string {
  const pool =
    ROAST_LINES[myTeam]?.[rivalTeam] ??
    ROAST_LINES[myTeam]?.[defaultRivalFor(myTeam)] ??
    [
      `${teamName(rivalTeam)} fans talk a big game on the live chat — your spot is ${teamName(myTeam)}-only tonight.`,
    ];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function crowdLabel(crowd: number): string {
  if (crowd < 25) return "Ghost town";
  if (crowd < 50) return "Chill booth";
  if (crowd < 75) return "Shoulder-to-shoulder";
  if (crowd < 90) return "Packed & loud";
  return "Absolute chaos";
}

export function isRoastQuery(message: string): boolean {
  return /roast|trash talk|talk smack|hate on|clown on|banter|nemesis|rival|they suck|overrated/.test(
    message.toLowerCase()
  );
}
