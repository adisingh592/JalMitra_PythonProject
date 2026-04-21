import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import { generateBillPDF, type BillData, type MemberProfile } from '../../lib/pdfGenerator';

type AdminPaymentSummary = {
  total_billed: number;
  total_collected: number;
  total_pending: number;
  paid_bills: number;
  pending_bills: number;
};

type AdminPaymentRow = {
  bill_id: number;
  member_id: number;
  member_name: string | null;
  member_username: string | null;
  member_mobile: string | null;
  consumer_number: string | null;
  address: string | null;
  village_name: string | null;
  period: string;
  usage_liters: number;
  rate_per_liter: number;
  amount: number;
  status: 'paid' | 'pending';
  paid_date: string | null;
  due_date: string | null;
  method: string;
  notes?: string | null;
};

function money(v: number) {
  return `Rs ${v.toLocaleString()}`;
}

export function AdminPayments() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AdminPaymentSummary | null>(null);
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [summaryRes, historyRes] = await Promise.all([
          axios.get<AdminPaymentSummary>(apiUrl('/api/admin/payments/summary'), {
            headers: { Authorization: token },
          }),
          axios.get<AdminPaymentRow[]>(apiUrl('/api/admin/payments/history'), {
            headers: { Authorization: token },
          }),
        ]);
        if (!cancelled) {
          setSummary(summaryRes.data);
          setRows(historyRes.data);
          setError(null);
        }
      } catch (err: unknown) {
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
        if (!cancelled) setError(typeof detail === 'string' ? detail : 'Unable to load payment analytics.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const collectedPct = useMemo(() => {
    if (!summary || summary.total_billed <= 0) return 0;
    return Math.round((summary.total_collected / summary.total_billed) * 100);
  }, [summary]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const userText = `${row.member_name || ''} ${row.member_username || ''} ${row.member_id}`.toLowerCase();
      if (search.trim() && !userText.includes(search.trim().toLowerCase())) return false;

      const baseDate = (row.paid_date || row.due_date || '').slice(0, 10);
      if (dateFrom && baseDate && baseDate < dateFrom) return false;
      if (dateTo && baseDate && baseDate > dateTo) return false;
      if ((dateFrom || dateTo) && !baseDate) return false;
      return true;
    });
  }, [rows, search, dateFrom, dateTo]);

  const filteredSummary = useMemo(() => {
    const totalBilled = filteredRows.reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalCollected = filteredRows
      .filter((row) => row.status === 'paid')
      .reduce((sum, row) => sum + (row.amount || 0), 0);
    return {
      totalBilled,
      totalCollected,
      totalPending: Math.max(0, totalBilled - totalCollected),
      paidCount: filteredRows.filter((row) => row.status === 'paid').length,
      pendingCount: filteredRows.filter((row) => row.status !== 'paid').length,
      razorpayAmount: filteredRows
        .filter((row) => row.status === 'paid' && (row.method || '').toLowerCase() === 'razorpay')
        .reduce((sum, row) => sum + (row.amount || 0), 0),
      otherAmount: filteredRows
        .filter((row) => row.status === 'paid' && (row.method || '').toLowerCase() !== 'razorpay')
        .reduce((sum, row) => sum + (row.amount || 0), 0),
    };
  }, [filteredRows]);

  const filteredCollectedPct = useMemo(() => {
    if (filteredSummary.totalBilled <= 0) return 0;
    return Math.round((filteredSummary.totalCollected / filteredSummary.totalBilled) * 100);
  }, [filteredSummary.totalBilled, filteredSummary.totalCollected]);

  const exportCsv = () => {
    const header = [
      'User',
      'Username',
      'Member ID',
      'Bill ID',
      'Period',
      'Amount',
      'Status',
      'Paid Date',
      'Due Date',
      'Method',
    ];
    const lines = filteredRows.map((row) =>
      [
        row.member_name || '',
        row.member_username || '',
        row.member_id,
        row.bill_id,
        row.period,
        row.amount,
        row.status,
        row.paid_date || '',
        row.due_date || '',
        row.method || '',
      ]
        .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_payment_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const toPdfPayload = (row: AdminPaymentRow): { member: MemberProfile; bill: BillData } => ({
    member: {
      full_name: row.member_name,
      username: row.member_username || `member_${row.member_id}`,
      consumer_number: row.consumer_number || null,
      mobile: row.member_mobile || null,
      address: row.address || null,
      village_name: row.village_name || null,
    },
    bill: {
      id: row.bill_id,
      period: row.period,
      amount: row.amount || 0,
      due_date: row.due_date || null,
      paid: row.status === 'paid',
      paid_date: row.paid_date || null,
      notes: row.notes || null,
      usage_liters: row.usage_liters || 0,
      rate_per_liter: row.rate_per_liter || 0,
    },
  });

  const downloadAllPaidBillsPdf = async () => {
    const paidRows = filteredRows.filter((row) => row.status === 'paid');
    if (paidRows.length === 0) {
      alert('No paid bills available in current filters.');
      return;
    }
    for (const row of paidRows) {
      const { member, bill } = toPdfPayload(row);
      generateBillPDF(member, bill);
      // Avoid browser download throttling by spacing calls slightly.
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">
          User-wise payment history, money collected till now, and remaining pending amount.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{money(filteredSummary.totalBilled)}</div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20 border-secondary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Money Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{money(filteredSummary.totalCollected)}</div>
            <div className="text-xs text-muted-foreground mt-1">{filteredCollectedPct}% of filtered billed</div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Remaining Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{money(filteredSummary.totalPending)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bills Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-foreground">Paid: {filteredSummary.paidCount}</div>
            <div className="text-sm text-foreground">Pending: {filteredSummary.pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Razorpay Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{money(filteredSummary.razorpayAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Other Methods Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{money(filteredSummary.otherAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All User Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <input
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
              type="text"
              placeholder="Search by user/username/member id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}>
                Export CSV
              </Button>
              <Button size="sm" onClick={() => void downloadAllPaidBillsPdf()}>
                Download Paid PDFs
              </Button>
            </div>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>User</TableHeader>
                <TableHeader>Bill ID</TableHeader>
                <TableHeader>Period</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Paid Date</TableHeader>
                <TableHeader>Due Date</TableHeader>
                <TableHeader>Method</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.bill_id}>
                  <TableCell className="text-foreground">
                    {row.member_name || row.member_username || `Member #${row.member_id}`}
                  </TableCell>
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
          {filteredRows.length === 0 && <div className="mt-3 text-sm text-muted-foreground">No payment records found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
