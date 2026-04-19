import { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

import { generateBillPDF, BillData, MemberProfile } from '../../lib/pdfGenerator';

type MemberDetail = MemberProfile & {
  bills: BillData[];
};

function money(value?: number | null) {
  if (value === null || value === undefined) return 'Rs 0';
  return `Rs ${value.toLocaleString()}`;
}

export function MemberBilling() {
  const { token } = useAuth();
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<MemberDetail>(apiUrl('/api/member/profile'), {
          headers: { Authorization: token },
        });
        if (!cancelled) setMemberDetail(res.data);
      } catch (err: unknown) {
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
        if (!cancelled) setError(typeof detail === 'string' ? detail : 'Could not load billing details.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const bills = memberDetail?.bills || [];
  const currentBill = bills[0] ?? null;

  const handlePayment = () => {
    alert('Payment gateway is not connected yet, but your live bill data is loading from the backend.');
  };

  const handleDownload = (bill: BillData) => {
    if (memberDetail) {
      generateBillPDF(memberDetail, bill);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Latest bill and bill history are now loaded from your account records.</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Bill</CardTitle>
              <span
                className={`rounded px-3 py-1 text-sm ${
                  currentBill?.paid ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {currentBill ? (currentBill.paid ? 'Paid' : 'Unpaid') : 'No bill'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="mb-2 text-sm text-muted-foreground">Amount Due</div>
                  <div className="flex items-center gap-2 text-5xl text-primary">
                    <IndianRupee size={40} />
                    {currentBill ? currentBill.amount : 0}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Due by {currentBill?.due_date || '-'}</div>
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-foreground">
                  <span>Billing Period:</span>
                  <span>{currentBill?.period || '-'}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Status:</span>
                  <span>{currentBill ? (currentBill.paid ? 'Paid' : 'Pending') : '-'}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span>Total Amount:</span>
                  <span>{money(currentBill?.amount)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button className="flex-1" onClick={handlePayment}>
                  Pay Now
                </Button>
                {currentBill && (
                  <Button variant="outline" onClick={() => handleDownload(currentBill)}>
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bill History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bills.map((bill) => (
              <div key={bill.id} className="rounded border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-foreground">{bill.period}</div>
                    <div className="text-xs text-muted-foreground">Due: {bill.due_date || '-'}</div>
                    {bill.paid_date && <div className="text-xs text-muted-foreground">Paid on: {bill.paid_date}</div>}
                    {bill.notes && <div className="text-xs text-muted-foreground">Notes: {bill.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-foreground">{money(bill.amount)}</div>
                    <div className={`text-xs ${bill.paid ? 'text-secondary' : 'text-destructive'}`}>
                      {bill.paid ? 'Paid' : 'Pending'}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 h-8 px-2 text-xs" 
                      onClick={() => handleDownload(bill)}
                    >
                      <Download size={12} className="mr-1" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {bills.length === 0 && <div className="text-sm text-muted-foreground">No bills found.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
