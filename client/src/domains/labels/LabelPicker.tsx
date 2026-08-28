import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Label } from "./types";

interface Props {
  labels: Label[];
  excludeIds: Set<string>;
  onSelect: (key: string, value: string) => void;
  onClose: () => void;
}

export function LabelPicker({ labels, excludeIds, onSelect, onClose }: Props) {
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const available = labels.filter((label) => !excludeIds.has(label.id));

  function handleNewSubmit(e: FormEvent) {
    e.preventDefault();
    const separatorIndex = newLabel.indexOf(":");
    if (separatorIndex <= 0 || separatorIndex === newLabel.length - 1) return;
    const key = newLabel.slice(0, separatorIndex).trim();
    const value = newLabel.slice(separatorIndex + 1).trim();
    if (!key || !value) return;
    onSelect(key, value);
  }

  return (
    <div className="label-picker" ref={rootRef}>
      <ul className="label-picker-list">
        {available.length === 0 && !creating && <li className="label-picker-empty muted">No labels yet</li>}
        {available.map((label) => (
          <li key={label.id}>
            <button type="button" onClick={() => onSelect(label.key, label.value)}>
              {label.key}:{label.value}
            </button>
          </li>
        ))}
        <li className="label-picker-new">
          {creating ? (
            <form onSubmit={handleNewSubmit}>
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="key:value"
              />
              <button type="submit" disabled={newLabel.indexOf(":") <= 0}>
                Add
              </button>
            </form>
          ) : (
            <button type="button" className="label-picker-new-btn" onClick={() => setCreating(true)}>
              &lt;new&gt;
            </button>
          )}
        </li>
      </ul>
    </div>
  );
}
