import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Shield } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Navbar } from '../components/Navbar';
import { apiUrl } from '../lib/api';

type Village = { id: number; name: string; location: string | null };

export function RegisterPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | null>(null);
  const [villages, setVillages] = useState<Village[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [villageId, setVillageId] = useState('');
  const [address, setAddress] = useState('');
  const [meterId, setMeterId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [connectionType, setConnectionType] = useState('');
  const [memberRemarks, setMemberRemarks] = useState('');

  useEffect(() => {
    if (role === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (role === 'member') navigate('/member/dashboard', { replace: true });
  }, [role, navigate]);

  useEffect(() => {
    if (selectedRole !== 'member') return;
    axios
      .get<Village[]>(apiUrl('/api/villages'))
      .then((res) => setVillages(res.data))
      .catch(() => setVillages([]));
  }, [selectedRole]);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setEmail('');
    setMobile('');
    setVillageId('');
    setAddress('');
    setMeterId('');
    setDesignation('');
    setDepartment('');
    setEmployeeId('');
    setOfficeAddress('');
    setAdminNotes('');
    setMemberEmail('');
    setAlternateMobile('');
    setConsumerNumber('');
    setConnectionType('');
    setMemberRemarks('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedRole) {
      setError('Select registration type first');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (selectedRole === 'admin') {
        await axios.post(apiUrl('/api/register/admin'), {
          username: username.trim(),
          password,
          full_name: fullName.trim(),
          email: email.trim() || null,
          mobile: mobile.trim() || null,
          designation: designation.trim() || null,
          department: department.trim() || null,
          employee_id: employeeId.trim() || null,
          office_address: officeAddress.trim() || null,
          notes: adminNotes.trim() || null,
        });
        setSuccess('Admin account created. You can sign in now.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        await axios.post(apiUrl('/api/register/member'), {
          username: username.trim(),
          password,
          full_name: fullName.trim(),
          mobile: mobile.trim(),
          email: memberEmail.trim() || null,
          alternate_mobile: alternateMobile.trim() || null,
          village_id: villageId ? parseInt(villageId, 10) : null,
          address: address.trim() || null,
          meter_id: meterId.trim() || null,
          consumer_number: consumerNumber.trim() || null,
          connection_type: connectionType || null,
          remarks: memberRemarks.trim() || null,
        });
        setSuccess('Member account created. You can sign in now.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg || '').filter(Boolean).join(' ') || 'Registration failed');
      } else {
        setError(typeof detail === 'string' ? detail : err.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-4xl">
          <p className="text-center text-sm text-muted-foreground mb-2">
            <button
              type="button"
              className="underline hover:text-foreground"
              onClick={() => navigate('/')}
            >
              ← Back to home
            </button>
            {' · '}
            <button
              type="button"
              className="underline hover:text-foreground"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </p>
          <h1 className="text-3xl text-center mb-8 text-foreground">Create JalMitra account</h1>

          {!selectedRole ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className="text-center py-12 transition-all"
                onClick={() => {
                  setSelectedRole('admin');
                  resetForm();
                }}
              >
                <Shield size={64} className="mx-auto mb-4 text-primary" />
                <h2 className="mb-2">Register as Admin</h2>
                <p className="text-sm text-muted-foreground">Operations & water management access</p>
              </Card>

              <Card
                className="text-center py-12 transition-all"
                onClick={() => {
                  setSelectedRole('member');
                  resetForm();
                }}
              >
                <User size={64} className="mx-auto mb-4 text-secondary" />
                <h2 className="mb-2">Register as Member</h2>
                <p className="text-sm text-muted-foreground">Household / consumer account</p>
              </Card>
            </div>
          ) : (
            <Card className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                {selectedRole === 'admin' ? (
                  <Shield size={48} className="mx-auto mb-2 text-primary" />
                ) : (
                  <User size={48} className="mx-auto mb-2 text-secondary" />
                )}
                <h2 className="mb-1">{selectedRole === 'admin' ? 'Admin' : 'Member'} registration</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 text-sm bg-secondary text-secondary-foreground rounded">
                    {success}
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-foreground">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-foreground">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoComplete="username"
                    required
                  />
                </div>

                {selectedRole === 'admin' && (
                  <>
                    <div>
                      <label className="block mb-2 text-foreground">Email (optional)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Mobile (optional)</label>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-foreground">Designation (optional)</label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. Junior Engineer"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-foreground">Department (optional)</label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. Water Works"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Employee ID (optional)</label>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Office address (optional)</label>
                      <input
                        type="text"
                        value={officeAddress}
                        onChange={(e) => setOfficeAddress(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Notes (optional)</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </>
                )}

                {selectedRole === 'member' && (
                  <>
                    <div>
                      <label className="block mb-2 text-foreground">Mobile</label>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Email (optional)</label>
                      <input
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Alternate mobile (optional)</label>
                      <input
                        type="text"
                        value={alternateMobile}
                        onChange={(e) => setAlternateMobile(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Village (optional)</label>
                      <select
                        value={villageId}
                        onChange={(e) => setVillageId(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">— Select —</option>
                        {villages.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                            {v.location ? ` (${v.location})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Address (optional)</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Meter ID (optional)</label>
                      <input
                        type="text"
                        value={meterId}
                        onChange={(e) => setMeterId(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Consumer / account number (optional)</label>
                      <input
                        type="text"
                        value={consumerNumber}
                        onChange={(e) => setConsumerNumber(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Connection type (optional)</label>
                      <select
                        value={connectionType}
                        onChange={(e) => setConnectionType(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">— Select —</option>
                        <option value="domestic">Domestic</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-foreground">Remarks (optional)</label>
                      <textarea
                        value={memberRemarks}
                        onChange={(e) => setMemberRemarks(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block mb-2 text-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-foreground">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Creating account…' : 'Register'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedRole(null);
                      resetForm();
                    }}
                  >
                    Back
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
