import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { Button } from '../../components/ui/button';
import { apiUrl } from '../../lib/api';

type StaffItem = {
  id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  designation: string | null;
  department: string | null;
  employee_id: string | null;
  office_address: string | null;
  salary: number | null;
  residential_address: string | null;
  joining_date: string | null;
  age: number | null;
  profile_bio: string | null;
  notes: string | null;
  is_active: boolean;
};

function formatMoney(amount?: number | null) {
  if (amount === null || amount === undefined) return 'No salary set';
  return `Rs ${amount.toLocaleString()}`;
}

export function AdminStaff() {
  const { token } = useAuth();
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = async () => {
    if (!token) return;
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await axios.get<StaffItem[]>(apiUrl('/api/admin/staff'), {
        headers: { Authorization: token },
      });
      setStaff(res.data);
    } catch (err: unknown) {
      const detailMessage = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detailMessage === 'string' ? detailMessage : 'Could not load staff details.');
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    void loadStaff();
  }, [token]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Staff Directory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View details of all employees and administrators including salary and profile.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold text-foreground">All Staff</h2>
        <Button variant="outline" onClick={() => void loadStaff()} disabled={loadingStaff}>
          {loadingStaff ? 'Refreshing...' : 'Refresh Staff'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name / Emp ID</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Contact</TableHeader>
                <TableHeader>Age / Joined</TableHeader>
                <TableHeader>Salary</TableHeader>
                <TableHeader>Address</TableHeader>
                <TableHeader>Profile Bio</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium">
                    <div>{emp.full_name || emp.username}</div>
                    <div className="text-xs text-muted-foreground">{emp.employee_id || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div>{emp.designation || '-'}</div>
                    <div className="text-xs text-muted-foreground">{emp.department || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div>{emp.mobile || '-'}</div>
                    <div className="text-xs text-muted-foreground">{emp.email || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div>{emp.age ? `${emp.age} yrs` : '-'}</div>
                    <div className="text-xs text-muted-foreground">{emp.joining_date || '-'}</div>
                  </TableCell>
                  <TableCell>{formatMoney(emp.salary)}</TableCell>
                  <TableCell>
                    <div className="text-xs max-w-[150px] truncate" title={emp.residential_address || ''}>
                      {emp.residential_address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs max-w-[200px] truncate" title={emp.profile_bio || ''}>
                      {emp.profile_bio || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loadingStaff && staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No staff found.
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
