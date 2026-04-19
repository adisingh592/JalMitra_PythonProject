import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type Complaint = {
  id: number;
  type: string;
  description: string;
  status: string;
  date: string;
};

export function MemberComplaints() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
                <TableHeader>Date</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No complaints filed.</TableCell>
                </TableRow>
              ) : (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="text-foreground">#{complaint.id}</TableCell>
                    <TableCell className="text-foreground">{complaint.type}</TableCell>
                    <TableCell className="text-foreground">{complaint.description}</TableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
