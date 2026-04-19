import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { Button } from '../../components/Button';
import { Wrench, Clock, CheckCircle } from 'lucide-react';

const maintenanceIssues = [
  { id: 1, area: 'Area C', issue: 'Pipe leakage detected', priority: 'high', status: 'pending', assignedTo: 'Unassigned', reportedDate: '2026-04-12' },
  { id: 2, area: 'Area B', issue: 'Pump malfunction', priority: 'high', status: 'in-progress', assignedTo: 'Worker A', reportedDate: '2026-04-10' },
  { id: 3, area: 'Area A', issue: 'Meter reading error', priority: 'medium', status: 'pending', assignedTo: 'Unassigned', reportedDate: '2026-04-13' },
  { id: 4, area: 'Area D', issue: 'Valve replacement needed', priority: 'low', status: 'in-progress', assignedTo: 'Worker B', reportedDate: '2026-04-11' },
  { id: 5, area: 'Area E', issue: 'Water quality check', priority: 'medium', status: 'completed', assignedTo: 'Worker C', reportedDate: '2026-04-09' },
];

const workers = ['Worker A', 'Worker B', 'Worker C', 'Worker D'];

export function AdminMaintenance() {
  const [issues, setIssues] = useState(maintenanceIssues);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [selectedWorker, setSelectedWorker] = useState('');

  const handleAssign = () => {
    if (selectedIssue && selectedWorker) {
      setIssues(issues.map(issue =>
        issue.id === selectedIssue
          ? { ...issue, assignedTo: selectedWorker, status: 'in-progress' }
          : issue
      ));
      setSelectedIssue(null);
      setSelectedWorker('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl text-foreground">Maintenance Management</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl text-destructive">
                {issues.filter(i => i.status === 'pending').length}
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
                {issues.filter(i => i.status === 'in-progress').length}
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
                {issues.filter(i => i.status === 'completed').length}
              </div>
              <CheckCircle size={32} className="text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>ID</TableHeader>
                <TableHeader>Area</TableHeader>
                <TableHeader>Issue</TableHeader>
                <TableHeader>Priority</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Assigned To</TableHeader>
                <TableHeader>Reported Date</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="text-foreground">#{issue.id}</TableCell>
                  <TableCell className="text-foreground">{issue.area}</TableCell>
                  <TableCell className="text-foreground">{issue.issue}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      issue.priority === 'high'
                        ? 'bg-destructive text-destructive-foreground'
                        : issue.priority === 'medium'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-muted text-foreground'
                    }`}>
                      {issue.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      issue.status === 'completed'
                        ? 'bg-secondary text-secondary-foreground'
                        : issue.status === 'in-progress'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {issue.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground">{issue.assignedTo}</TableCell>
                  <TableCell className="text-foreground">{issue.reportedDate}</TableCell>
                  <TableCell>
                    {issue.status === 'pending' && (
                      <button
                        onClick={() => setSelectedIssue(issue.id)}
                        className="text-primary hover:underline text-sm"
                      >
                        Assign
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedIssue && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-foreground">Select Worker</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Choose a worker</option>
                  {workers.map(worker => (
                    <option key={worker} value={worker}>{worker}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAssign} disabled={!selectedWorker}>
                  Assign Worker
                </Button>
                <Button variant="outline" onClick={() => { setSelectedIssue(null); setSelectedWorker(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
