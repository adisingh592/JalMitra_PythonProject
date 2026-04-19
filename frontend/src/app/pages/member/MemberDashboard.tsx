import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle, Droplets, IndianRupee, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type BillItem = {
  id: number;
  period: string;
  amount: number;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
};

type OverviewRes = {
  member: {
    full_name: string | null;
    username: string;
    village_name: string | null;
    village_location: string | null;
    address: string | null;
    bills: BillItem[];
  };
  latest_bill: {
    id: number;
    period: string;
    amount: number;
    paid: boolean;
    due_date: string | null;
  } | null;
  summary: {
    unpaid_bills: number;
    total_bills: number;
    paid_bills: number;
  };
};

function money(value?: number | null) {
  if (value === null || value === undefined) return 'Rs 0';
  return `Rs ${value.toLocaleString()}`;
}

export function MemberDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<OverviewRes | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<OverviewRes>(apiUrl('/api/member/overview'), {
          headers: { Authorization: token },
        });
        if (!cancelled) setData(res.data);
      } catch (err: unknown) {
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
        if (!cancelled) setError(typeof detail === 'string' ? detail : 'Could not load member dashboard.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const latestBill = data?.latest_bill;
  const recentBills = data?.member.bills.slice(0, 3) ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl text-foreground">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your portal now reads live billing and account details from the backend.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Current Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl text-foreground">{money(latestBill?.amount)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Due: {latestBill?.due_date || '-'}</div>
              </div>
              <IndianRupee size={32} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl text-foreground">{latestBill ? (latestBill.paid ? 'Paid' : 'Pending') : 'No bill'}</div>
                <div className="mt-1 text-xs text-muted-foreground">{latestBill?.period || 'No billing period yet'}</div>
              </div>
              <Calendar size={32} className={latestBill?.paid ? 'text-secondary' : 'text-destructive'} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Village</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl text-foreground">{data?.member.village_name || '-'}</div>
                <div className="mt-1 text-xs text-muted-foreground">{data?.member.village_location || data?.member.address || '-'}</div>
              </div>
              <MapPin size={32} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Bill Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl text-foreground">{data?.summary.unpaid_bills ?? 0}</div>
                <div className="mt-1 text-xs text-muted-foreground">Unpaid bills</div>
              </div>
              <CheckCircle size={32} className="text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-foreground"><span className="text-muted-foreground">Member:</span> {data?.member.full_name || data?.member.username || '-'}</div>
            <div className="text-foreground"><span className="text-muted-foreground">Address:</span> {data?.member.address || '-'}</div>
            <div className="text-foreground"><span className="text-muted-foreground">Total bills:</span> {data?.summary.total_bills ?? 0}</div>
            <div className="text-foreground"><span className="text-muted-foreground">Paid bills:</span> {data?.summary.paid_bills ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBills.map((bill) => (
              <div key={bill.id} className="rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-foreground">{bill.period}</div>
                    <div className="text-xs text-muted-foreground">Due: {bill.due_date || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground">{money(bill.amount)}</div>
                    <div className={`text-xs ${bill.paid ? 'text-secondary' : 'text-destructive'}`}>
                      {bill.paid ? 'Paid' : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {recentBills.length === 0 && (
              <div className="text-sm text-muted-foreground">No bills available yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Water analytics shown in the admin portal update from data entry submissions. Member billing shown here updates from the bills stored for your account.
        </CardContent>
      </Card>
    </div>
  );
}
