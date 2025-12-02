import { useEffect, useRef } from "react";

export function useAutoplayFrames(
  isPlaying: boolean,
  intervalMs: number,
  onNextFrame: () => void,
  disableDrawing: (disabled: boolean) => void,
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      disableDrawing(false);
      return;
    }
    disableDrawing(true);

    intervalRef.current = setInterval(() => {
      onNextFrame();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      disableDrawing(false);
    };
  }, [isPlaying, intervalMs, onNextFrame, disableDrawing]);
}
