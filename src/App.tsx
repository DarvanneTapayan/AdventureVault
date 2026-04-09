/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { Toaster } from './components/ui/sonner';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Gallery } from './components/Gallery';
import { Timeline } from './components/Timeline';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { AdventureDetail } from './components/AdventureDetail';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'timeline' | 'dashboard' | 'profile' | 'adventure'>('home');
  const [selectedAdventureId, setSelectedAdventureId] = useState<string | null>(null);

  const navigateTo = (view: 'home' | 'timeline' | 'dashboard' | 'profile' | 'adventure', id?: string) => {
    setCurrentView(view);
    if (id) setSelectedAdventureId(id);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-zinc-100 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-950">
      <Navbar currentView={currentView} navigateTo={navigateTo} />
      
      <main className="pt-20 pb-12">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Hero onExplore={() => navigateTo('timeline')} />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <h2 className="text-2xl font-light tracking-tight mb-8">Recent Adventures</h2>
                <Gallery onSelect={(id) => navigateTo('adventure', id)} />
              </div>
            </motion.div>
          )}

          {currentView === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <Timeline onSelect={(id) => navigateTo('adventure', id)} />
            </motion.div>
          )}

          {currentView === 'dashboard' && user && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <Dashboard onSelect={(id) => navigateTo('adventure', id)} />
            </motion.div>
          )}

          {currentView === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <Profile onSelect={(id) => navigateTo('adventure', id)} />
            </motion.div>
          )}

          {currentView === 'adventure' && selectedAdventureId && (
            <motion.div
              key="adventure"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <AdventureDetail 
                id={selectedAdventureId} 
                onBack={() => navigateTo('home')} 
                onNavigateToProfile={() => navigateTo('profile')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}

