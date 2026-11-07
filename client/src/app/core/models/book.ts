export interface CoverImage {
  url: string;
  alt: string;
}

/** The pictures a book page can show: the covers, the contents page and sample pages. */
export type BookImageKind = 'front' | 'back' | 'contents' | 'sample';

export interface BookImage {
  kind: BookImageKind;
  url: string;
  alt: string;
}

/** Technical details. Any of them can be missing. */
export interface BookDetails {
  pages?: number | null;
  size?: string | null;
  binding?: string | null;
  year?: number | null;
}

/** A book as returned by GET /books. All prices are integer agorot. */
export interface Book {
  id: string;
  slug: string;
  title: string;
  volume: number | null;
  /** Not in the API yet (see docs/client-spec-angular.md section 9). Shown only when present. */
  topic?: string | null;
  shortDescription: string;
  priceAgorot: number;
  inStock: boolean;
  coverImage: CoverImage | null;
  /** Only on GET /books/:slug. */
  description?: string;
  /** Not in the API yet: more pictures of the book (see docs/client-spec-angular.md section 9). */
  images?: BookImage[];
  /** Not in the API yet: pages, size, binding, year. */
  details?: BookDetails | null;
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
