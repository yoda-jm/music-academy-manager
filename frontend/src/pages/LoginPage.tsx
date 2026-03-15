import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Music2, LogIn, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

type LoginErrorType = 'invalid_credentials' | 'service_unavailable';

const LOGIN_ERROR_MESSAGES: Record<LoginErrorType, string> = {
  invalid_credentials: 'Invalid email or password. Please try again.',
  service_unavailable: 'Unable to reach the server. Please try again in a moment.',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<LoginErrorType | null>(null);
  const { login } = useAuthStore();
  const toast = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.tokens, data.user);
      toast.success('Welcome back!', `Logged in as ${data.user.email}`);
      navigate(from, { replace: true });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setLoginError('invalid_credentials');
      } else {
        setLoginError('service_unavailable');
      }
    },
  });

  const onSubmit = (data: FormData) => {
    setLoginError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 shadow-lg shadow-primary-500/30 mb-4">
            <Music2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Music Academy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Sign in to your account
          </h2>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{LOGIN_ERROR_MESSAGES[loginError]}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              data-testid="email-input"
              {...register('email')}
              error={errors.email?.message}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                data-testid="password-input"
                {...register('password')}
                error={errors.password?.message}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loginMutation.isPending}
              leftIcon={<LogIn className="h-5 w-5" />}
              data-testid="login-submit"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Register
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} Music Academy Manager
        </p>
      </div>
    </div>
  );
}
