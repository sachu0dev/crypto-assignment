import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import Header from './components/Header';
import Footer from './components/Footer';
import DashboardPage from './components/DashboardPage';
import Loader from './components/Loader';
import ErrorFallback from './components/ErrorFallback';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-2 py-6">
          <React.Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="*" element={<ErrorFallback error={new Error('Page not found')} />} />
            </Routes>
          </React.Suspense>
        </main>
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
