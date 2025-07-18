import React from 'react';

const Header: React.FC = () => (
  <header className="w-full border-b bg-background/80 backdrop-blur sticky top-0 z-30">
    <div className="container mx-auto flex items-center justify-between py-4 px-2">
      <h1 className="text-2xl font-bold tracking-tight">Crypto Tracker</h1>
      <nav>{/* Add navigation links here if needed */}</nav>
    </div>
  </header>
);

export default Header;
