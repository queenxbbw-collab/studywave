import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `StudyWave - ${title}`;
    return () => { document.title = "StudyWave"; };
  }, [title]);
}
