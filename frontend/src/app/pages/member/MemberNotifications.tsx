import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/Card';
import { Bell, Droplets, IndianRupee, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
};

export function MemberNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(apiUrl('/api/member/notifications'), {
        headers: { Authorization: token }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleMarkRead = async (id: number, read: boolean) => {
    if (read) return;
    try {
      await axios.patch(apiUrl(`/api/member/notifications/${id}/read`), {}, {
        headers: { Authorization: token }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'bill') return <IndianRupee size={20} />;
    if (type === 'maintenance') return <AlertTriangle size={20} />;
    if (type === 'complaint') return <FileText size={20} />;
    if (type === 'notice') return <Bell size={20} />;
    return <Droplets size={20} />;
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-foreground">Notifications</h1>
        <div className="text-sm text-muted-foreground">
          {notifications.filter(n => !n.read).length} unread
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No notifications.</div>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all cursor-pointer ${!notification.read ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => handleMarkRead(notification.id, notification.read)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded ${
                  notification.type === 'bill'
                    ? 'bg-primary/10 text-primary'
                    : notification.type === 'maintenance'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-secondary/10 text-secondary'
                }`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-foreground">{notification.title}</h3>
                    <span className="text-xs text-muted-foreground">{notification.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {!loading && notifications.every(n => n.read) && notifications.length > 0 && (
        <Card className="bg-muted">
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">You're all caught up!</p>
          </div>
        </Card>
      )}
    </div>
  );
}
