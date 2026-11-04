export interface CoverImage {
  url: string;
  alt: string;
}

/** A book as returned by GET /books. All prices are integer agorot. */
export interface Book {
  id: string;
  slug: string;
  title: string;
  volume: number | null;
  shortDescription: string;
  priceAgorot: number;
  inStock: boolean;
  coverImage: CoverImage | null;
  /** Only on GET /books/:slug. */
  description?: string;
}

/** The full set, as returned by GET /bundles. */
export interface Bundle {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceAgorot: number;
  /** Sum of the books bought separately; null when a book is hidden. */
  separatePriceAgorot: number | null;
  inStock: boolean;
  books: Book[];
}
