import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';

type Complaint = {
  id: number;
  type: string;
  description: string;
  status: string;
  date: string;
  assigned_worker_name?: string | null;
  last_update_message?: string | null;
  last_update_percent?: number | null;
};

type ComplaintUpdate = {
  id: number;
  message: string;
  progress_percent: number | null;
  created_at: string | null;
  date: string | null;
};

export function MemberComplaints() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    description: ''
  });

  const fetchComplaints = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(apiUrl('/api/member/complaints'), {
        headers: { Authorization: token }
      });
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await axios.post(apiUrl('/api/member/complaints'), formData, {
        headers: { Authorization: token }
      });
      alert('Complaint submitted successfully!');
      setShowForm(false);
      setFormData({ type: '', description: '' });
      fetchComplaints();
    } catch (err) {
      console.error('Failed to submit complaint', err);
      alert('Failed to submit complaint');
    }
  };

  const openTimeline = async (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setTimelineOpen(true);
    setUpdatesLoading(true);
    try {
      const res = await axios.get(apiUrl(`/api/member/complaints/${complaint.id}/updates`), {
        headers: { Authorization: token }
      });
      setUpdates(res.data);
    } catch (err) {
      console.error('Failed to load complaint updates', err);
      alert('Failed to load complaint updates');
      setUpdates([]);
    } finally {
      setUpdatesLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-foreground">Complaints</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'File New Complaint'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>File a Complaint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Complaint Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Leakage">Leakage</option>
                  <option value="No Supply">No Supply</option>
                  <option value="Low Pressure">Low Pressure</option>
                  <option value="Water Quality">Water Quality</option>
                  <option value="Billing Issue">Billing Issue</option>
                  <option value="Meter Issue">Meter Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-foreground">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={4}
                  placeholder="Describe your issue in detail"
                  required
                />
              </div>

              <Button type="submit">Submit Complaint</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Complaint History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>ID</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Worker</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Updates</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">No complaints filed.</TableCell>
                </TableRow>
              ) : (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="text-foreground">#{complaint.id}</TableCell>
                    <TableCell className="text-foreground">{complaint.type}</TableCell>
                    <TableCell className="text-foreground">{complaint.description}</TableCell>
                    <TableCell className="text-foreground">
                      <div>{complaint.assigned_worker_name || '-'}</div>
                      {complaint.last_update_message && (
                        <div className="text-xs text-muted-foreground max-w-[220px] truncate" title={complaint.last_update_message}>
                          {complaint.last_update_message}
                          {complaint.last_update_percent !== null && complaint.last_update_percent !== undefined
                            ? ` (${complaint.last_update_percent}%)`
                            : ''}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">{complaint.date}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        complaint.status === 'resolved'
                          ? 'bg-secondary/20 text-secondary-foreground'
                          : complaint.status === 'in-progress'
                          ? 'bg-primary/20 text-primary-foreground'
                          : 'bg-destructive/20 text-destructive-foreground'
                      }`}>
                        {complaint.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openTimeline(complaint)}>
                        View Timeline
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complaint Timeline</DialogTitle>
            <DialogDescription>
              {selectedComplaint
                ? `Complaint #${selectedComplaint.id} - ${selectedComplaint.type}`
                : 'Complaint updates'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[360px] overflow-y-auto space-y-3">
            {updatesLoading ? (
              <div className="text-sm text-muted-foreground">Loading updates...</div>
            ) : updates.length === 0 ? (
              <div className="text-sm text-muted-foreground">No updates yet. You will see maintenance progress here.</div>
            ) : (
              updates.map((item) => (
                <div key={item.id} className="rounded border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{item.created_at || item.date || '-'}</span>
                    <span className="text-xs text-foreground">
                      {item.progress_percent !== null && item.progress_percent !== undefined
                        ? `${item.progress_percent}%`
                        : 'No percent'}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-2">{item.message}</p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimelineOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
