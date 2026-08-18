import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { return ['', '/solutions/intimate-apparel', '/solutions/shoes', '/privacy', '/terms', '/cookies', '/contact'].map(path => ({ url: `https://lingeria.fasheone.com${path}`, lastModified: new Date('2026-08-18'), changeFrequency: path ? 'monthly' : 'weekly', priority: path ? 0.6 : 1 })); }
