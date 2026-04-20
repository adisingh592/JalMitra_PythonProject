import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Phone, User, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { apiUrl } from '../../lib/api';

type LatestBill = {
  id: number;
  period: string;
  usage_liters: number;
  rate_per_liter: number;
  amount: number;
  paid: boolean;
  due_date: string | null;
};

type MemberListItem = {
  id: number;
  username: string;
  full_name: string | null;
  mobile: string | null;
  email: string | null;
  village_name: string | null;
  village_location: string | null;
  address: string | null;
  consumer_number: string | null;
  latest_bill: LatestBill | null;
};

type BillItem = {
  id: number;
  period: string;
  usage_liters: number;
  rate_per_liter: number;
  amount: number;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
  notes: string | null;
};

type MemberDetail = MemberListItem & {
  alternate_mobile: string | null;
  meter_id: string | null;
  connection_type: string | null;
  remarks: string | null;
  is_active: boolean;
  bills: BillItem[];
};

type EditForm = {
  full_name: string;
  mobile: string;
  email: string;
  password: string;
};

type GenerateBillForm = {
  period: string;
  usage_liters: string;
  due_date: string;
  notes: string;
};

type TariffRule = {
  max_usage: number;
  rate_per_liter: number;
};

function formatMoney(amount?: number | null) {
  if (amount === null || amount === undefined) return 'No bill';
  return `Rs ${amount.toLocaleString()}`;
}

function badgeForBill(paid: boolean) {
  return paid ? (
    <Badge className="bg-green-600 text-white hover:bg-green-600">Paid</Badge>
  ) : (
    <Badge variant="destructive">Pending</Badge>
  );
}

function rateForUsage(usageLiters: number, rules: TariffRule[]) {
  for (const rule of rules) {
    if (usageLiters <= rule.max_usage) return rule.rate_per_liter;
  }
  return rules[rules.length - 1]?.rate_per_liter ?? 0;
}

