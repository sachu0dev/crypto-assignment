import React from 'react';

const Footer: React.FC = () => (
  <footer className="w-full border-t bg-background/80 py-4 text-center text-sm text-muted-foreground mt-auto">
    <div className="container mx-auto">
      &copy; {new Date().getFullYear()} Crypto Tracker. Built with ShadCN UI, React, and TypeScript.
    </div>
  </footer>
);

export default Footer;
