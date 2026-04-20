import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { apiUrl } from '../../lib/api';

type AnnouncementItem = {
  id: number;
  title: string;
  message: string;
  date: string | null;
  created_by_name: string;
};

export function MemberAnnouncements() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get<AnnouncementItem[]>(apiUrl('/api/announcements'));
        if (!cancelled) setItems(res.data);
      } catch (err) {
        console.error('Failed to load announcements', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">Latest notices shared by administration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading announcements...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No announcements available.</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-foreground">{item.title}</h3>
                  <span className="text-xs text-muted-foreground">{item.date || '-'}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{item.message}</p>
                <div className="text-xs text-muted-foreground mt-2">By: {item.created_by_name}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
