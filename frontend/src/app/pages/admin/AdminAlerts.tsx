import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type ComplaintItem = {
  id: number;
  member_id: number;
  member_name: string;
  type: string;
  description: string;
  status: string;
  date: string;
};

type MemberOption = {
  id: number;
  full_name: string | null;
  username: string;
};

export function AdminAlerts() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertForm, setAlertForm] = useState({
    member_id: '',
    type: 'notice',
    title: '',
    message: '',
  });

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const compRes = await axios.get(apiUrl('/api/admin/complaints'), { headers: { Authorization: token } });
      setComplaints(compRes.data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    }

    try {
      const memRes = await axios.get(apiUrl('/api/admin/members'), { headers: { Authorization: token } });
      setMembers(memRes.data);
    } catch (err) {
      console.error('Failed to load members:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleUpdateStatus = async (complaintId: number, newStatus: string) => {
    try {
      await axios.patch(apiUrl(`/api/admin/complaints/${complaintId}`), { status: newStatus }, {
        headers: { Authorization: token }
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.member_id) {
      alert('Please select a member');
      return;
    }
    try {
      await axios.post(apiUrl('/api/admin/alerts'), {
        member_id: parseInt(alertForm.member_id),
        type: alertForm.type,
        title: alertForm.title,
        message: alertForm.message,
      }, { headers: { Authorization: token } });
      alert('Alert sent successfully!');
      setAlertForm({ member_id: '', type: 'notice', title: '', message: '' });
    } catch (err) {
      console.error('Failed to send alert', err);
      alert('Failed to send alert');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-foreground">Alerts & Complaints</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Send Targeted Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendAlert} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm text-foreground">Select Member</label>
                  <select
                    value={alertForm.member_id}
                    onChange={(e) => setAlertForm({ ...alertForm, member_id: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">-- Choose Member --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.full_name || m.username} ({m.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm text-foreground">Alert Type</label>
                  <select
                    value={alertForm.type}
                    onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="notice">General Notice</option>
                    <option value="bill">Bill Repayment</option>
                    <option value="complaint">High Water Usage</option>
                    <option value="maintenance">Leakage Alert</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm text-foreground">Title</label>
                  <input
                    type="text"
                    value={alertForm.title}
                    onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. High Usage Detected"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm text-foreground">Message</label>
                  <textarea
                    value={alertForm.message}
                    onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                    placeholder="Describe the alert..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Send Alert</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Member Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No complaints filed by members.</div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>ID</TableHeader>
                      <TableHeader>Member</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Description</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Action</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complaints.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-foreground">#{c.id}</TableCell>
                        <TableCell className="text-foreground">{c.member_name}</TableCell>
                        <TableCell className="text-foreground">{c.type}</TableCell>
                        <TableCell className="text-foreground">
                          <div className="truncate max-w-[150px]" title={c.description}>
                            {c.description}
                          </div>
                          <div className="text-xs text-muted-foreground">{c.date}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            c.status === 'resolved'
                              ? 'bg-secondary/20 text-secondary-foreground'
                              : c.status === 'in-progress'
                              ? 'bg-primary/20 text-primary-foreground'
                              : 'bg-destructive/20 text-destructive-foreground'
                          }`}>
                            {c.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <select
                            value={c.status}
                            onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                            className="px-2 py-1 text-sm border border-border rounded bg-input-background text-foreground"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In-Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
