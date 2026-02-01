import "./i18n";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

// Handle unhandled promise rejections to prevent console errors
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  // Filter out browser extension errors
  const errorMessage = event.reason?.message || String(event.reason || '');
  const errorString = String(event.reason || '');
  const fullErrorString = JSON.stringify(event.reason || '');
  
  // Ignore browser extension connection errors (case-insensitive check)
  const shouldIgnore = 
    errorMessage.toLowerCase().includes('could not establish connection') || 
    errorMessage.toLowerCase().includes('receiving end does not exist') ||
    errorMessage.toLowerCase().includes('extension context invalidated') ||
    errorMessage.toLowerCase().includes('message channel closed') ||
    errorMessage.toLowerCase().includes('asynchronous response') ||
    errorString.toLowerCase().includes('could not establish connection') ||
    errorString.toLowerCase().includes('receiving end does not exist') ||
    errorString.toLowerCase().includes('extension context invalidated') ||
    errorString.toLowerCase().includes('message channel closed') ||
    errorString.toLowerCase().includes('asynchronous response') ||
    fullErrorString.toLowerCase().includes('could not establish connection') ||
    fullErrorString.toLowerCase().includes('receiving end does not exist') ||
    fullErrorString.toLowerCase().includes('extension context invalidated') ||
    fullErrorString.toLowerCase().includes('message channel closed') ||
    fullErrorString.toLowerCase().includes('asynchronous response');
  
  if (shouldIgnore) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
  
  // Log other errors for debugging
  console.error('Unhandled promise rejection:', event.reason);
};

// Use capture phase and register early so we run before other listeners
window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });

// Handle general errors
const handleError = (event: ErrorEvent) => {
  const errorMessage = event.message || String(event.error || '');
  const errorString = String(event.error || '');
  const fullErrorString = JSON.stringify(event.error || '');
  
  // Ignore browser extension errors (case-insensitive check)
  const shouldIgnore = 
    errorMessage.toLowerCase().includes('could not establish connection') || 
    errorMessage.toLowerCase().includes('receiving end does not exist') ||
    errorMessage.toLowerCase().includes('extension context invalidated') ||
    errorMessage.toLowerCase().includes('message channel closed') ||
    errorMessage.toLowerCase().includes('asynchronous response') ||
    errorString.toLowerCase().includes('could not establish connection') ||
    errorString.toLowerCase().includes('receiving end does not exist') ||
    errorString.toLowerCase().includes('extension context invalidated') ||
    errorString.toLowerCase().includes('message channel closed') ||
    errorString.toLowerCase().includes('asynchronous response') ||
    fullErrorString.toLowerCase().includes('could not establish connection') ||
    fullErrorString.toLowerCase().includes('receiving end does not exist') ||
    fullErrorString.toLowerCase().includes('extension context invalidated') ||
    fullErrorString.toLowerCase().includes('message channel closed') ||
    fullErrorString.toLowerCase().includes('asynchronous response');
  
  if (shouldIgnore) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
};

window.addEventListener('error', handleError, true);

// Also catch errors from console.error to filter them
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const errorString = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
  
  // Filter out browser extension errors from console
  if (errorString.toLowerCase().includes('could not establish connection') ||
      errorString.toLowerCase().includes('receiving end does not exist') ||
      errorString.toLowerCase().includes('extension context invalidated') ||
      errorString.toLowerCase().includes('message channel closed') ||
      errorString.toLowerCase().includes('asynchronous response')) {
    return; // Don't log browser extension errors
  }
  
  // Call original console.error for other errors
  originalConsoleError.apply(console, args);
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
