'use client';

import { useState, useEffect } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

interface ClientGoogleLoginProps {
  onSuccess: (response: CredentialResponse) => void;
  onError?: () => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width?: string;
}

/**
 * Wrapper that only renders GoogleLogin after client-side mount,
 * preventing Next.js prerender/SSR crashes.
 */
export default function ClientGoogleLogin({ onSuccess, onError, text = 'signin_with', width = '350' }: ClientGoogleLoginProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={onError}
      theme="outline"
      size="large"
      text={text}
      shape="rectangular"
      width={width}
    />
  );
}
