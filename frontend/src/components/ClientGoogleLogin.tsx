'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader } from 'lucide-react';

interface ClientGoogleLoginProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  text?: string;
}

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/**
 * A custom-styled Google Sign-In button that always renders.
 * Uses @react-oauth/google hook when GoogleOAuthProvider is available,
 * otherwise falls back to a simple styled button with a helpful message.
 */
function GoogleButtonWithProvider({ onSuccess, onError, text = 'Sign in with Google' }: ClientGoogleLoginProps) {
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      // For auth-code flow we'd need backend exchange; use implicit instead
      console.log('Google auth code:', codeResponse);
    },
    onError: () => {
      setLoading(false);
      onError?.();
    },
  });

  // Use implicit flow instead for direct credential
  const googleLoginImplicit = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(false);
      // tokenResponse has access_token, we pass it to parent
      onSuccess(tokenResponse.access_token);
    },
    onError: () => {
      setLoading(false);
      onError?.();
    },
  });

  const handleClick = () => {
    setLoading(true);
    googleLoginImplicit();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700
                 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]
                 transition-all shadow-sm
                 disabled:opacity-60 disabled:cursor-not-allowed
                 flex items-center justify-center gap-3"
    >
      {loading ? <Loader size={18} className="animate-spin" /> : <GoogleIcon />}
      {text}
    </button>
  );
}

function GoogleButtonFallback({ text = 'Sign in with Google' }: { text?: string }) {
  return (
    <button
      type="button"
      onClick={() => alert('Google Login is not configured yet. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.')}
      className="w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700
                 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]
                 transition-all shadow-sm
                 flex items-center justify-center gap-3"
    >
      <GoogleIcon />
      {text}
    </button>
  );
}

export default function ClientGoogleLogin({ onSuccess, onError, text = 'Sign in with Google' }: ClientGoogleLoginProps) {
  const [mounted, setMounted] = useState(false);
  const hasGoogleId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Server-side / pre-render: return a static placeholder
    return (
      <div className="w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700
                      flex items-center justify-center gap-3 opacity-60">
        <GoogleIcon />
        {text}
      </div>
    );
  }

  if (hasGoogleId) {
    return <GoogleButtonWithProvider onSuccess={onSuccess} onError={onError} text={text} />;
  }

  return <GoogleButtonFallback text={text} />;
}
