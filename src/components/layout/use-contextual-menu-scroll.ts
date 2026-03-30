"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

const DEFAULT_VERTICAL_ALIGNMENT = 0.62;

export function useContextualMenuScroll({
  open,
  activeHref,
  verticalAlignment = DEFAULT_VERTICAL_ALIGNMENT,
}: {
  open: boolean;
  activeHref: string | null;
  verticalAlignment?: number;
}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const registerItemRef = useCallback(
    (href: string) => (node: HTMLElement | null) => {
      if (node) {
        itemRefs.current.set(href, node);
        return;
      }

      itemRefs.current.delete(href);
    },
    [],
  );

  useLayoutEffect(() => {
    if (!open || !activeHref) return;

    let frame = 0;
    const maxAttempts = 6;

    const findActiveItem = (container: HTMLDivElement) =>
      itemRefs.current.get(activeHref) ??
      Array.from(container.querySelectorAll<HTMLElement>("[data-menu-href]")).find(
        (node) => node.dataset.menuHref === activeHref,
      ) ??
      null;

    const alignActiveItem = (attempt: number) => {
      const container = scrollContainerRef.current;

      if (!container) return;

      const activeItem = findActiveItem(container);
      const canScroll = container.scrollHeight > container.clientHeight;

      if ((!activeItem || !canScroll) && attempt < maxAttempts) {
        frame = window.requestAnimationFrame(() => alignActiveItem(attempt + 1));
        return;
      }

      if (!activeItem) return;

      const containerRect = container.getBoundingClientRect();
      const activeItemRect = activeItem.getBoundingClientRect();
      const itemCenter =
        activeItemRect.top -
        containerRect.top +
        container.scrollTop +
        activeItemRect.height / 2;
      const targetScrollTop =
        itemCenter - container.clientHeight * verticalAlignment;
      const maxScrollTop = Math.max(
        container.scrollHeight - container.clientHeight,
        0,
      );

      container.scrollTo({
        top: Math.min(Math.max(targetScrollTop, 0), maxScrollTop),
        behavior: "auto",
      });
    };

    frame = window.requestAnimationFrame(() => alignActiveItem(0));

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeHref, open, verticalAlignment]);

  return {
    scrollContainerRef,
    registerItemRef,
  };
}
