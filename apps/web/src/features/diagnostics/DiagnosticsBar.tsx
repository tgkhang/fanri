import { useGraphStore } from "@/features/graph";

/** Parse errors, unresolved refs and info messages from the IR. */
export function DiagnosticsBar() {
  const diagnostics = useGraphStore((s) => s.graph?.diagnostics ?? []);
  if (diagnostics.length === 0) return null;

  return (
    <footer className="border-t border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-600">
      {diagnostics.map((d, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: diagnostics have no id
        <div key={i}>
          [{d.severity}] {d.message}
        </div>
      ))}
    </footer>
  );
}
