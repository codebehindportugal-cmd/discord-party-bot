require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const games = {
  'Albion Online': {
    'Party 1': [
      'Caller',
      'HeavyMace',
      '1h Hammer',
      'HallowFall',
      'HallowFall',
      'HallowFall',
      'Rampant',
      'Geat Arcane',
      '1h Arcane',
      'Rootbound',
      'OathKeepers',
      'Locus (Def)',
      'Lifecurse',
      'Spirit Hunter',
      'Realmbreaker',
      'Spiked',
      'Permafrost',
      'Hellfire Hands',
      'Rift Glaive',
      'Rift Glaive',
    ],
    'Party 2': [
      '2nd Caller',
      'Incubus Mace',
      'Heavy Mase',
      'Grovekeeper',
      'BedRock',
      'HallowFall',
      'HallowFall',
      'HallowFall',
      'Fallen',
      'Great Arcane',
      'RootBound',
      'Oathkeepers',
      'Occult Staff',
      'Damnation',
      'Dawnsong',
      'Spirit hunter',
      'Great Frost Staff',
      'HellFire hands',
      'Rift Glaive',
      'Rift Glaive',
    ],
    'Party 3': [
      'Rift Glaive',
      'Chariot',
      'Eagle',
      'Eagle',
      'Siege Balista',
      'Siege Balista',
      'Behemoth',
      'Behemoth',
    ],
  },
  'League of Legends': {
    Team: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
  },
  Valorant: {
    Squad: ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'],
  },
  Metin2: {
    '1': ['Arqueiro'],
  },
  lol: {
    '1': ['gank'],
  },
  GANK: {
    '1': [
      'maça',
      'cajado gelo',
      'doubleblade',
      'doubleblade',
      'healer',
      'patas urso',
      'patas urso',
      'patas urso',
      'arco',
      'arco',
      'arco',
      'arco',
      'karvin',
      'arma gank',
      'arma gank',
      'arma gank',
      'arma gank',
      'arma gank',
      'arma gank',
    ],
  },
  'DG avaloniana': {
    '1': [
      'caller',
      'segundo tank',
      'healer principal',
      'raizferrea-healer',
      'raizferrea-healer',
      'raizferrea-healer',
      'raizferrea-monge negro',
      'arcano elevado',
      'arcanos silence',
      'bruxo crytal',
      'fire',
      'gelo',
      'caça espiritos',
      'quebra reinos',
      'aguia',
      'besta leve',
      'chamasombra',
      'repetidor',
      'repetidor',
      'besta leve',
    ],
  },
};

function inferRole(name) {
  const value = name.toLowerCase();
  if (value.includes('heal') || value.includes('hallow') || value.includes('fallen') || value.includes('rampant')) return 'HEAL';
  if (value.includes('tank') || value.includes('caller') || value.includes('mace') || value.includes('hammer') || value.includes('incubus')) return 'TANK';
  if (value.includes('arcane') || value.includes('locus') || value.includes('root') || value.includes('occult')) return 'SUPPORT';
  return 'DPS';
}

function emojiForRole(role) {
  return { TANK: '🛡️', HEAL: '💚', SUPPORT: '🔮', DPS: '⚔️' }[role] || '⚔️';
}

async function main() {
  let gameCount = 0;
  let classCount = 0;

  for (const [gameName, parties] of Object.entries(games)) {
    let game = await prisma.game.findFirst({ where: { name: gameName, isGlobal: true } });
    if (!game) {
      game = await prisma.game.create({
        data: {
          name: gameName,
          emoji: gameName === 'Albion Online' ? '🛡️' : '🎮',
          isGlobal: true,
          active: true,
        },
      });
      gameCount += 1;
    }

    await prisma.class.deleteMany({ where: { gameId: game.id, party: { not: null } } });

    for (const [party, labels] of Object.entries(parties)) {
      for (const [index, label] of labels.entries()) {
        const role = inferRole(label);
        await prisma.class.create({
          data: {
            gameId: game.id,
            name: label,
            role,
            emoji: emojiForRole(role),
            party,
            position: index + 1,
          },
        });
        classCount += 1;
      }
    }
  }

  console.log(`Seed concluido: ${gameCount} jogos novos, ${classCount} classes/slots importados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