export function AdminUsers() {
  const { token } = useAuth();

  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ full_name: '', mobile: '', email: '', password: '' });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [tariffRules, setTariffRules] = useState<TariffRule[]>([
    { max_usage: 3000, rate_per_liter: 1 },
    { max_usage: 5000, rate_per_liter: 2 },
    { max_usage: 1000000000, rate_per_liter: 3 },
  ]);
  const [generateBillForm, setGenerateBillForm] = useState<GenerateBillForm>({
    period: new Date().toISOString().slice(0, 7),
    usage_liters: '',
    due_date: '',
    notes: '',
  });

  const loadMembers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res = await axios.get<MemberListItem[]>(apiUrl('/api/admin/members?active_only=false'), {
        headers: { Authorization: token },
      });
      setMembers(res.data);
    } catch (err: unknown) {
      const detailMessage = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detailMessage === 'string' ? detailMessage : 'Could not load members.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTariffRules = async () => {
    if (!token) return;
    try {
      const res = await axios.get<{ rules: TariffRule[] }>(apiUrl('/api/admin/settings/billing-tariff'), {
        headers: { Authorization: token },
      });
      setTariffRules(res.data.rules);
    } catch {
      // Keep defaults
    }
  };

  const loadMemberDetail = async (memberId: number) => {
    if (!token) return;
    setLoadingDetail(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await axios.get<MemberDetail>(apiUrl(`/api/admin/members/${memberId}`), {
        headers: { Authorization: token },
      });
      setDetail(res.data);
      setEditForm({
        full_name: res.data.full_name ?? '',
        mobile: res.data.mobile ?? '',
        email: res.data.email ?? '',
        password: '',
      });
      const latestBill = res.data.bills[0];
      setGenerateBillForm({
        period: latestBill?.period ?? new Date().toISOString().slice(0, 7),
        usage_liters: latestBill ? String(latestBill.usage_liters) : '',
        due_date: latestBill?.due_date ?? '',
        notes: latestBill?.notes ?? '',
      });
      setDialogOpen(true);
    } catch (err: unknown) {
      const detailMessage = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detailMessage === 'string' ? detailMessage : 'Could not load member details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    setError(null);
    setSuccess(null);
    void loadTariffRules();
    void loadMembers();
  }, [token]);

  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !detail) return;
    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(
        apiUrl(`/api/admin/members/${detail.id}`),
        {
          full_name: editForm.full_name.trim() || null,
          mobile: editForm.mobile.trim() || null,
          email: editForm.email.trim() || null,
          password: editForm.password.trim() || null,
        },
        { headers: { Authorization: token } },
      );
      await Promise.all([loadMemberDetail(detail.id), loadMembers()]);
      setSuccess('Member profile updated.');
    } catch (err: unknown) {
      const detailMessage = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detailMessage === 'string' ? detailMessage : 'Could not update member profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleBillPaid = async (bill: BillItem) => {
    if (!token || !detail) return;
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(
        apiUrl(`/api/admin/bills/${bill.id}`),
        { paid: !bill.paid },
        { headers: { Authorization: token } },
      );
      await Promise.all([loadMemberDetail(detail.id), loadMembers()]);
      setSuccess(`Bill ${bill.period} marked as ${bill.paid ? 'pending' : 'paid'}.`);
    } catch (err: unknown) {
      const detailMessage = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detailMessage === 'string' ? detailMessage : 'Could not update bill status.');
    }
  };

  const handleGenerateBillChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setGenerateBillForm((current) => ({ ...current, [name]: value }));
  };

  const generateBill = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !detail) return;
    setGeneratingBill(true);
    setError(null);
    setSuccess(null);
    try {
      const usageLiters = parseInt(generateBillForm.usage_liters, 10);
      if (Number.isNaN(usageLiters)) {
        setError('Enter a valid water usage value before generating the bill.');
        return;
      }
      await axios.post(
        apiUrl(`/api/admin/members/${detail.id}/generate-bill`),
        {
          period: generateBillForm.period.trim() || null,
          usage_liters: usageLiters,
          due_date: generateBillForm.due_date.trim() || null,
          notes: generateBillForm.notes.trim() || null,
        },
        { headers: { Authorization: token } },
      );
      await Promise.all([loadMemberDetail(detail.id), loadMembers(), loadTariffRules()]);
      setSuccess('Bill generated successfully.');
    } catch (err: unknown) {
      const detailMessage = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detailMessage === 'string' ? detailMessage : 'Could not generate bill.');
    } finally {
      setGeneratingBill(false);
    }
  };

  const previewUsageLiters = parseInt(generateBillForm.usage_liters, 10);
  const previewRate = Number.isNaN(previewUsageLiters) ? 0 : rateForUsage(previewUsageLiters, tariffRules);
  const previewAmount = Number.isNaN(previewUsageLiters) ? 0 : previewUsageLiters * previewRate;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users and Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review every member, billing status, village and area details, then update contact info or generate bills.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-600/30 bg-green-600/10 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-foreground">All Members ({members.length})</h2>
        </div>
        <Button variant="outline" onClick={() => void loadMembers()} disabled={loadingUsers}>
          {loadingUsers ? 'Refreshing...' : 'Refresh Members'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Username</TableHeader>
                <TableHeader>Village</TableHeader>
                <TableHeader>Area / Address</TableHeader>
                <TableHeader>Water Usage</TableHeader>
                <TableHeader>Current Bill</TableHeader>
                <TableHeader>Paid Status</TableHeader>
                <TableHeader>Profile</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow
                  key={member.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => void loadMemberDetail(member.id)}
                >
                  <TableCell className="font-medium">{member.full_name || member.username}</TableCell>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>{member.village_name || '-'}</TableCell>
                  <TableCell>{member.address || member.village_location || '-'}</TableCell>
                  <TableCell>{member.latest_bill ? `${member.latest_bill.usage_liters.toLocaleString()} L` : <span className="text-muted-foreground">No usage</span>}</TableCell>
                  <TableCell>{formatMoney(member.latest_bill?.amount)}</TableCell>
                  <TableCell>{member.latest_bill ? badgeForBill(member.latest_bill.paid) : <span className="text-muted-foreground">No bill</span>}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        void loadMemberDetail(member.id);
                      }}
                    >
                      <User className="mr-1 h-4 w-4" /> Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loadingUsers && members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No members found yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.full_name || detail?.username || 'Member Profile'}</DialogTitle>
            <DialogDescription>
              Review full profile, bill history, and update phone, email, password, or bill paid status.
            </DialogDescription>
          </DialogHeader>

          {loadingDetail && <div className="py-8 text-center text-sm text-muted-foreground">Loading profile...</div>}

          {detail && !loadingDetail && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Account</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Username:</span> {detail.username}</div>
                    <div><span className="text-muted-foreground">Consumer #:</span> {detail.consumer_number || '-'}</div>
                    <div><span className="text-muted-foreground">Meter ID:</span> {detail.meter_id || '-'}</div>
                    <div><span className="text-muted-foreground">Connection:</span> {detail.connection_type || '-'}</div>
                    <div><span className="text-muted-foreground">Latest usage:</span> {detail.latest_bill ? `${detail.latest_bill.usage_liters.toLocaleString()} L` : '-'}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Village:</span> {detail.village_name || '-'}</div>
                    <div><span className="text-muted-foreground">Area:</span> {detail.village_location || '-'}</div>
                    <div><span className="text-muted-foreground">Address:</span> {detail.address || '-'}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {detail.mobile || '-'}</div>
                    <div><span className="text-muted-foreground">Alt phone:</span> {detail.alternate_mobile || '-'}</div>
                    <div><span className="text-muted-foreground">Email:</span> {detail.email || '-'}</div>
                    <div><span className="text-muted-foreground">Status:</span> {detail.is_active ? 'Active' : 'Inactive'}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Bill History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {detail.bills.map((bill) => (
                    <div key={bill.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1 text-sm">
                          <div className="font-medium text-foreground">{bill.period}</div>
                          <div className="text-muted-foreground">Usage: {bill.usage_liters.toLocaleString()} L</div>
                          <div className="text-muted-foreground">Rate: Rs {bill.rate_per_liter} / L</div>
                          <div className="text-muted-foreground">Due: {bill.due_date || '-'}</div>
                          <div className="text-muted-foreground">Amount: {formatMoney(bill.amount)}</div>
                          <div className="text-muted-foreground">Paid on: {bill.paid_date || '-'}</div>
                          {bill.notes && <div className="text-muted-foreground">Notes: {bill.notes}</div>}
                        </div>
                        <div className="flex items-center gap-3">
                          {badgeForBill(bill.paid)}
                          <Button variant="outline" onClick={() => void toggleBillPaid(bill)}>
                            Mark as {bill.paid ? 'Pending' : 'Paid'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {detail.bills.length === 0 && <p className="text-sm text-muted-foreground">No bills found for this member.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generate Bill</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={generateBill} className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="period">Billing Period</Label>
                      <Input id="period" name="period" value={generateBillForm.period} onChange={handleGenerateBillChange} placeholder="YYYY-MM" />
                    </div>
                    <div>
                      <Label htmlFor="usage_liters">Water Usage (Liters)</Label>
                      <Input id="usage_liters" name="usage_liters" type="number" min="0" value={generateBillForm.usage_liters} onChange={handleGenerateBillChange} />
                    </div>
                    <div>
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input id="due_date" name="due_date" type="date" value={generateBillForm.due_date} onChange={handleGenerateBillChange} />
                    </div>
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm md:col-span-2">
                      <div className="font-medium text-foreground">Automatic Tariff Preview</div>
                      <div className="mt-1 text-muted-foreground">
                        {tariffRules.map((rule, index) => (
                          <span key={`${rule.max_usage}-${rule.rate_per_liter}`}>
                            {index > 0 ? ', ' : ''}
                            up to {rule.max_usage.toLocaleString()} L: Rs {rule.rate_per_liter}/L
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-foreground">Applied rate: Rs {previewRate} / L</div>
                      <div className="text-foreground">Generated amount: Rs {previewAmount.toLocaleString()}</div>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="bill_notes">Notes</Label>
                      <Input id="bill_notes" name="notes" value={generateBillForm.notes} onChange={handleGenerateBillChange} placeholder="Optional bill notes" />
                    </div>
                    <DialogFooter className="md:col-span-2">
                      <Button type="submit" disabled={generatingBill}>
                        {generatingBill ? 'Generating...' : 'Generate Bill'}
                      </Button>
                    </DialogFooter>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Edit Member</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEditSubmit} className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" name="full_name" value={editForm.full_name} onChange={handleEditChange} />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Phone</Label>
                      <Input id="mobile" name="mobile" value={editForm.mobile} onChange={handleEditChange} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={editForm.email} onChange={handleEditChange} />
                    </div>
                    <div>
                      <Label htmlFor="password">New Password</Label>
                      <Input id="password" name="password" type="password" value={editForm.password} onChange={handleEditChange} placeholder="Leave blank to keep current password" />
                    </div>
                    <DialogFooter className="md:col-span-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Close
                      </Button>
                      <Button type="submit" disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </DialogFooter>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
