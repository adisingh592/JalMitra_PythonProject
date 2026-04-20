import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { FileText, TrendingUp, Droplets } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiUrl } from '../../lib/api';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export function AdminReports() {
  const [dash, setDash] = useState<{
    summary: { total_supplied_week: number; total_consumed_week: number; avg_loss_percent_week: number };
    daily: Array<{ date: string; label: string; total_supplied: number; total_consumed: number }>;
  } | null>(null);
  const [leak, setLeak] = useState<{
    by_city: Array<{ city_name: string; consumed: number; supplied: number }>;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      axios.get(apiUrl('/api/analytics/dashboard')),
      axios.get(apiUrl('/api/analytics/leakage')),
    ]).then(([d, l]) => {
      setDash(d.data);
      setLeak(l.data);
    });
  }, []);

  const consumptionByCity =
    leak?.by_city.map((r) => ({ name: r.city_name, value: r.consumed })) ?? [];

  const weeklyBars =
    dash?.daily.map((x) => ({
      day: x.label,
      supply: x.total_supplied,
      consumption: x.total_consumed,
    })) ?? [];

  const s = dash?.summary;
  const eff = s && s.total_supplied_week > 0 ? (100 - (s.avg_loss_percent_week || 0)).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-foreground">Reports & Analytics</h1>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Supply (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl text-foreground">{s ? s.total_supplied_week.toLocaleString() : 0} L</div>
              <Droplets size={32} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Consumption (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl text-foreground">{s ? s.total_consumed_week.toLocaleString() : 0} L</div>
              <TrendingUp size={32} className="text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Avg loss % (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">{s ? s.avg_loss_percent_week.toFixed(1) : 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Efficiency (approx)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl text-foreground">{eff}%</div>
              <FileText size={32} className="text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consumption by city (latest effective)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consumptionByCity.length ? consumptionByCity : [{ name: '—', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: { name?: string }) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(consumptionByCity.length ? consumptionByCity : [{ name: '—', value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7-day supply vs consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyBars.length ? weeklyBars : [{ day: '—', supply: 0, consumption: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Bar dataKey="supply" fill="var(--chart-1)" name="Supply (L)" />
                <Bar dataKey="consumption" fill="var(--chart-2)" name="Consumption (L)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
