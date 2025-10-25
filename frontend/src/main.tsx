// frontend/src/main.tsx
import ErrorBoundary from './components/common/ErrorBoundary';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);