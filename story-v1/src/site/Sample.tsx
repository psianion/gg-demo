// The quiet mark on placeholder content (the content folder's `sample` flag): one per block, not one
// per line.
export default function Sample({ on = true }: { on?: boolean }) {
  return on ? <span className="sample">sample</span> : null;
}
