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
      "They've been chanting Sadio for 73 minutes. The xG chart is still wearing a beret.",
      "Senegal fans keep saying 'we're still in it.' So is my Uber — doesn't mean either of us is winning.",
      "Harlem is giving Lions energy. MetLife is giving French exam results: passed, with distinction.",
      "I love the passion. I also love that Mbappé exists. Different vibes.",
      "Their fans brought drums. We brought a two-goal cushion and a wine list.",
    ],
    USA: [
      "USA fans will tell you it's coming home. It's not. It's East Rutherford and we're up.",
      "American Outlaws chapters are cheerful. We're routing you where the commentary isn't 'soccer'.",
      "They'll explain offsides using a whiteboard. You want goals, not a TED talk.",
      "USA fans doing the wave while down 2–1 is peak optimism. Respect the delusion.",
    ],
    ARG: [
      "Argentina fans believe in destiny. Destiny took the RER to Paris, not NJ Transit.",
      "They'll say Messi would've fixed it. Messi's not on the 2 train tonight.",
      "Boca energy in a Yorkville bistro? Wrong continent, wrong scoreboard.",
    ],
    BRA: [
      "Brazil fans act like jogo bonito is a personality trait. The table says otherwise tonight.",
      "Samba skills, sure — but your crowd slider wants French precision, not carnival chaos.",
    ],
    MEX: [
      "Mexico fans throw a party win or lose. Tonight they're seasoning the loss with extra lime.",
    ],
  },
  SEN: {
    FRA: [
      "French fans in Yorkville act like the match is already over — we're still in it. Lions don't read spreadsheets.",
      "Les Bleus watch parties near MetLife? Tourist energy. You want lions, not croissants.",
      "Secaucus is blue tonight. Good thing Brooklyn exists.",
      "They've been smug since minute 12. Nothing ages worse than French confidence before a comeback.",
      "Yorkville bistro fans whisper about 'class.' Class doesn't stop a 25-yard banger — ask Diallo.",
      "French supporters brought escargot energy to a lion fight. Bold choice.",
      "Mbappé is fast. So is the rumor that we're equalizing — faster than their defense thinks.",
    ],
    USA: [
      "USA fans doing 'it's called soccer' bits again. Ignore them — find the real African diaspora heat.",
      "They'll ask if you know the rules. You know the rules: never trust a 1-goal lead.",
    ],
    MEX: [
      "Mexico fans love a fiesta. We're here for the match, not the mariachi halftime.",
    ],
  },
  USA: {
    MEX: [
      "El Tri fans in Corona throw a fiesta whether they win or lose. You asked for packed — they deliver.",
      "Mexico house parties don't do quiet. Neither does your crowd slider, apparently.",
      "They'll claim Dos a Cero like it's a religion. Your map says find a bar with fewer chants.",
      "Corona is loud. So is their confidence. Both are fun until the scoreboard talks back.",
    ],
    FRA: [
      "France fans think they're too cool for MLS. Cool — we're finding you a bar with hot dogs and hope.",
    ],
  },
  MEX: {
    USA: [
      "USA fans love a watch party with foam fingers. Fine. We're finding you real fútbol energy instead.",
      "They'll say 'it's called soccer.' You say 'it's called scoring — try it sometime.'",
      "American Outlaws showing up in matching kits like it's cosplay night. Cute.",
    ],
  },
  ARG: {
    BRA: [
      "Brazil fans swear the flair is coming. The flair is always 'coming' — like NJ Transit.",
      "They'll do stepovers in the bar aisle. You want a seat and a screen, not a circus.",
    ],
    FRA: [
      "Argentina fans still live in 2022. It's 2026 — check the MetLife clock.",
    ],
  },
  BRA: {
    ARG: [
      "Argentina fans treat every match like a final. Bro, it's group stage — breathe.",
      "They'll cry about a handball from 1986. You want samba, not a history lecture.",
    ],
  },
};

export function pickRoastLine(myTeam: string, rivalTeam: string): string {
  const pool = getRoastPool(myTeam, rivalTeam);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRoastLines(
  myTeam: string,
  rivalTeam: string,
  count = 3
): string[] {
  const pool = [...getRoastPool(myTeam, rivalTeam)];
  const out: string[] = [];
  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function getRoastPool(myTeam: string, rivalTeam: string): string[] {
  return (
    ROAST_LINES[myTeam]?.[rivalTeam] ??
    ROAST_LINES[myTeam]?.[defaultRivalFor(myTeam)] ?? [
      `${teamName(rivalTeam)} fans talk a big game on the live chat — your spot is ${teamName(myTeam)}-only tonight.`,
      `${teamName(rivalTeam)} supporters are loud online. The map says go where ${teamName(myTeam)} flags actually are.`,
      `Rival roast mode: ${teamName(rivalTeam)} fans are cooked on the timeline. You're not.`,
    ]
  );
}

export function crowdLabel(crowd: number): string {
  if (crowd < 25) return "Ghost town";
  if (crowd < 50) return "Chill booth";
  if (crowd < 75) return "Shoulder-to-shoulder";
  if (crowd < 90) return "Packed & loud";
  return "Absolute chaos";
}

export function isRoastQuery(message: string): boolean {
  return /roast|trash talk|talk smack|hate on|clown on|banter|nemesis|rival|they suck|overrated|cooked|embarrass|clown|smack|trash|slander|disrespect|mock|ratio|l take|mid|delusional|copium|meltdown/.test(
    message.toLowerCase()
  );
}
