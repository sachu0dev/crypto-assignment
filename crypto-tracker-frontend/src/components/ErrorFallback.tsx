import React from 'react';

interface ErrorFallbackProps {
  error: Error;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-32 text-destructive">
    <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
    <pre className="text-sm whitespace-pre-wrap text-center">{error.message}</pre>
  </div>
);

export default ErrorFallback;
