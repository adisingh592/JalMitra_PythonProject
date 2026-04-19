import { Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  showUserMenu?: boolean;
  userType?: 'admin' | 'member';
}

export function Navbar({ showUserMenu = false, userType }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { logout, fullName, role } = useAuth();

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
            className="p-2 hover:bg-muted rounded transition-colors text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {showUserMenu && (
            <>
              <button className="p-2 hover:bg-muted rounded transition-colors text-foreground relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </button>

              <button className="p-2 hover:bg-muted rounded transition-colors text-foreground">
                <User size={20} />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-muted rounded transition-colors text-foreground"
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
