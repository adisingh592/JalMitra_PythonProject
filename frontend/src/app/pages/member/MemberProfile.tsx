import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { apiUrl } from '../../lib/api';

type MemberDetail = {
  id: number;
  username: string;
  full_name: string | null;
  mobile: string | null;
  email: string | null;
  alternate_mobile: string | null;
  village_name: string | null;
  village_location: string | null;
  address: string | null;
  meter_id: string | null;
  consumer_number: string | null;
  connection_type: string | null;
  remarks: string | null;
};

export function MemberProfile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get<MemberDetail>(apiUrl('/api/member/profile'), {
          headers: { Authorization: token },
        });
        if (!cancelled) setProfile(res.data);
      } catch {
        if (!cancelled) setError('Could not load member profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading profile...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!profile) return <div className="p-6 text-muted-foreground">Member profile not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl text-foreground">Member Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your household and connection details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{profile.full_name || profile.username}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Username:</span> {profile.username}</div>
          <div><span className="text-muted-foreground">Consumer Number:</span> {profile.consumer_number || '-'}</div>
          <div><span className="text-muted-foreground">Mobile:</span> {profile.mobile || '-'}</div>
          <div><span className="text-muted-foreground">Alternate Mobile:</span> {profile.alternate_mobile || '-'}</div>
          <div><span className="text-muted-foreground">Email:</span> {profile.email || '-'}</div>
          <div><span className="text-muted-foreground">Meter ID:</span> {profile.meter_id || '-'}</div>
          <div><span className="text-muted-foreground">Connection Type:</span> {profile.connection_type || '-'}</div>
          <div><span className="text-muted-foreground">Village/City:</span> {profile.village_name || '-'}</div>
          <div><span className="text-muted-foreground">Area:</span> {profile.village_location || '-'}</div>
          <div className="md:col-span-2"><span className="text-muted-foreground">Address:</span> {profile.address || '-'}</div>
          <div className="md:col-span-2"><span className="text-muted-foreground">Remarks:</span> {profile.remarks || '-'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
