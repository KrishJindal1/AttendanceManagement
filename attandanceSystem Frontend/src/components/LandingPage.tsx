import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, FileSpreadsheet, LineChart, Users, Download } from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="nav-brand">
          <GraduationCap size={32} className="nav-logo" />
          <span>AttendanceSystem</span>
        </div>
        <div className="nav-actions">
          <button className="nav-login-btn" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </nav>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              The modern way to track <span className="text-highlight">classroom attendance</span>.
            </h1>
            <p className="hero-subtitle">
              Say goodbye to manual roll calls and messy spreadsheets. Upload your data, get instant analytics, and manage student records in one secure platform.
            </p>
            <div className="hero-buttons">
              <button className="hero-cta" onClick={() => navigate('/login')}>
                Get Started <ArrowRight size={20} />
              </button>
            </div>
          </div>
          <div className="hero-visual">
             <div className="abstract-card">
               <LineChart size={80} color="#4f46e5" strokeWidth={1.5} />
               <div className="abstract-stats">
                 <div className="stat-line"></div>
                 <div className="stat-line short"></div>
               </div>
             </div>
          </div>
        </section>

        <section className="features-section">
          <h2 className="section-title">Everything you need to manage attendance</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper"><FileSpreadsheet size={24} /></div>
              <h3>1-Click Excel Upload</h3>
              <p>Just drop your daily attendance sheets. The system automatically processes and maps records to the right students.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper"><LineChart size={24} /></div>
              <h3>Instant Analytics</h3>
              <p>Identify attendance trends and view automated calculation of present days, absent days, and overall percentages.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper"><Users size={24} /></div>
              <h3>Student Portals</h3>
              <p>Give students access to their own dashboards to track their progress and stay accountable without asking the teacher.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper"><Download size={24} /></div>
              <h3>PDF & Excel Exports</h3>
              <p>Generate beautiful, classroom-wide PDF reports or export processed data to Excel with a single click.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} AttendanceSystem. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
