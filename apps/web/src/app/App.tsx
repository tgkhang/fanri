import { useEffect } from "react";
import { DiagnosticsBar } from "@/features/diagnostics";
import { DiagramCanvas } from "@/features/diagram";
import { useGraphStore } from "@/features/graph";
import { DetailPanel } from "@/features/inspect";

export function App() {
  const load = useGraphStore((s) => s.load);
  const status = useGraphStore((s) => s.status);
  const error = useGraphStore((s) => s.error);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex h-full flex-col bg-neutral-50 text-neutral-900">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-2">
        <h1 className="font-semibold">fanri</h1>
        <span className="text-sm text-neutral-500">{status === "loading" ? "Loading…" : error}</span>
      </header>
      <main className="flex min-h-0 flex-1">
        <div className="flex-1">
          <DiagramCanvas />
        </div>
        <DetailPanel />
      </main>
      <DiagnosticsBar />
    </div>
  );
}
