import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
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
  residential_address: string | null;
  joining_date: string | null;
  age: number | null;
  profile_bio: string | null;
  notes: string | null;
};

export function AdminProfile() {
  const { token, userId } = useAuth();
  const [profile, setProfile] = useState<StaffItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get<StaffItem[]>(apiUrl('/api/admin/staff'), {
          headers: { Authorization: token },
        });
        const mine = res.data.find((staff) => staff.id === userId) || null;
        if (!cancelled) setProfile(mine);
      } catch (err) {
        if (!cancelled) setError('Could not load admin profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading profile...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!profile) return <div className="p-6 text-muted-foreground">Admin profile not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl text-foreground">Admin Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account and staff details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{profile.full_name || profile.username}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Username:</span> {profile.username}</div>
          <div><span className="text-muted-foreground">Employee ID:</span> {profile.employee_id || '-'}</div>
          <div><span className="text-muted-foreground">Mobile:</span> {profile.mobile || '-'}</div>
          <div><span className="text-muted-foreground">Email:</span> {profile.email || '-'}</div>
          <div><span className="text-muted-foreground">Designation:</span> {profile.designation || '-'}</div>
          <div><span className="text-muted-foreground">Department:</span> {profile.department || '-'}</div>
          <div><span className="text-muted-foreground">Joining Date:</span> {profile.joining_date || '-'}</div>
          <div><span className="text-muted-foreground">Age:</span> {profile.age ?? '-'}</div>
          <div className="md:col-span-2"><span className="text-muted-foreground">Office Address:</span> {profile.office_address || '-'}</div>
          <div className="md:col-span-2"><span className="text-muted-foreground">Residential Address:</span> {profile.residential_address || '-'}</div>
          <div className="md:col-span-2"><span className="text-muted-foreground">Profile Bio:</span> {profile.profile_bio || '-'}</div>
          <div className="md:col-span-2"><span className="text-muted-foreground">Notes:</span> {profile.notes || '-'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
