import {
  getMediaSession,
} from '../../../../packages/media/session.mjs';
import type { MediaReference } from '../../../../packages/content/media.mjs';
declare const __PROJECT_ROOT__: string;
import type { ResponsiveMedia } from '../../../../packages/media/optimization.mjs';
export type ResolvedMedia = ResponsiveMedia;
export type Crop = MediaReference['crop'];
/** Imported only by server-rendered components. Never expose the repository root. */
export async function resolveSectionMedia(
  media: MediaReference | undefined,
  context: { pageId: string; sectionId: string; itemId?: string },
): Promise<ResolvedMedia | undefined> {
  if (!media) return undefined;
  try {
    return await getMediaSession(__PROJECT_ROOT__).resolve(media.src);
  } catch (error) {
    throw Error(
      `Page ${context.pageId}, section ${context.sectionId}${context.itemId ? ', item ' + context.itemId : ''}: cannot render image ${media.src}. Choose an existing valid local upload. ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}
