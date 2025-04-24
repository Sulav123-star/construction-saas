'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

// Define a type for Supabase errors (based on @supabase/supabase-js)
interface SupabaseError {
  message: string;
  status?: number;
  code?: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: unknown) {
      // Type guard to check if error is a SupabaseError or standard Error
      const errorMessage = error instanceof Error || (error as SupabaseError).message
        ? (error as Error | SupabaseError).message
        : 'An unexpected error occurred';
      toast.error('Login failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleOAuthLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      // Type guard for error handling
      const errorMessage = error instanceof Error || (error as SupabaseError).message
        ? (error as Error | SupabaseError).message
        : 'An unexpected error occurred';
      toast.error('Google login failed: ' + errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Welcome Back</h1>
        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 border p-3 w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 border p-3 w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <button
            onClick={handleOAuthLogin}
            className="mt-4 w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v2.54h7.07c-.29 1.65-1.17 3.06-2.47 4.03v3.34h4.01c2.35-2.17 3.71-5.36 3.71-9.07 0-.55-.05-1.09-.14-1.62h-12.18z" fill="#4285F4"/>
              <path d="M12 21.5c3.24 0 5.96-1.08 7.95-2.91l-4.01-3.34c-1.09.73-2.47 1.16-3.94 1.16-3.03 0-5.60-2.05-6.52-4.81H1.39v3.03C3.36 19.36 7.44 21.5 12 21.5z" fill="#34A853"/>
              <path d="M5.48 12c0-.94.17-1.84.47-2.69V6.28H1.39C.51 7.94 0 9.91 0 12s.51 4.06 1.39 5.72l4.09-3.03c-.3-.85-.47-1.75-.47-2.69z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.36 2.04 14.64 1 12 1 7.44 1 3.36 3.14 1.39 6.28l4.09 3.03C6.4 7.43 8.97 5.38 12 5.38z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}