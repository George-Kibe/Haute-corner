import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/support', '/privacy', '/terms', '/seller-terms', '/delete-account'].map((path) => ({
    url: `${site.url}${path}`,
  }));
}
