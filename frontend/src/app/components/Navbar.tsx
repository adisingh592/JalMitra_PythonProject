import { useEffect, useState } from 'react';
import axios from 'axios';
import { Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';

interface NavbarProps {
  showUserMenu?: boolean;
  userType?: 'admin' | 'member';
}

export function Navbar({ showUserMenu = false, userType }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { logout, fullName, role, token } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!showUserMenu || !token) {
      setNotificationCount(0);
      return;
    }

    const targetRole = userType || role;
    let cancelled = false;

    (async () => {
      try {
        if (targetRole === 'admin') {
          const res = await axios.get(apiUrl('/api/admin/complaints'), {
            headers: { Authorization: token },
          });
          const openCount = (res.data as Array<{ status?: string }>).filter(
            (item) => item.status !== 'resolved'
          ).length;
          if (!cancelled) setNotificationCount(openCount);
        } else {
          const res = await axios.get(apiUrl('/api/member/notifications'), {
            headers: { Authorization: token },
          });
          const unread = (res.data as Array<{ read?: boolean }>).filter((item) => !item.read).length;
          if (!cancelled) setNotificationCount(unread);
        }
      } catch {
        if (!cancelled) setNotificationCount(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showUserMenu, token, userType, role]);

  const handleOpenNotifications = () => {
    const targetRole = userType || role;
    if (targetRole === 'admin') navigate('/admin/alerts');
    else navigate('/member/notifications');
  };

  const handleOpenProfile = () => {
    const targetRole = userType || role;
    if (targetRole === 'admin') navigate('/admin/profile');
    else navigate('/member/profile');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-card border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground">
            JM
          </div>
          <span className="text-foreground">JalMitra – Water Management System</span>
          {showUserMenu && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {fullName || (userType === 'admin' ? 'Admin' : 'Member')}
              {role ? ` · ${role === 'admin' ? 'Admin portal' : 'Member portal'}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-muted rounded transition-all duration-200 hover:scale-110 text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {showUserMenu && (
            <>
              <button
                onClick={handleOpenNotifications}
                className="p-2 hover:bg-muted rounded transition-all duration-200 hover:scale-110 text-foreground relative"
                aria-label="Open notifications"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-4 text-center">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenProfile}
                className="p-2 hover:bg-muted rounded transition-all duration-200 hover:scale-110 text-foreground"
                aria-label="Open profile"
              >
                <User size={20} />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-muted rounded transition-all duration-200 hover:scale-110 text-foreground"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
