import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

const scheduleData = [
  { day: 'Monday', morning: '6:00 AM - 8:00 AM', evening: '6:00 PM - 8:00 PM' },
  { day: 'Tuesday', morning: '6:00 AM - 8:00 AM', evening: '6:00 PM - 8:00 PM' },
  { day: 'Wednesday', morning: '6:00 AM - 8:00 AM', evening: '6:00 PM - 8:00 PM' },
  { day: 'Thursday', morning: '6:00 AM - 8:00 AM', evening: '6:00 PM - 8:00 PM' },
  { day: 'Friday', morning: '6:00 AM - 8:00 AM', evening: '6:00 PM - 8:00 PM' },
  { day: 'Saturday', morning: '6:00 AM - 9:00 AM', evening: '5:00 PM - 8:00 PM' },
  { day: 'Sunday', morning: '6:00 AM - 9:00 AM', evening: '5:00 PM - 8:00 PM' },
];

const upcomingMaintenance = [
  {
    date: '2026-04-15',
    area: 'Area A',
    time: '9:00 AM - 2:00 PM',
    reason: 'Pump maintenance',
    impact: 'No water supply'
  },
  {
    date: '2026-04-22',
    area: 'Area B',
    time: '10:00 AM - 1:00 PM',
    reason: 'Pipeline repair',
    impact: 'Low pressure'
  },
];

export function MemberSchedule() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl text-foreground">Water Supply Schedule</h1>

      <Card>
        <CardHeader>
          <CardTitle>Regular Supply Timing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleData.map((schedule) => (
              <div
                key={schedule.day}
                className="p-4 border border-border rounded hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground">{schedule.day}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {schedule.morning}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {schedule.evening}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMaintenance.length > 0 ? (
            <div className="space-y-3">
              {upcomingMaintenance.map((maintenance, index) => (
                <div
                  key={index}
                  className="p-4 border border-destructive/30 bg-destructive/5 rounded"
                >
                  <div className="flex items-start gap-3">
                    <CalendarIcon size={20} className="text-destructive mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-foreground">{maintenance.date}</h3>
                        <span className="text-sm text-muted-foreground">{maintenance.time}</span>
                      </div>
                      <p className="text-sm text-foreground mb-1">{maintenance.area}</p>
                      <p className="text-sm text-muted-foreground mb-1">Reason: {maintenance.reason}</p>
                      <p className="text-sm text-destructive">Impact: {maintenance.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No upcoming maintenance scheduled</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Water supply timings may vary during peak summer months</p>
            <p>• Please store adequate water during supply hours</p>
            <p>• Report any supply issues immediately through the complaints section</p>
            <p>• Emergency contact: 1800-XXX-XXXX (24x7 helpline)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
