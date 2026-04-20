import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Activity, Bell, Droplets, MapPin, Users, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { apiUrl } from '../../lib/api';

type DashboardRes = {
  summary: {
    total_supplied_week: number;
    active_alerts: number;
  };
  cities_count: number;
};

type LeakageRes = {
  summary: {
    total_leakage_liters: number;
  };
};

export function AdminDashboard() {
  const { token } = useAuth();
  const [dash, setDash] = useState<DashboardRes | null>(null);
  const [leak, setLeak] = useState<LeakageRes | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);

  const loadData = async () => {
    if (!token) return;
    try {
      const [dashRes, leakRes, membersRes, staffRes] = await Promise.all([
        axios.get<DashboardRes>(apiUrl('/api/analytics/dashboard'), { headers: { Authorization: token } }),
        axios.get<LeakageRes>(apiUrl('/api/analytics/leakage'), { headers: { Authorization: token } }),
        axios.get<unknown[]>(apiUrl('/api/admin/members?active_only=false'), { headers: { Authorization: token } }),
        axios.get<unknown[]>(apiUrl('/api/admin/staff'), { headers: { Authorization: token } }),
      ]);
      setDash(dashRes.data);
      setLeak(leakRes.data);
      setMembersCount(membersRes.data.length);
      setStaffCount(staffRes.data.length);
    } catch {
      // Gracefully handle errors on the summary dashboard
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Jal Mitra control center. Here is a high-level overview of the system status.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Water Supplied (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">
                {dash?.summary?.total_supplied_week?.toLocaleString() ?? 0} L
              </div>
              <Droplets className="text-primary h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leakage Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">
                {leak?.summary?.total_leakage_liters?.toLocaleString() ?? 0} L
              </div>
              <Activity className="text-destructive h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">
                {dash?.summary?.active_alerts ?? 0}
              </div>
              <Bell className="text-amber-500 h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registered Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">
                {membersCount}
              </div>
              <Users className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff & Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">
                {staffCount}
              </div>
              <User className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monitored Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-foreground">
                {dash?.cities_count ?? 0}
              </div>
              <MapPin className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
