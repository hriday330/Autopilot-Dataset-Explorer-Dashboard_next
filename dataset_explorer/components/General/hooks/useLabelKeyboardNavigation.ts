import { useEffect, useCallback } from "react";
import { Label } from "@lib/types";

export function useLabelKeyboardNavigation(
  labels: Label[],
  selectedLabelId: string | null,
  onSelectLabel: (id: string) => void,
) {
  const currentIndex = labels.findIndex((l) => l.id === selectedLabelId);

  const selectPrev = useCallback(() => {
    if (labels.length === 0) return;

    const nextIndex = currentIndex <= 0 ? labels.length - 1 : currentIndex - 1;

    onSelectLabel(labels[nextIndex].id);
  }, [labels, currentIndex, onSelectLabel]);

  const selectNext = useCallback(() => {
    if (labels.length === 0) return;

    const nextIndex = currentIndex >= labels.length - 1 ? 0 : currentIndex + 1;

    onSelectLabel(labels[nextIndex].id);
  }, [labels, currentIndex, onSelectLabel]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // block when typing in input/text areas
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName) ||
          active.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        selectPrev();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        selectNext();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectPrev, selectNext]);
}
