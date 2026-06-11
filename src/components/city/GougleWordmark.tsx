type Props = {
  className?: string;
};

/** Gougle Map と同じカラー文字ロゴ */
export function GougleWordmark({ className = "" }: Props) {
  return (
    <span className={`gougle-wordmark ${className}`.trim()} aria-label="Gougle">
      <span className="g">G</span>
      <span className="o1">o</span>
      <span className="o2">u</span>
      <span className="g2">g</span>
      <span className="l">l</span>
      <span className="e">e</span>
    </span>
  );
}
