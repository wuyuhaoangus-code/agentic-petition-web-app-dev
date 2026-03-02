export interface AdminPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'published' | 'draft' | 'scheduled';
  author: string;
  categories: string[];
  views: number;
  publishedAt?: string;
  scheduledFor?: string;
  updatedAt: string;
  createdAt?: string;
  imageUrl?: string;
  imageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
}
