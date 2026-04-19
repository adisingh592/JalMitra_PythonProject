import { useEffect, useState } from 'react';

export function AdminClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">Local time</div>
      <div className="font-mono text-lg text-foreground tabular-nums">
        {now.toLocaleDateString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </div>
      <div className="font-mono text-2xl text-primary tabular-nums">
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
    </div>
  );
}
