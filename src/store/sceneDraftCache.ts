const SCENE_DRAFT_PREFIX = 'novelsynth:scene-draft:';

export interface CachedSceneDraft {
  content: string;
  savedAt: string;
}

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

export const getSceneDraftKey = (sceneId: string) => `${SCENE_DRAFT_PREFIX}${sceneId}`;

export const cacheSceneDraft = (sceneId: string, content: string) => {
  try {
    getStorage()?.setItem(
      getSceneDraftKey(sceneId),
      JSON.stringify({
        content,
        savedAt: new Date().toISOString()
      } satisfies CachedSceneDraft)
    );
  } catch (err) {
    console.warn('Failed to cache scene draft locally:', err);
  }
};

export const readSceneDraft = (sceneId: string): CachedSceneDraft | null => {
  try {
    const raw = getStorage()?.getItem(getSceneDraftKey(sceneId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedSceneDraft>;
    if (typeof parsed.content !== 'string' || typeof parsed.savedAt !== 'string') {
      return null;
    }
    return {
      content: parsed.content,
      savedAt: parsed.savedAt
    };
  } catch (err) {
    console.warn('Failed to read cached scene draft:', err);
    return null;
  }
};

export const clearSceneDraft = (sceneId: string) => {
  try {
    getStorage()?.removeItem(getSceneDraftKey(sceneId));
  } catch (err) {
    console.warn('Failed to clear cached scene draft:', err);
  }
};
