import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { queryClient } from './infrastructure/api/queryClient';

import App from './App';

import './index.css';

const enableMocking = async () => {
  const { worker } = await import('./infrastructure/mocks/browser');

  await worker.start({
    onUnhandledFrame: 'bypass',
  });
};

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});