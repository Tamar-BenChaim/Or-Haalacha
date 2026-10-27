// Sample content for development only. The real books, texts and prices come from the client.
const SAMPLE_DESCRIPTION =
  'תיאור לדוגמה. כאן יופיע תיאור מלא של הספר: הנושאים שבו, מבנה הספר ולמי הוא מתאים.';

const volumes = ['א', 'ב', 'ג', 'ד', 'ה'];

export const sampleBooks = volumes.map((letter, index) => ({
  slug: `or-haalacha-${index + 1}`,
  title: `אור ההלכה – כרך ${letter}'`,
  volume: index + 1,
  shortDescription: `ספר לדוגמה, כרך ${letter}'.`,
  description: SAMPLE_DESCRIPTION,
  priceAgorot: 6500,
  // Volume 4 is out of stock and volume 5 is hidden, to show both states.
  stock: index === 3 ? 0 : 20,
  lowStockThreshold: 5,
  coverImage: null,
  hidden: index === 4,
  sortOrder: index + 1,
}));
