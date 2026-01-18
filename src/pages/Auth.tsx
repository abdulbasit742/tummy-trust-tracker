import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { t, isUrdu } = useLanguage();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const authSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMinLength')),
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: t('auth.validationError'),
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t('auth.signInFailed'),
            description: error.message,
            variant: "destructive",
          });
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: t('auth.signUpFailed'),
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t('auth.accountCreated'),
            description: t('auth.completeProfile'),
          });
          navigate('/');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-4 py-8">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 gradient-calm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elevated">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            IBS Diet Companion
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('auth.email')}</label>
            <div className="relative">
              <Mail className={`absolute ${isUrdu ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`${isUrdu ? 'pr-12' : 'pl-12'} h-14 rounded-xl`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('auth.password')}</label>
            <div className="relative">
              <Lock className={`absolute ${isUrdu ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${isUrdu ? 'pr-12 pl-12' : 'pl-12 pr-12'} h-14 rounded-xl`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${isUrdu ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-base font-semibold rounded-xl gradient-calm text-primary-foreground border-0 shadow-soft"
          >
            {isLoading ? t('auth.pleaseWait') : isLogin ? t('auth.signIn') : t('auth.signUp')}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          {isLogin ? t('auth.dontHaveAccount') + ' ' : t('auth.alreadyHaveAccount') + ' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? t('auth.signUp') : t('auth.signIn')}
          </button>
        </p>

        {/* Disclaimer */}
        <div className="mt-8">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
