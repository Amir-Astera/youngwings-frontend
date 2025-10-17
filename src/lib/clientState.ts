const viewedPosts = new Set<string>();

export function hasViewBeenRecorded(postId: string | undefined | null): boolean {
  if (!postId) {
    return false;
  }

  return viewedPosts.has(postId);
}

export function markViewRecorded(postId: string | undefined | null): void {
  if (!postId) {
    return;
  }

  viewedPosts.add(postId);
}
