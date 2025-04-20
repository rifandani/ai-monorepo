import { google } from '@ai-sdk/google';
import { logger } from '@workspace/core/utils/logger';
import { embedMany } from 'ai';
import { reset } from 'drizzle-seed';
import { db } from '.';
import { type ImageTable, imagesTable } from './schema';

const textEmbedding004 = google.textEmbeddingModel('text-embedding-004');
const mockImagesWithoutEmbedding: Omit<ImageTable, 'id'>[] = [
  {
    title: 'Autumn Stillness: Boats on a Lake at Sunset',
    description:
      'A tranquil autumn scene unfolds on a calm lake as the sun sets. Several small, rustic boats rest on the water, their forms reflected on the mirror-like surface alongside the dramatic sky, which transitions from warm golden hues near the horizon to darker, moody clouds above. Golden autumn leaves adorn the trees framing the left side of the image, litter the foreground shore where one boat is partially beached, and float scattered across the still water. The overall atmosphere is one of profound peace and the quiet beauty of the changing season.',
    path: 'https://cdn.pixabay.com/photo/2020/11/18/22/38/lake-5756911_1280.jpg',
    embedding: [],
  },
  {
    title: 'Meteora Monastery Clinging to a Sunlit Rock Pillar',
    description:
      'A stunning view of a historic Meteora monastery, perched precariously atop a massive, sun-drenched rock pillar in Greece. The building, with its terracotta roof and whitewashed walls, contrasts sharply with the sheer, shadowed cliffs rising dramatically behind it. Lush green trees and vegetation cover the lower slopes, highlighting the scale and isolation of this remarkable cliffside sanctuary.',
    path: 'https://cdn.pixabay.com/photo/2016/07/26/20/38/meteora-monasteries-1543785_1280.jpg',
    embedding: [],
  },
  {
    title: 'Mystical Foggy Forest Floor',
    description:
      "A deeply atmospheric view into a dense, foggy forest. Tall, straight tree trunks, partially covered in green moss, stand like columns and gradually disappear into the thick, ethereal mist in the background. The forest floor is a carpet of vibrant green moss, damp earth, and fallen twigs, enhancing the scene's quiet, eerie, and slightly enchanted mood. The low light and pervasive fog create a sense of mystery and solitude.",
    path: 'https://cdn.pixabay.com/photo/2016/03/15/18/12/forest-1258845_1280.jpg',
    embedding: [],
  },
  {
    title: 'Weathered Fence on Overcast Beach Dunes',
    description:
      'A weathered wooden fence post strung with barbed wire stands firmly planted in soft, pale sand dunes, dominating the foreground with sharp focus. The fence line recedes along the dunes, marked by more posts partially obscured by blades of dune grass. In the soft-focus background, the grey, muted tones of the ocean waves roll onto the beach under an overcast sky, conveying a sense of quiet coastal solitude.',
    path: 'https://cdn.pixabay.com/photo/2019/10/06/12/43/beach-4530127_1280.jpg',
    embedding: [],
  },
  {
    title: 'Serene Boat Journey Through a Floating Flower Farm',
    description:
      "A tranquil scene unfolds as a traditional wooden boat glides along a calm waterway bordered by extensive rows of potted flowering plants. One person expertly rows the boat while another sits as a passenger, observing the unique spectacle of a floating flower nursery. Hundreds of vibrant green and yellow plants, likely chrysanthemums, are meticulously arranged on elevated stands above the water's surface, creating a stunning agricultural landscape reflected in the water below. Lush green banks and trees frame the scene under a clear sky.",
    path: 'https://cdn.pixabay.com/photo/2022/01/18/23/31/farm-6948514_1280.jpg',
    embedding: [],
  },
  {
    title: 'Rustic Coffee House Counter and Menu',
    description:
      "A bustling view of the counter area inside Jirani Coffee House, featuring a prominent, hand-lettered chalkboard menu detailing espresso, tea, and brewed coffee options against a warm brick wall. Rustic wooden shelves supported by industrial piping hold coffee supplies, jars, mugs, and decorative items like pumpkins. Below, coffee machines, grinders, and a pastry display case sit ready on the counter, contributing to the shop's cozy, inviting atmosphere.",
    path: 'https://cdn.pixabay.com/photo/2016/11/29/12/54/cafe-1869656_1280.jpg',
    embedding: [],
  },
  {
    title: 'Joyful Shiba Inu Balancing on a Log',
    description:
      'A happy-looking Shiba Inu dog, captured mid-stride, walks directly towards the camera along the top of a rough, weathered log. The dog has bright eyes, erect ears, and its tongue is playfully hanging out. Its front paw is firmly planted on the log, conveying motion and balance. The background consists of blurred grass and bare tree branches, suggesting an outdoor setting in a cooler season.',
    path: 'https://cdn.pixabay.com/photo/2019/04/26/21/50/shiba-inu-4158782_1280.jpg',
    embedding: [],
  },
  {
    title: 'Overwhelmed Creative: Overhead View of Workspace Stress',
    description:
      'An overhead shot captures a person sitting at a wooden desk, hands clasped behind their head, facing an open laptop, suggesting stress or creative block. The desk is arranged with various items typically associated with creative work, including a DSLR camera, a separate lens, a film clapperboard, a cup of coffee, a notepad with sketches, a pen, and a small potted plant. The scene portrays a moment of contemplation or frustration within a modern creative workspace.',
    path: 'https://cdn.pixabay.com/photo/2017/10/10/21/49/blogger-2838945_1280.jpg',
    embedding: [],
  },
  {
    title: 'Breathtaking Vista from a High Mountain Suspension Bridge',
    description:
      'A lone woman stands on a high suspension bridge, her back to the camera, absorbing the stunning panoramic view of a vast mountain valley. Below her, a vibrant turquoise lake stretches out, flanked by steep, imposing mountain slopes, partly cast in shadow. The bridge, suspended high above the ground, offers a thrilling and awe-inspiring perspective on the dramatic alpine scenery.',
    path: 'https://cdn.pixabay.com/photo/2022/07/23/19/11/lake-7340473_1280.jpg',
    embedding: [],
  },
  {
    title: 'Curious Cat Crashes an Outdoor Feast',
    description:
      'Bathed in warm sunlight, a curious light-colored cat with bright blue eyes stands on its hind legs, placing its front paws on the edge of an outdoor dining table. With its tongue playfully sticking out, the cat appears tempted by the delicious spread laid out on the blue and white checkered tablecloth, which includes a charcuterie board, bowls of food, and condiments. This charming scene captures a moment of feline opportunism during a rustic al fresco meal.',
    path: 'https://cdn.pixabay.com/photo/2019/10/02/09/35/cat-4520516_1280.jpg',
    embedding: [],
  },
];

async function main() {
  logger.info('seeding "images" table started...');

  logger.info('clearing "images" table...');
  await reset(db, imagesTable);
  logger.info('"images" table cleared');

  logger.info('generating embeddings for "images" table...');
  const { embeddings } = await embedMany({
    model: textEmbedding004,
    values: mockImagesWithoutEmbedding.map(
      (img) => `${img.title}\n${img.description}`
    ),
  });
  logger.info('embeddings generated for "images" table');

  const mockImagesWithEmbedding = mockImagesWithoutEmbedding.map(
    (img, index) => ({
      ...img,
      embedding: embeddings[index] as number[],
    })
  );
  logger.info('inserting images into database...');
  await db.insert(imagesTable).values(mockImagesWithEmbedding);
  logger.info('images inserted into database');

  logger.info('database seeding complete');
}

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  logger.error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set.');
  process.exit(1);
}

main().catch((error) => {
  logger.error(error, '[main]: Error seeding database');
  process.exit(1);
});
