import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type BillItem = {
  id: number;
  period: string;
  usage_liters: number;
  rate_per_liter: number;
  amount: number;
  due_date: string | null;
  paid: boolean;
};

export function MemberUsage() {
  const { token } = useAuth();
  const [bills, setBills] = useState<BillItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<BillItem[]>(apiUrl('/api/member/bills'), {
          headers: { Authorization: token },
        });
        if (!cancelled) setBills(res.data);
      } catch (err: unknown) {
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
        if (!cancelled) setError(typeof detail === 'string' ? detail : 'Could not load usage history.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const latest = bills[0];
  const avgUsage = bills.length ? Math.round(bills.reduce((sum, bill) => sum + bill.usage_liters, 0) / bills.length) : 0;
  const monthlyUsage = [...bills].reverse().map((bill) => ({
    month: bill.period,
    usage: bill.usage_liters,
    bill: bill.amount,
  }));
  const trendData = monthlyUsage.slice(-6);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl text-foreground">Water Usage</h1>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Latest Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">{latest ? `${latest.usage_liters.toLocaleString()} L` : '0 L'}</div>
            <div className="text-xs text-muted-foreground mt-1">{latest?.period || 'No bill yet'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Average Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">{avgUsage.toLocaleString()} L</div>
            <div className="text-xs text-muted-foreground mt-1">Across generated bills</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Latest Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">{latest ? `Rs ${latest.amount.toLocaleString()}` : 'Rs 0'}</div>
            <div className="text-xs text-muted-foreground mt-1">{latest?.paid ? 'Paid' : 'Pending'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="usage" fill="var(--chart-2)" name="Usage (L)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Usage Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip />
              <Line type="monotone" dataKey="usage" stroke="var(--chart-2)" strokeWidth={2} name="Usage (L)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Month</TableHeader>
                <TableHeader>Usage (L)</TableHeader>
                <TableHeader>Bill</TableHeader>
                <TableHeader>Rate (Rs/L)</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="text-foreground">{bill.period}</TableCell>
                  <TableCell className="text-foreground">{bill.usage_liters.toLocaleString()}</TableCell>
                  <TableCell className="text-foreground">Rs {bill.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-foreground">{bill.rate_per_liter}</TableCell>
                  <TableCell className={`text-foreground ${bill.paid ? 'text-secondary' : 'text-destructive'}`}>
                    {bill.paid ? 'Paid' : 'Pending'}
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-20">
                    No usage records yet.
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
