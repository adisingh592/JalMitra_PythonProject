import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Activity, AlertTriangle, Droplets, MapPin, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiUrl } from '../../lib/api';

type DashboardRes = {
  range: { start: string; end: string };
  summary: {
    total_supplied_week: number;
    total_consumed_week: number;
    total_leakage_week: number;
    avg_loss_percent_week: number;
    active_alerts: number;
  };
  daily: Array<{
    date: string;
    label: string;
    total_supplied: number;
    total_consumed: number;
    total_leakage: number;
    loss_percent: number;
  }>;
  cities_count: number;
};

type LeakageRes = {
  summary: {
    total_leakage_liters: number;
    avg_loss_percent: number;
    critical_areas: number;
  };
  by_city: Array<{
    city_id?: number;
    city_name: string;
    supplied: number;
    consumed: number;
    leakage_liters: number;
    loss_percent: number;
    status: 'normal' | 'warning' | 'critical' | string;
  }>;
};

function badgeForLeak(status: string) {
  if (status === 'critical') return <Badge variant="destructive">Critical</Badge>;
  if (status === 'warning') return <Badge className="bg-amber-500 text-black hover:bg-amber-500">Warning</Badge>;
  return <Badge variant="secondary">Normal</Badge>;
}

export function AdminMonitoring() {
  const { token } = useAuth();
  const [dash, setDash] = useState<DashboardRes | null>(null);
  const [leak, setLeak] = useState<LeakageRes | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    if (!token) return;
    try {
      const [dashRes, leakRes] = await Promise.all([
        axios.get<DashboardRes>(apiUrl('/api/analytics/dashboard'), { headers: { Authorization: token } }),
        axios.get<LeakageRes>(apiUrl('/api/analytics/leakage'), { headers: { Authorization: token } }),
      ]);
      setDash(dashRes.data);
      setLeak(leakRes.data);
    } catch (err: unknown) {
      const detailMessage = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detailMessage === 'string' ? detailMessage : 'Could not load monitoring analytics.');
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [token]);

  const weeklyChart = dash?.daily.map((day) => ({
    day: day.label,
    supplied: day.total_supplied,
    consumed: day.total_consumed,
  })) ?? [];

  const lossTrend = dash?.daily.map((day) => ({
    day: day.label,
    loss: day.loss_percent,
  })) ?? [];

  const summary = dash?.summary;
  const leakRows = leak?.by_city ?? [];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('JalMitra - Water Analytics Report', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

    // Summary Stats
    if (summary) {
      doc.text(`Total Supplied (7 days): ${summary.total_supplied_week.toLocaleString()} L`, 14, 42);
      doc.text(`Total Consumed (7 days): ${summary.total_consumed_week.toLocaleString()} L`, 14, 48);
      doc.text(`Total Leakage (7 days): ${summary.total_leakage_week.toLocaleString()} L`, 14, 54);
      doc.text(`Average Loss: ${summary.avg_loss_percent_week}%`, 14, 60);
    }

    // Table
    if (leakRows.length > 0) {
      autoTable(doc, {
        startY: 70,
        head: [['City', 'Supplied (L)', 'Consumed (L)', 'Leakage (L)', 'Loss %', 'Status']],
        body: leakRows.map(row => [
          row.city_name,
          row.supplied.toLocaleString(),
          row.consumed.toLocaleString(),
          row.leakage_liters.toLocaleString(),
          row.loss_percent + '%',
          row.status.toUpperCase()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
    } else {
      doc.text('No city data available.', 14, 70);
    }

    doc.save('jalmitra_water_analytics.pdf');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Water Analytics Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live data from water entry feeds dashboard charts and leakage analytics.
          </p>
        </div>
        <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
          <Download size={18} /> Download PDF Report
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {summary ? summary.total_supplied_week.toLocaleString() : '0'} L
                </div>
                <div className="mt-1 text-xs text-muted-foreground">7-day window</div>
              </div>
              <Droplets className="text-primary" size={36} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {summary ? summary.total_consumed_week.toLocaleString() : '0'} L
                </div>
                <div className="mt-1 text-xs text-muted-foreground">From submitted entries</div>
              </div>
              <Activity className="text-secondary" size={36} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Water Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{summary?.avg_loss_percent_week ?? 0}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {summary ? summary.total_leakage_week.toLocaleString() : '0'} L lost
                </div>
              </div>
              <AlertTriangle className="text-destructive" size={36} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Tracked Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{dash?.cities_count ?? 0}</div>
                <div className="mt-1 text-xs text-muted-foreground">{summary?.active_alerts ?? 0} active alerts</div>
              </div>
              <MapPin className="text-primary" size={36} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer>
              <BarChart data={weeklyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="supplied" fill="var(--primary)" />
                <Bar dataKey="consumed" fill="var(--secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loss Percent Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer>
              <LineChart data={lossTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="loss" stroke="var(--destructive)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leakage by City</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>City</TableHeader>
                <TableHeader>Supplied</TableHeader>
                <TableHeader>Consumed</TableHeader>
                <TableHeader>Leakage</TableHeader>
                <TableHeader>Loss %</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {leakRows.map((row) => (
                <TableRow key={`${row.city_name}-${row.status}`}>
                  <TableCell className="font-medium">{row.city_name}</TableCell>
                  <TableCell>{row.supplied.toLocaleString()} L</TableCell>
                  <TableCell>{row.consumed.toLocaleString()} L</TableCell>
                  <TableCell>{row.leakage_liters.toLocaleString()} L</TableCell>
                  <TableCell className={row.loss_percent > 10 ? 'font-semibold text-destructive' : ''}>
                    {row.loss_percent}%
                  </TableCell>
                  <TableCell>{badgeForLeak(row.status)}</TableCell>
                </TableRow>
              ))}
              {leakRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    No water entries yet. Add cities and submit water data from Data Entry.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
