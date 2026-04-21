import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type PaymentRow = {
  bill_id: number;
  period: string;
  amount: number;
  status: 'paid' | 'pending';
  paid_date: string | null;
  due_date: string | null;
  method: string;
};

function money(v: number) {
  return `Rs ${v.toLocaleString()}`;
}

export function MemberPayments() {
  const { token } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<PaymentRow[]>(apiUrl('/api/member/bills'), {
          headers: { Authorization: token },
        });
        if (!cancelled) {
          setRows(res.data);
          setError(null);
        }
      } catch (err: unknown) {
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
        if (!cancelled) setError(typeof detail === 'string' ? detail : 'Could not load payment history.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const paidRows = useMemo(() => rows.filter((r) => r.status === 'paid'), [rows]);
  const pendingRows = useMemo(() => rows.filter((r) => r.status !== 'paid'), [rows]);
  const totalPaid = useMemo(() => paidRows.reduce((sum, r) => sum + (r.amount || 0), 0), [paidRows]);
  const lastPayment = paidRows[0] ?? null;
  const nextDue = pendingRows[0] ?? null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl text-foreground">Payment History</h1>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">{money(totalPaid)}</div>
            <div className="text-xs text-muted-foreground mt-1">{paidRows.length} payments</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Last Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">{lastPayment ? money(lastPayment.amount) : '-'}</div>
            <div className="text-xs text-muted-foreground mt-1">{lastPayment?.paid_date || '-'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Next Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-destructive">{nextDue ? money(nextDue.amount) : 'Rs 0'}</div>
            <div className="text-xs text-muted-foreground mt-1">{nextDue?.due_date || 'No pending bills'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment & Bill History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Bill ID</TableHeader>
                <TableHeader>Billing Period</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Payment Date</TableHeader>
                <TableHeader>Due Date</TableHeader>
                <TableHeader>Method</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.bill_id}>
                  <TableCell className="text-foreground">#{row.bill_id}</TableCell>
                  <TableCell className="text-foreground">{row.period}</TableCell>
                  <TableCell className="text-foreground">{money(row.amount || 0)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        row.status === 'paid'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-destructive text-destructive-foreground'
                      }`}
                    >
                      {row.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground">{row.paid_date || '-'}</TableCell>
                  <TableCell className="text-foreground">{row.due_date || '-'}</TableCell>
                  <TableCell className="text-foreground">{row.method || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 && <div className="mt-3 text-sm text-muted-foreground">No payment history found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
