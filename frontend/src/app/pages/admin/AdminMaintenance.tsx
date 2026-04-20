import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { Button } from '../../components/Button';
import { Wrench, Clock, CheckCircle } from 'lucide-react';
import { apiUrl } from '../../lib/api';

type Complaint = {
  id: number;
  member_id: number;
  member_name: string;
  area: string;
  assigned_worker_id: number | null;
  assigned_worker_name: string;
  type: string;
  description: string;
  status: string;
  date: string;
};

type Worker = {
  id: number;
  name: string;
  phone: string;
  skills: string | null;
  is_active: boolean;
};

export function AdminMaintenance() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  
  const [newWorker, setNewWorker] = useState({ name: '', phone: '', skills: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  const loadData = async () => {
    if (!token) return;
    try {
      const [cRes, wRes] = await Promise.all([
        axios.get<Complaint[]>(apiUrl('/api/admin/complaints'), { headers: { Authorization: token } }),
        axios.get<Worker[]>(apiUrl('/api/admin/workers'), { headers: { Authorization: token } })
      ]);
      setComplaints(cRes.data.filter(c => c.type === 'Leakage'));
      setWorkers(wRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  const handleAssign = async () => {
    if (selectedIssue && selectedWorkerId && token) {
      try {
        await axios.patch(apiUrl(`/api/admin/complaints/${selectedIssue}`), {
          status: 'in-progress',
          assigned_worker_id: parseInt(selectedWorkerId, 10)
        }, { headers: { Authorization: token } });
        
        setSelectedIssue(null);
        setSelectedWorkerId('');
        void loadData();
      } catch (err) {
        console.error('Failed to assign worker', err);
        alert('Failed to assign worker');
      }
    }
  };

  const handleRegisterWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsRegistering(true);
    try {
      await axios.post(apiUrl('/api/admin/workers'), newWorker, { headers: { Authorization: token } });
      setNewWorker({ name: '', phone: '', skills: '' });
      void loadData();
      alert('Worker registered successfully!');
    } catch (err) {
      console.error('Failed to register worker', err);
      alert('Failed to register worker');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl text-foreground">Maintenance Management (Leakage Only)</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl text-destructive">
                {complaints.filter(i => i.status === 'pending').length}
              </div>
              <Clock size={32} className="text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl text-primary">
                {complaints.filter(i => i.status === 'in-progress').length}
              </div>
              <Wrench size={32} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl text-secondary">
                {complaints.filter(i => i.status === 'resolved').length}
              </div>
              <CheckCircle size={32} className="text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Register New Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterWorker} className="space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Full Name</label>
                <input
                  type="text"
                  value={newWorker.name}
                  onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Phone Number</label>
                <input
                  type="text"
                  value={newWorker.phone}
                  onChange={e => setNewWorker({...newWorker, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-foreground">Skills / Specialty</label>
                <input
                  type="text"
                  value={newWorker.skills}
                  onChange={e => setNewWorker({...newWorker, skills: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Plumber, Electrician"
                />
              </div>
              <Button type="submit" disabled={isRegistering}>
                {isRegistering ? 'Registering...' : 'Register Worker'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {selectedIssue && (
          <Card>
            <CardHeader>
              <CardTitle>Assign Worker to Issue #{selectedIssue}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-foreground">Select Worker</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Choose a worker</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.skills || 'General'})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleAssign} disabled={!selectedWorkerId}>
                    Assign Worker
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedIssue(null); setSelectedWorkerId(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leakage Maintenance Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>ID</TableHeader>
                <TableHeader>Area</TableHeader>
                <TableHeader>Member</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Assigned To</TableHeader>
                <TableHeader>Reported Date</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                    No leakage complaints reported yet.
                  </TableCell>
                </TableRow>
              ) : complaints.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="text-foreground">#{issue.id}</TableCell>
                  <TableCell className="text-foreground">{issue.area}</TableCell>
                  <TableCell className="text-foreground">{issue.member_name}</TableCell>
                  <TableCell className="text-foreground">{issue.description}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      issue.status === 'resolved'
                        ? 'bg-secondary text-secondary-foreground'
                        : issue.status === 'in-progress'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {issue.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground">{issue.assigned_worker_name}</TableCell>
                  <TableCell className="text-foreground">{issue.date}</TableCell>
                  <TableCell>
                    {issue.status === 'pending' ? (
                      <button
                        onClick={() => setSelectedIssue(issue.id)}
                        className="text-primary hover:underline text-sm font-semibold"
                      >
                        Assign
                      </button>
                    ) : issue.status === 'in-progress' ? (
                      <button
                        onClick={async () => {
                          await axios.patch(apiUrl(`/api/admin/complaints/${issue.id}`), { status: 'resolved' }, { headers: { Authorization: token } });
                          void loadData();
                        }}
                        className="text-secondary hover:underline text-sm font-semibold"
                      >
                        Mark Resolved
                      </button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
