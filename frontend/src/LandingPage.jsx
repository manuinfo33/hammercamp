import React, { useState, useEffect } from 'react';
import api from './api';
import { Rocket, Shield, Zap, Terminal, Github, Cpu } from 'lucide-react';

const LandingPage = () => {
  const [message, setMessage] = useState('Connecting to backend...');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await api.get('hello/');
        setMessage(response.data.message);
        setStatus('connected');
      } catch (error) {
        setMessage('Backend not started yet. Run "python manage.py runserver" in backend folder.');
        setStatus('error');
      }
    };
    fetchGreeting();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-accent/10 blur-[150px] rounded-full" />
      </div>

      <main className="max-w-6xl w-full flex flex-col items-center text-center space-y-12 animate-fade-in">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-400 mb-4">
            <Terminal size={16} className="text-primary" />
            <span>Project Hammercamp Initialized</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight">
            HAMMER<span className="gradient-text">CAMP</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The next generation of high-performance web applications. 
            Built with Django, DRF, React, and Vite.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
          <FeatureCard 
            icon={<Cpu className="text-primary" />}
            title="Django Backend"
            description="Robust and scalable Python backend powered by Django Rest Framework."
          />
          <FeatureCard 
            icon={<Zap className="text-accent" />}
            title="Vite + React"
            description="Blazing fast frontend development experience with HMR and optimized builds."
          />
          <FeatureCard 
            icon={<Shield className="text-indigo-400" />}
            title="Ready to Scale"
            description="Clean architecture designed for future Dockerization and cloud deployment."
          />
        </div>

        <div className={`mt-12 p-6 glass-card w-full max-w-md transition-all duration-500 ${status === 'connected' ? 'border-green-500/30' : 'border-white/10'}`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">System Status</span>
          </div>
          <p className="text-lg font-medium">{message}</p>
        </div>

        <div className="flex gap-4 mt-8">
          <button className="flex items-center gap-2">
            <Rocket size={20} />
            Get Started
          </button>
          <button className="flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10 shadow-none">
            <Github size={20} />
            Documentation
          </button>
        </div>
      </main>

      <footer className="mt-24 text-slate-500 text-sm">
        © 2026 Hammercamp Project. All rights reserved.
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-white/20 transition-all group">
    <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors">
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
