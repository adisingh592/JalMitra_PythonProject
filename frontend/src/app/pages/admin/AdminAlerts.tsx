import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

type ComplaintItem = {
  id: number;
  member_id: number;
  member_name: string;
  type: string;
  description: string;
  status: string;
  date: string;
  assigned_worker_id: number | null;
  assigned_worker_name: string;
  last_update_message?: string | null;
  last_update_percent?: number | null;
};

type MemberOption = {
  id: number;
  full_name: string | null;
  username: string;
};

type WorkerOption = {
  id: number;
  name: string;
  phone: string;
  skills: string | null;
  is_active: boolean;
};

type ComplaintUpdateItem = {
  id: number;
  message: string;
  progress_percent: number | null;
  created_at: string | null;
  date: string | null;
};

export function AdminAlerts() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [timelineItems, setTimelineItems] = useState<ComplaintUpdateItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressForm, setProgressForm] = useState({
    message: '',
    progressPercent: '',
  });
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

    try {
      const workerRes = await axios.get(apiUrl('/api/admin/workers'), { headers: { Authorization: token } });
      setWorkers(workerRes.data);
    } catch (err) {
      console.error('Failed to load workers:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filteredComplaints = useMemo(() => {
    const memberTerm = memberSearch.trim().toLowerCase();
    return complaints.filter((c) => {
      const workerMatch = workerFilter ? `${c.assigned_worker_id ?? ''}` === workerFilter : true;
      const memberMatch = memberTerm
        ? c.member_name.toLowerCase().includes(memberTerm) ||
          c.type.toLowerCase().includes(memberTerm) ||
          c.description.toLowerCase().includes(memberTerm)
        : true;
      return workerMatch && memberMatch;
    });
  }, [complaints, memberSearch, workerFilter]);

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

  const handleAssignWorker = async (complaintId: number, workerIdRaw: string) => {
    const workerId = workerIdRaw ? parseInt(workerIdRaw) : null;
    try {
      await axios.patch(
        apiUrl(`/api/admin/complaints/${complaintId}`),
        { assigned_worker_id: workerId, status: 'in-progress' },
        { headers: { Authorization: token } }
      );
      fetchData();
    } catch (err) {
      console.error('Failed to assign worker', err);
      alert('Failed to assign worker');
    }
  };

  const openProgressModal = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setProgressForm({
      message: '',
      progressPercent:
        complaint.last_update_percent !== null && complaint.last_update_percent !== undefined
          ? String(complaint.last_update_percent)
          : '',
    });
    setProgressModalOpen(true);
  };

  const handleAddProgress = async () => {
    if (!selectedComplaint) return;
    const msg = progressForm.message.trim();
    if (!msg) {
      alert('Please add progress message.');
      return;
    }

    const trimmedPercent = progressForm.progressPercent.trim();
    let progress_percent: number | undefined = undefined;
    if (trimmedPercent) {
      const parsed = Number.parseInt(trimmedPercent, 10);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        alert('Progress must be between 0 and 100.');
        return;
      }
      progress_percent = parsed;
    }

    try {
      setProgressSaving(true);
      await axios.post(
        apiUrl(`/api/admin/complaints/${selectedComplaint.id}/updates`),
        { message: msg, progress_percent },
        { headers: { Authorization: token } }
      );
      setProgressModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add progress update', err);
      alert('Failed to add progress update');
    } finally {
      setProgressSaving(false);
    }
  };

  const openTimeline = async (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setTimelineModalOpen(true);
    setTimelineLoading(true);
    try {
      const res = await axios.get(apiUrl(`/api/admin/complaints/${complaint.id}/updates`), {
        headers: { Authorization: token },
      });
      setTimelineItems(res.data);
    } catch (err) {
      console.error('Failed to load timeline', err);
      alert('Failed to load complaint timeline');
      setTimelineItems([]);
    } finally {
      setTimelineLoading(false);
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
        <h1 className="text-2xl text-foreground">Alerts & Member Complaints</h1>
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
                    <option value="bill">Bill Reminder</option>
                    <option value="complaint">Complaint Update</option>
                    <option value="maintenance">Maintenance Notice</option>
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
              <CardTitle>Member Complaints and Maintenance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search member, complaint type, or description"
                />
                <select
                  value={workerFilter}
                  onChange={(e) => setWorkerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All workers</option>
                  {workers
                    .filter((w) => w.is_active)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No complaints filed by members.</div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>ID</TableHeader>
                      <TableHeader>Member</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Description</TableHeader>
                      <TableHeader>Worker</TableHeader>
                      <TableHeader>Progress</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Action</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredComplaints.map((c) => (
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
                        <TableCell className="text-foreground">
                          <select
                            value={c.assigned_worker_id ?? ''}
                            onChange={(e) => handleAssignWorker(c.id, e.target.value)}
                            className="px-2 py-1 text-sm border border-border rounded bg-input-background text-foreground"
                          >
                            <option value="">Unassigned</option>
                            {workers
                              .filter(w => w.is_active)
                              .map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                          </select>
                          <div className="text-xs text-muted-foreground mt-1">{c.assigned_worker_name}</div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div className="text-xs max-w-[220px] truncate" title={c.last_update_message || ''}>
                            {c.last_update_message || '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.last_update_percent !== null && c.last_update_percent !== undefined ? `${c.last_update_percent}%` : ''}
                          </div>
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
                          <div className="flex items-center gap-2">
                            <select
                              value={c.status}
                              onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                              className="px-2 py-1 text-sm border border-border rounded bg-input-background text-foreground"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In-Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={() => openProgressModal(c)}>
                              Add Update
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openTimeline(c)}>
                              Timeline
                            </Button>
                          </div>
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

      <Dialog open={progressModalOpen} onOpenChange={setProgressModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Complaint Progress</DialogTitle>
            <DialogDescription>
              {selectedComplaint
                ? `Complaint #${selectedComplaint.id} - ${selectedComplaint.member_name}`
                : 'Add an update to keep members informed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-foreground">Progress update</label>
              <Textarea
                value={progressForm.message}
                onChange={(e) => setProgressForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Technician reached site, valve replaced, testing in progress..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm text-foreground">Progress percent (optional)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={progressForm.progressPercent}
                onChange={(e) => setProgressForm((prev) => ({ ...prev, progressPercent: e.target.value }))}
                placeholder="e.g. 60"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProgress} disabled={progressSaving}>
              {progressSaving ? 'Saving...' : 'Save Progress'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complaint Timeline</DialogTitle>
            <DialogDescription>
              {selectedComplaint
                ? `History for complaint #${selectedComplaint.id} (${selectedComplaint.member_name})`
                : 'Complaint updates'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[360px] overflow-y-auto space-y-3">
            {timelineLoading ? (
              <div className="text-sm text-muted-foreground">Loading timeline...</div>
            ) : timelineItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No progress updates yet.</div>
            ) : (
              timelineItems.map((item) => (
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
            <Button variant="outline" onClick={() => setTimelineModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
