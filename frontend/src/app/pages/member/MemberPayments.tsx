import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { Download } from 'lucide-react';

const paymentHistory = [
  { id: 'PAY-2026-03', month: 'March 2026', amount: 310, date: '2026-03-28', method: 'UPI', status: 'Success' },
  { id: 'PAY-2026-02', month: 'February 2026', amount: 350, date: '2026-02-27', method: 'Net Banking', status: 'Success' },
  { id: 'PAY-2026-01', month: 'January 2026', amount: 320, date: '2026-01-29', method: 'UPI', status: 'Success' },
  { id: 'PAY-2025-12', month: 'December 2025', amount: 340, date: '2025-12-28', method: 'Cash', status: 'Success' },
];

export function MemberPayments() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl text-foreground">Payment History</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Paid (2026)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">₹980</div>
            <div className="text-xs text-muted-foreground mt-1">3 payments</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Last Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-foreground">₹310</div>
            <div className="text-xs text-muted-foreground mt-1">March 2026</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Next Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-destructive">₹285</div>
            <div className="text-xs text-muted-foreground mt-1">April 30, 2026</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Transaction ID</TableHeader>
                <TableHeader>Billing Period</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Payment Date</TableHeader>
                <TableHeader>Method</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Receipt</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-foreground">{payment.id}</TableCell>
                  <TableCell className="text-foreground">{payment.month}</TableCell>
                  <TableCell className="text-foreground">₹{payment.amount}</TableCell>
                  <TableCell className="text-foreground">{payment.date}</TableCell>
                  <TableCell className="text-foreground">{payment.method}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground">
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button className="text-primary hover:underline text-sm flex items-center gap-1">
                      <Download size={14} />
                      Download
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
