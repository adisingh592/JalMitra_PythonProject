import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';

type TariffRule = {
  max_usage: string;
  rate_per_liter: string;
};

type TariffResponse = {
  rules: Array<{
    max_usage: number;
    rate_per_liter: number;
  }>;
};

export function AdminSettings() {
  const { token } = useAuth();
  const [rules, setRules] = useState<TariffRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRules = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<TariffResponse>(apiUrl('/api/admin/settings/billing-tariff'), {
        headers: { Authorization: token },
      });
      setRules(
        res.data.rules.map((rule) => ({
          max_usage: String(rule.max_usage),
          rate_per_liter: String(rule.rate_per_liter),
        })),
      );
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detail === 'string' ? detail : 'Could not load tariff settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, [token]);

  const updateRule = (index: number, field: keyof TariffRule, value: string) => {
    setRules((current) =>
      current.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, [field]: value } : rule)),
    );
  };

  const addRule = () => {
    setRules((current) => [...current, { max_usage: '', rate_per_liter: '' }]);
  };

  const removeRule = (index: number) => {
    setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index));
  };

  const saveRules = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = rules.map((rule) => ({
        max_usage: parseInt(rule.max_usage, 10),
        rate_per_liter: parseInt(rule.rate_per_liter, 10),
      }));
      if (payload.some((rule) => Number.isNaN(rule.max_usage) || Number.isNaN(rule.rate_per_liter))) {
        setError('Every tariff row needs valid numbers.');
        return;
      }

      const res = await axios.put<TariffResponse>(
        apiUrl('/api/admin/settings/billing-tariff'),
        { rules: payload },
        { headers: { Authorization: token } },
      );
      setRules(
        res.data.rules.map((rule) => ({
          max_usage: String(rule.max_usage),
          rate_per_liter: String(rule.rate_per_liter),
        })),
      );
      setSuccess('Tariff settings saved.');
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detail === 'string' ? detail : 'Could not save tariff settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the automatic tariff slabs used when admin generates bills from water usage.
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

      <Card>
        <CardHeader>
          <CardTitle>Tariff Slabs</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveRules} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Each row means: usage up to <strong>max liters</strong> uses the given <strong>rate per liter</strong>.
              Keep the rows in ascending order.
            </div>

            {loading ? (
              <div className="py-6 text-sm text-muted-foreground">Loading tariff settings...</div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <div key={`${index}-${rule.max_usage}-${rule.rate_per_liter}`} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <Label htmlFor={`max_usage_${index}`}>Max Usage (Liters)</Label>
                      <Input
                        id={`max_usage_${index}`}
                        type="number"
                        min="0"
                        value={rule.max_usage}
                        onChange={(event) => updateRule(index, 'max_usage', event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`rate_${index}`}>Rate Per Liter</Label>
                      <Input
                        id={`rate_${index}`}
                        type="number"
                        min="0"
                        value={rule.rate_per_liter}
                        onChange={(event) => updateRule(index, 'rate_per_liter', event.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="outline" onClick={() => removeRule(index)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={addRule}>
                <Plus className="mr-2 h-4 w-4" />
                Add Slab
              </Button>
              <Button type="submit" disabled={saving || loading}>
                {saving ? 'Saving...' : 'Save Tariff Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
