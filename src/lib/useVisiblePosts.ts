import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VisibilityChangeHandler = (visibleIds: string[]) => void;

type RegisterFn = (element: HTMLElement | null, postId: string) => void;

interface UseVisiblePostsOptions {
  onChange?: VisibilityChangeHandler;
  rootMargin?: string;
}

const DEFAULT_ROOT_MARGIN = "100% 0px 100% 0px";

export function useVisiblePosts({
  onChange,
  rootMargin = DEFAULT_ROOT_MARGIN,
}: UseVisiblePostsOptions = {}): { register: RegisterFn; visibleIds: string[] } {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementByIdRef = useRef(new Map<string, HTMLElement>());
  const idByElementRef = useRef(new Map<Element, string>());
  const visibleSetRef = useRef(new Set<string>());
  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let hasChanges = false;

        for (const entry of entries) {
          const id = idByElementRef.current.get(entry.target);

          if (!id) {
            continue;
          }

          if (entry.isIntersecting) {
            if (!visibleSetRef.current.has(id)) {
              visibleSetRef.current.add(id);
              hasChanges = true;
            }
          } else if (visibleSetRef.current.delete(id)) {
            hasChanges = true;
          }
        }

        if (hasChanges) {
          const nextVisible = Array.from(visibleSetRef.current);
          setVisibleIds(nextVisible);
          onChange?.(nextVisible);
        }
      },
      {
        root: null,
        rootMargin,
        threshold: 0,
      },
    );

    observerRef.current = observer;

    for (const element of idByElementRef.current.keys()) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      observerRef.current = null;
      visibleSetRef.current.clear();
      setVisibleIds([]);
      onChange?.([]);
    };
  }, [onChange, rootMargin]);

  const register = useCallback<RegisterFn>((element, postId) => {
    const observer = observerRef.current;
    const trimmedId = postId?.trim?.() ?? "";
    const existingElement = elementByIdRef.current.get(trimmedId);

    if (existingElement && existingElement !== element) {
      observer?.unobserve(existingElement);
      idByElementRef.current.delete(existingElement);
    }

    if (!element || !trimmedId) {
      if (existingElement) {
        elementByIdRef.current.delete(trimmedId);
        visibleSetRef.current.delete(trimmedId);
        observer?.unobserve(existingElement);
        setVisibleIds(Array.from(visibleSetRef.current));
        onChange?.(Array.from(visibleSetRef.current));
      }
      return;
    }

    elementByIdRef.current.set(trimmedId, element);
    idByElementRef.current.set(element, trimmedId);

    if (observer) {
      observer.observe(element);
    }
  }, [onChange]);

  const snapshot = useMemo(() => visibleIds, [visibleIds]);

  return { register, visibleIds: snapshot };
}
