import legacyGames from "@/data/legacy-games.json";
import { prisma } from "@/lib/prisma";

type LegacyGame = {
  name: string;
  emoji?: string;
  active?: boolean;
  isGlobal?: boolean;
  parties: Record<string, string[]>;
};

function inferRole(name: string) {
  const value = name.toLowerCase();
  if (value.includes("heal") || value.includes("hallow") || value.includes("fallen") || value.includes("rampant")) return "HEAL";
  if (value.includes("tank") || value.includes("caller") || value.includes("mace") || value.includes("maça") || value.includes("hammer") || value.includes("incubus")) return "TANK";
  if (value.includes("arcane") || value.includes("arcano") || value.includes("locus") || value.includes("root") || value.includes("occult")) return "SUPPORT";
  return "DPS";
}

function emojiForRole(role: string) {
  return { TANK: "🛡️", HEAL: "💚", SUPPORT: "🔮", DPS: "⚔️" }[role] || "⚔️";
}

export async function importLegacyGames() {
  let gameCount = 0;
  let classCount = 0;

  for (const gameData of legacyGames.games as unknown as LegacyGame[]) {
    let game = await prisma.game.findFirst({
      where: { name: gameData.name, isGlobal: true }
    });

    if (!game) {
      game = await prisma.game.create({
        data: {
          name: gameData.name,
          emoji: gameData.emoji || "🎮",
          active: gameData.active ?? true,
          isGlobal: gameData.isGlobal ?? true
        }
      });
      gameCount += 1;
    } else {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          emoji: gameData.emoji || game.emoji,
          active: gameData.active ?? game.active,
          isGlobal: true
        }
      });
    }

    await prisma.class.deleteMany({
      where: {
        gameId: game.id,
        party: { not: null }
      }
    });

    for (const [party, labels] of Object.entries(gameData.parties)) {
      for (const [index, label] of labels.entries()) {
        const role = inferRole(label);
        await prisma.class.create({
          data: {
            gameId: game.id,
            name: label,
            role,
            emoji: emojiForRole(role),
            party,
            position: index + 1
          }
        });
        classCount += 1;
      }
    }
  }

  return {
    gamesCreated: gameCount,
    classesImported: classCount,
    totalGames: legacyGames.games.length
  };
}
