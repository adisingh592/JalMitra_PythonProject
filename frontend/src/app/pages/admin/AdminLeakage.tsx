import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { AlertTriangle, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiUrl } from '../../lib/api';

type LeakageRes = {
  range: { start: string; end: string };
  summary: { total_leakage_liters: number; avg_loss_percent: number; critical_areas: number };
  by_city: Array<{
    city_id: number;
    city_name: string;
    supplied: number;
    consumed: number;
    leakage_liters: number;
    loss_percent: number;
    status: string;
    carried_forward: boolean;
  }>;
};

export function AdminLeakage() {
  const [data, setData] = useState<LeakageRes | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<LeakageRes>(apiUrl('/api/analytics/leakage'))
      .then((r) => setData(r.data))
      .catch(() => setErr('Could not load leakage analytics.'));
  }, []);

  const chartData =
    data?.by_city.map((r) => ({
      area: r.city_name,
      loss: r.leakage_liters,
    })) ?? [];

  const rows = data?.by_city ?? [];
  const sum = data?.summary;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl text-foreground">Leakage Detection</h1>
          <p className="text-sm text-muted-foreground">
            Window {data?.range.start} → {data?.range.end} (carry-forward where no entry)
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <AlertTriangle size={20} className="text-destructive" />
          <span>{sum?.critical_areas ?? 0} cities with loss &gt; 10%</span>
        </div>
      </div>

      {err && <div className="p-3 rounded bg-destructive text-destructive-foreground text-sm">{err}</div>}

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Water Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-destructive">{sum ? sum.total_leakage_liters.toLocaleString() : 0} L</div>
            <div className="text-xs text-muted-foreground mt-1">Effective (7-day window)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Average Loss Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">{sum ? sum.avg_loss_percent.toFixed(1) : 0}%</div>
            <div className="text-xs text-muted-foreground mt-1">Across cities (latest day)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Critical Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-destructive">{sum?.critical_areas ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Loss &gt; 10%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Water Loss by City</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.length ? chartData : [{ area: '—', loss: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="area" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                }}
              />
              <Legend />
              <Bar dataKey="loss" fill="var(--destructive)" name="Water Loss (L)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Leakage Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>City</TableHeader>
                <TableHeader>Supplied (L)</TableHeader>
                <TableHeader>Consumed (L)</TableHeader>
                <TableHeader>Loss (L)</TableHeader>
                <TableHeader>Loss (%)</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Carried</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No data. Add cities and submit daily water entries.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.city_id} className={row.status === 'critical' ? 'bg-destructive/5' : ''}>
                    <TableCell className="text-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className={row.status === 'critical' ? 'text-destructive' : 'text-muted-foreground'} />
                        {row.city_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{row.supplied}</TableCell>
                    <TableCell className="text-foreground">{row.consumed}</TableCell>
                    <TableCell className={row.status === 'critical' ? 'text-destructive' : 'text-foreground'}>
                      {row.leakage_liters}
                    </TableCell>
                    <TableCell className={row.status === 'critical' ? 'text-destructive' : 'text-foreground'}>
                      {row.loss_percent}%
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          row.status === 'critical'
                            ? 'bg-destructive text-destructive-foreground'
                            : row.status === 'warning'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.carried_forward ? 'yes' : 'no'}</TableCell>
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
