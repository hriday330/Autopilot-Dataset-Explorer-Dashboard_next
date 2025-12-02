import { useState, useEffect, useCallback } from "react";

export function useSelectFrame(
  frameNumber: number,
  totalFrames: number,
  onGoToFrame: (num: number) => void,
) {
  const [frameInput, setFrameInput] = useState(frameNumber.toString());

  useEffect(() => {
    setFrameInput(frameNumber.toString());
  }, [frameNumber]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName) ||
          active.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && frameNumber > 1) {
        onGoToFrame(frameNumber - 1);
      } else if (e.key === "ArrowRight" && frameNumber < totalFrames) {
        onGoToFrame(frameNumber + 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [frameNumber, totalFrames, onGoToFrame]);

  const isValidFrame = useCallback(
    (value: string) => {
      const num = Number(value);
      return Number.isInteger(num) && num >= 1 && num <= totalFrames;
    },
    [totalFrames],
  );

  const submitFrameInput = useCallback(() => {
    if (isValidFrame(frameInput)) {
      onGoToFrame(Number(frameInput));
    } else {
      // snap back to current frame when invalid
      setFrameInput(frameNumber.toString());
    }
  }, [frameInput, isValidFrame, onGoToFrame, frameNumber]);

  const handleInputChange = useCallback((value: string) => {
    setFrameInput(value);
  }, []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        submitFrameInput();
        (e.target as HTMLInputElement).blur();
      }
    },
    [submitFrameInput],
  );

  const handleInputBlur = useCallback(() => {
    submitFrameInput();
  }, [submitFrameInput]);

  return {
    frameInput,
    setFrameInput,
    isValidFrame,
    handleInputChange,
    handleInputKeyDown,
    handleInputBlur,
  };
}
