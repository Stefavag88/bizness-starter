export type ImageLayout = 'media-text' | 'gallery' | 'gallery-featured-lead' | 'gallery-featured-item' | 'room-card' | 'room-detail';
export function imageSizes(layout: ImageLayout, itemCount: number): string;
