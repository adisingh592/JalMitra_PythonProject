import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type AnnouncementItem = {
  id: number;
  title: string;
  message: string;
  date: string | null;
  created_at: string | null;
  created_by_name: string;
};

export function AdminAnnouncements() {
  const { token } = useAuth();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', message: '' });

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await axios.get<AnnouncementItem[]>(apiUrl('/api/announcements'));
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const title = form.title.trim();
    const message = form.message.trim();
    if (!title || !message) {
      alert('Please enter title and message.');
      return;
    }
    try {
      setSaving(true);
      await axios.post(
        apiUrl('/api/admin/announcements'),
        { title, message },
        { headers: { Authorization: token } }
      );
      setForm({ title: '', message: '' });
      await loadAnnouncements();
      alert('Announcement published for everyone.');
    } catch (err) {
      console.error('Failed to publish announcement', err);
      alert('Failed to publish announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send announcements visible to all admins and members.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublish} className="space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Announcement title"
              className="w-full px-3 py-2 border border-border rounded bg-input-background text-foreground"
              required
            />
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Write announcement message..."
              className="w-full px-3 py-2 border border-border rounded bg-input-background text-foreground"
              rows={4}
              required
            />
            <Button type="submit" disabled={saving}>
              {saving ? 'Publishing...' : 'Publish to Everyone'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading announcements...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No announcements yet.</div>
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
