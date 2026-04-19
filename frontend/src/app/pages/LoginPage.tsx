import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Shield } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Navbar } from '../components/Navbar';
import { apiUrl } from '../lib/api';

export function LoginPage() {
  const { role, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'member') {
      navigate('/member/dashboard', { replace: true });
    }
  }, [role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Hardcode the role check to only attempt login if a role is selected
      if (!selectedRole) {
        setError('Please select a role first');
        return;
      }

      const response = await axios.post(apiUrl('/api/login'), {
        username,
        password,
        role: selectedRole,
      });

      if (response.data && response.data.role) {
        if (response.data.role !== selectedRole) {
           setError('Invalid credentials for selected role');
           return;
        }

        login({
          role: response.data.role,
          userId: response.data.user_id,
          token: response.data.token,
          fullName: response.data.full_name,
        });
        if (response.data.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/member/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Invalid credentials');
      } else if (err.response) {
        setError(`Server Error: ${err.response.data?.detail || err.message}`);
      } else {
        setError(`Network Error: Make sure the backend server is running! (${err.message})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex items-center justify-center py-16 px-6">
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
              onClick={() => navigate('/register')}
            >
              Create account
            </button>
          </p>
          <h1 className="text-3xl text-center mb-8 text-foreground">Login to JalMitra</h1>

          {!selectedRole ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className="text-center py-12 transition-all"
                onClick={() => setSelectedRole('admin')}
              >
                <Shield size={64} className="mx-auto mb-4 text-primary" />
                <h2 className="mb-2">Admin Login</h2>
                <p className="text-sm text-muted-foreground">Access administrative dashboard</p>
              </Card>

              <Card
                className="text-center py-12 transition-all"
                onClick={() => setSelectedRole('member')}
              >
                <User size={64} className="mx-auto mb-4 text-secondary" />
                <h2 className="mb-2">Member Login</h2>
                <p className="text-sm text-muted-foreground">Access your water usage dashboard</p>
              </Card>
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <div className="text-center mb-6">
                {selectedRole === 'admin' ? (
                  <Shield size={48} className="mx-auto mb-2 text-primary" />
                ) : (
                  <User size={48} className="mx-auto mb-2 text-secondary" />
                )}
                <h2 className="mb-1">{selectedRole === 'admin' ? 'Admin' : 'Member'} Login</h2>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded mb-4">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block mb-2 text-foreground">
                    {selectedRole === 'admin' ? 'Username' : 'Mobile/Username'}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={selectedRole === 'admin' ? 'Enter username' : 'Enter mobile or username'}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedRole(null);
                      setError(null);
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
