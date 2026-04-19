import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { AdminClock } from '../../components/AdminClock';
import { apiUrl } from '../../lib/api';

type City = {
  id: number;
  name: string;
  district: string | null;
  state: string | null;
};

type EntryMeta = {
  server_now_iso: string;
  recording_date_iso: string;
  recording_label: string;
};

type WaterEntry = {
  id: number;
  city_id: number;
  city_name: string | null;
  entry_date: string;
  water_supplied_liters: number;
  water_consumed_liters: number;
  pump_status: string;
  leakage_liters: number | null;
  notes: string | null;
};

type FormState = {
  cityId: string;
  supplied: string;
  consumed: string;
  pumpStatus: string;
  leakageOverride: string;
  notes: string;
};

const emptyForm: FormState = {
  cityId: '',
  supplied: '',
  consumed: '',
  pumpStatus: 'active',
  leakageOverride: '',
  notes: '',
};

export function AdminDataEntry() {
  const [cities, setCities] = useState<City[]>([]);
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [meta, setMeta] = useState<EntryMeta | null>(null);
  const [newCityName, setNewCityName] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newState, setNewState] = useState('');
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [lastAction, setLastAction] = useState<'created' | 'updated'>('created');
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setEditingEntryId(null);
  }, []);

  const load = useCallback(async () => {
    try {
      const [, cRes, mRes] = await Promise.all([
        submitted ? Promise.resolve(null) : Promise.resolve(null),
        axios.get<City[]>(apiUrl('/api/cities')),
        axios.get<EntryMeta>(apiUrl('/api/water/entry-meta')),
      ]);
      setCities(cRes.data);
      setMeta(mRes.data);

      const eRes = await axios.get<WaterEntry[]>(apiUrl(`/api/water/entries?date_from=${mRes.data.recording_date_iso}&date_to=${mRes.data.recording_date_iso}`));
      setEntries(eRes.data);
    } catch {
      setError('Could not load cities or server time. Is the API running?');
    }
  }, [submitted]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectEntry = (entry: WaterEntry) => {
    setEditingEntryId(entry.id);
    setFormData({
      cityId: String(entry.city_id),
      supplied: String(entry.water_supplied_liters),
      consumed: String(entry.water_consumed_liters),
      pumpStatus: entry.pump_status,
      leakageOverride: entry.leakage_liters === null ? '' : String(entry.leakage_liters),
      notes: entry.notes ?? '',
    });
    setSubmitted(false);
    setError(null);
  };

  const addCity = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!newCityName.trim()) return;
    try {
      await axios.post(apiUrl('/api/cities'), {
        name: newCityName.trim(),
        district: newDistrict.trim() || null,
        state: newState.trim() || null,
      });
      setNewCityName('');
      setNewDistrict('');
      setNewState('');
      await load();
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detail === 'string' ? detail : 'Could not add city');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supplied = parseInt(formData.supplied, 10);
      const consumed = parseInt(formData.consumed, 10);
      const cityId = parseInt(formData.cityId, 10);

      if (Number.isNaN(cityId)) {
        setError('Select a city first');
        return;
      }
      if (Number.isNaN(supplied) || Number.isNaN(consumed)) {
        setError('Enter valid numbers for liters');
        return;
      }

      const leakage = formData.leakageOverride.trim() ? parseInt(formData.leakageOverride, 10) : null;
      const res = await axios.post<{ action: 'created' | 'updated' }>(apiUrl('/api/water/entries'), {
        city_id: cityId,
        water_supplied_liters: supplied,
        water_consumed_liters: consumed,
        pump_status: formData.pumpStatus,
        leakage_liters: leakage !== null && !Number.isNaN(leakage) ? leakage : null,
        notes: formData.notes.trim() || null,
      });

      setLastAction(res.data.action);
      setSubmitted(true);
      resetForm();
      await load();
      setTimeout(() => setSubmitted(false), 3500);
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detail === 'string' ? detail : 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  const resetAllWaterData = async () => {
    if (!window.confirm('Delete ALL water daily entries? Dashboards will show zero until new data is entered. Cities stay.')) {
      return;
    }
    setError(null);
    try {
      await axios.post(apiUrl('/api/water/reset'), { confirm: true });
      resetForm();
      await load();
      alert('Water data cleared. Counting from now.');
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detail === 'string' ? detail : 'Reset failed');
    }
  };

  const selectedCityHasEntry =
    formData.cityId !== '' &&
    entries.some((entry) => String(entry.city_id) === formData.cityId && entry.id !== editingEntryId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl text-foreground">Data Entry</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Figures you submit are stored for the <strong>previous calendar day</strong> (IST). If a city already has an
            entry for that date, submitting again will now <strong>update the existing record</strong> so the dashboard,
            leakage report, and related analytics stay in sync.
          </p>
        </div>
        <AdminClock />
      </div>

      {meta && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <strong>Recording date:</strong> {meta.recording_date_iso}{' '}
          <span className="text-muted-foreground">- {meta.recording_label}</span>
        </div>
      )}

      <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add city / area</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addCity} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-foreground">City name</label>
                <input
                  value={newCityName}
                  onChange={(event) => setNewCityName(event.target.value)}
                  className="w-full rounded border border-border bg-input-background px-3 py-2 text-foreground"
                  placeholder="e.g. Gorakhpur North"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">District (optional)</label>
                  <input
                    value={newDistrict}
                    onChange={(event) => setNewDistrict(event.target.value)}
                    className="w-full rounded border border-border bg-input-background px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">State (optional)</label>
                  <input
                    value={newState}
                    onChange={(event) => setNewState(event.target.value)}
                    className="w-full rounded border border-border bg-input-background px-3 py-2 text-foreground"
                  />
                </div>
              </div>
              <Button type="submit">Add city</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reset water statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Clears all rows in <code className="text-xs">water_daily_entries</code>. Use this only when you want to
              start the dashboard and leakage analytics from zero.
            </p>
            <Button type="button" variant="outline" className="gap-2 text-destructive" onClick={resetAllWaterData}>
              <Trash2 size={16} />
              Clear all water entries
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{editingEntryId ? 'Edit Water Supply Data' : 'Enter Water Supply Data'}</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="py-8 text-center">
                  <CheckCircle size={64} className="mx-auto mb-4 text-secondary" />
                  <h3 className="mb-2 text-foreground">
                    Data {lastAction === 'updated' ? 'updated' : 'saved'} for {meta?.recording_date_iso ?? 'yesterday'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Stored in MySQL table `water_daily_entries`.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-2 rounded bg-destructive p-3 text-sm text-destructive-foreground">
                      <AlertCircle className="mt-0.5 shrink-0" size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-foreground">City</label>
                    <select
                      value={formData.cityId}
                      onChange={(event) => setFormData({ ...formData, cityId: event.target.value })}
                      className="w-full rounded border border-border bg-input-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">Select city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                          {city.district ? ` - ${city.district}` : ''}
                        </option>
                      ))}
                    </select>
                    {cities.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Add a city above first.</p>}
                    {selectedCityHasEntry && (
                      <p className="mt-1 text-xs text-amber-600">
                        This city already has a saved entry for the recording date. Submitting will update it.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-foreground">Water Supplied (Liters)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.supplied}
                      onChange={(event) => setFormData({ ...formData, supplied: event.target.value })}
                      className="w-full rounded border border-border bg-input-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-foreground">Water Consumed (Liters)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.consumed}
                      onChange={(event) => setFormData({ ...formData, consumed: event.target.value })}
                      className="w-full rounded border border-border bg-input-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-foreground">Leakage (Liters) - optional</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.leakageOverride}
                      onChange={(event) => setFormData({ ...formData, leakageOverride: event.target.value })}
                      className="w-full rounded border border-border bg-input-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Leave empty to use supplied - consumed"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-foreground">Pump Status</label>
                    <div className="flex flex-wrap gap-4">
                      {(['active', 'inactive', 'maintenance'] as const).map((status) => (
                        <label key={status} className="flex items-center gap-2 capitalize text-foreground">
                          <input
                            type="radio"
                            value={status}
                            checked={formData.pumpStatus === status}
                            onChange={(event) => setFormData({ ...formData, pumpStatus: event.target.value })}
                            className="accent-primary"
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-foreground">Notes (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                      rows={2}
                      className="w-full rounded border border-border bg-input-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={loading || cities.length === 0}>
                      {loading ? 'Saving...' : editingEntryId || selectedCityHasEntry ? 'Update Data' : 'Submit Data'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Clear
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Saved Entries for {meta?.recording_date_iso ?? 'recording date'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-foreground">{entry.city_name || `City #${entry.city_id}`}</div>
                    <div className="text-muted-foreground">Supplied: {entry.water_supplied_liters.toLocaleString()} L</div>
                    <div className="text-muted-foreground">Consumed: {entry.water_consumed_liters.toLocaleString()} L</div>
                    <div className="text-muted-foreground">Leakage: {(entry.leakage_liters ?? 0).toLocaleString()} L</div>
                    <div className="text-muted-foreground">Pump: {entry.pump_status}</div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => selectEntry(entry)}>
                    <Pencil size={14} className="mr-1" />
                    Edit
                  </Button>
                </div>
                {entry.notes && <p className="mt-2 text-xs text-muted-foreground">{entry.notes}</p>}
              </div>
            ))}
            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No entries saved yet for this recording date. Submit one and it will appear here for quick editing.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
