import { useNavigate } from 'react-router';
import { Droplets, BarChart3, Bell, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Navbar } from '../components/Navbar';

export function LandingPage() {
  const navigate = useNavigate();
  const logoUrl = '/jalmitra-logo.jpg';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt="JalMitra logo"
              className="w-8 h-8 rounded object-cover bg-primary-foreground"
            />
            <span>JalMitra</span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#home" className="hover:underline">Home</a>
            <a href="#features" className="hover:underline">Features</a>
            <a href="#how-it-works" className="hover:underline">How It Works</a>
            <a href="#contact" className="hover:underline">Contact</a>
            <Button variant="outline" className="bg-primary-foreground text-primary hover:bg-opacity-90 border-primary-foreground" onClick={() => navigate('/register')}>
              Register
            </Button>
            <Button variant="outline" className="bg-primary-foreground text-primary hover:bg-opacity-90 border-primary-foreground" onClick={() => navigate('/login')}>
              Admin Login
            </Button>
            <Button variant="outline" className="bg-primary-foreground text-primary hover:bg-opacity-90 border-primary-foreground" onClick={() => navigate('/login')}>
              Member Login
            </Button>
          </nav>
        </div>
      </header>

      <section id="home" className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl mb-4 text-foreground">Smart Water Management for Rural India</h1>
              <p className="text-xl text-muted-foreground mb-8">
                A simple and efficient system for monitoring water supply and detecting leakages
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={() => navigate('/register')}>Get Started</Button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-2 shadow-xl overflow-hidden">
              <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
                <img 
                  src="/hero-image.png" 
                  alt="Smart Water Management System Illustration" 
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl text-center mb-12 text-foreground">Current Problems</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-3 text-destructive" size={40} />
                <h3 className="mb-2">No Monitoring</h3>
                <p className="text-sm text-muted-foreground">Lack of real-time water supply tracking</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <Droplets className="mx-auto mb-3 text-destructive" size={40} />
                <h3 className="mb-2">Leakage Issues</h3>
                <p className="text-sm text-muted-foreground">Undetected water wastage</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <FileText className="mx-auto mb-3 text-destructive" size={40} />
                <h3 className="mb-2">Manual Records</h3>
                <p className="text-sm text-muted-foreground">Time-consuming paper-based tracking</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-3 text-destructive" size={40} />
                <h3 className="mb-2">Delayed Maintenance</h3>
                <p className="text-sm text-muted-foreground">Slow response to issues</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl text-center mb-6 text-foreground">JalMitra Solution</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            JalMitra provides a comprehensive digital solution for rural water management, making it easy to track, analyze, and optimize water distribution.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <CheckCircle className="mx-auto mb-3 text-secondary" size={48} />
              <h3 className="mb-2">Real-time Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor water supply and consumption instantly</p>
            </div>
            <div className="text-center">
              <Bell className="mx-auto mb-3 text-secondary" size={48} />
              <h3 className="mb-2">Smart Alerts</h3>
              <p className="text-sm text-muted-foreground">Automated notifications for leakages and issues</p>
            </div>
            <div className="text-center">
              <BarChart3 className="mx-auto mb-3 text-secondary" size={48} />
              <h3 className="mb-2">Data-based Decisions</h3>
              <p className="text-sm text-muted-foreground">Analytics and insights for better planning</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl text-center mb-12 text-foreground">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <BarChart3 className="mb-3 text-primary" size={32} />
              <h3 className="mb-2">Dashboard Monitoring</h3>
              <p className="text-sm text-muted-foreground">Comprehensive overview of water supply system</p>
            </Card>
            <Card>
              <Droplets className="mb-3 text-primary" size={32} />
              <h3 className="mb-2">Leakage Detection</h3>
              <p className="text-sm text-muted-foreground">Identify and track water loss areas</p>
            </Card>
            <Card>
              <FileText className="mb-3 text-primary" size={32} />
              <h3 className="mb-2">Billing System</h3>
              <p className="text-sm text-muted-foreground">Automated billing based on consumption</p>
            </Card>
            <Card>
              <AlertTriangle className="mb-3 text-primary" size={32} />
              <h3 className="mb-2">Maintenance</h3>
              <p className="text-sm text-muted-foreground">Track and manage maintenance requests</p>
            </Card>
            <Card>
              <Bell className="mb-3 text-primary" size={32} />
              <h3 className="mb-2">Alerts</h3>
              <p className="text-sm text-muted-foreground">Real-time notifications for critical events</p>
            </Card>
            <Card>
              <BarChart3 className="mb-3 text-primary" size={32} />
              <h3 className="mb-2">Reports</h3>
              <p className="text-sm text-muted-foreground">Detailed analytics and performance reports</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl text-center mb-12 text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                1
              </div>
              <h3 className="mb-2">Enter Data</h3>
              <p className="text-sm text-muted-foreground">Input water supply and consumption information</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                2
              </div>
              <h3 className="mb-2">Analyze</h3>
              <p className="text-sm text-muted-foreground">System processes and analyzes the data</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                3
              </div>
              <h3 className="mb-2">Detect Issues</h3>
              <p className="text-sm text-muted-foreground">Identify leakages and anomalies automatically</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                4
              </div>
              <h3 className="mb-2">Generate Alerts</h3>
              <p className="text-sm text-muted-foreground">Send notifications to relevant stakeholders</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl text-center mb-12 text-foreground">Benefits</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <h3 className="mb-2 text-secondary">Reduce Wastage</h3>
              <p className="text-sm text-muted-foreground">Minimize water loss through early detection</p>
            </Card>
            <Card>
              <h3 className="mb-2 text-secondary">Improve Efficiency</h3>
              <p className="text-sm text-muted-foreground">Optimize water distribution and usage</p>
            </Card>
            <Card>
              <h3 className="mb-2 text-secondary">Easy to Use</h3>
              <p className="text-sm text-muted-foreground">Simple interface designed for rural areas</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl text-center mb-8 text-foreground">Notice Board</h2>
          <Card className="max-w-3xl mx-auto">
            <h3 className="mb-4 text-primary">Government Notices</h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm mb-1">Water supply maintenance on 15th April 2026</p>
                <p className="text-xs text-muted-foreground">Supply will be affected from 9 AM to 2 PM</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm mb-1">New billing cycle starts from 1st May 2026</p>
                <p className="text-xs text-muted-foreground">Please clear pending dues before end of month</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm mb-1">Water conservation awareness program on 22nd April 2026</p>
                <p className="text-xs text-muted-foreground">All members are encouraged to participate</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer id="contact" className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>© 2026 JalMitra – Water Management System. All rights reserved.</p>
          <p className="text-sm mt-2 opacity-90">Government of India Initiative</p>
        </div>
      </footer>
    </div>
  );
}
