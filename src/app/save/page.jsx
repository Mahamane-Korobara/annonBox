import { Suspense } from "react";
import SavePageContent from "./save-content";

export default function SavePage() {
  return (
    <Suspense>
      <SavePageContent />
    </Suspense>
  );
}
