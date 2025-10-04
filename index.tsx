
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { SubscriptionProvider } from './auth/SubscriptionContext';
import { LandingPage } from './components/LandingPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!clerkPublishableKey) {
  // Fail fast to make it obvious the key is missing in local dev
  // Add VITE_CLERK_PUBLISHABLE_KEY to .env.local
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <SubscriptionProvider>
        <div className="absolute top-4 right-4 z-50">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-white/90 hover:bg-white text-gray-900 font-medium py-2 px-4 rounded-lg shadow-lg transition-all duration-200">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
        <SignedIn>
          <App />
        </SignedIn>
        <SignedOut>
          <LandingPage />
        </SignedOut>
      </SubscriptionProvider>
    </ClerkProvider>
  </React.StrictMode>
);
