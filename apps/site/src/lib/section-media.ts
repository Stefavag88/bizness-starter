import {
  resolveSourceMedia,
  type SourceMedia,
} from '../../../../packages/media/source.mjs';
import type { MediaReference } from '../../../../packages/content/media.mjs';
declare const __PROJECT_ROOT__: string;
export type ResolvedMedia = SourceMedia;
export type Crop = MediaReference['crop'];
/** Imported only by server-rendered components. Never expose the repository root. */
export async function resolveSectionMedia(
  media: MediaReference | undefined,
  context: { pageId: string; sectionId: string; itemId?: string },
): Promise<ResolvedMedia | undefined> {
  if (!media) return undefined;
  try {
    return await resolveSourceMedia(__PROJECT_ROOT__, media.src);
  } catch (error) {
    throw Error(
      `Page ${context.pageId}, section ${context.sectionId}${context.itemId ? ', item ' + context.itemId : ''}: cannot render image ${media.src}. Choose an existing valid local upload. ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}
