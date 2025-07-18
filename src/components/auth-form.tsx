
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, KeyRound, Loader2, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


function EmailPasswordAuth() {
  const router = useRouter();
  const [view, setView] = React.useState<'login' | 'signup' | 'forgot-password'>('login');
  const [isLoading, setIsLoading] = React.useState(false);
  const [emailForReset, setEmailForReset] = React.useState('');
  const { toast } = useToast();

  const handleEmailPasswordSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const target = event.target as typeof event.target & {
      email: { value: string };
      password: { value: string };
    };
    const email = target.email.value;
    const password = target.password.value;

    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Login successful!" });
        router.push("/dashboard");
      } else { // signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.email?.split('@')[0] || 'New User', // default name
        });
        toast({ title: "Sign up successful!" });
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailForReset);
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${emailForReset}, a password reset link has been sent.`,
      });
      setView('login');
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => setView(view === 'login' ? 'signup' : 'login');

  if (view === 'forgot-password') {
    return (
       <form onSubmit={handlePasswordResetSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  name="reset-email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  required
                  className="pl-10"
                  value={emailForReset}
                  onChange={(e) => setEmailForReset(e.target.value)}
                />
              </div>
            </div>
            <Button disabled={isLoading} className="mt-2">
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Reset Link
            </Button>
            <Button variant="link" size="sm" onClick={() => setView('login')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Button>
          </div>
       </form>
    )
  }

  return (
     <form onSubmit={handleEmailPasswordSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
               {view === 'login' && (
                  <button
                    type="button"
                    onClick={() => setView('forgot-password')}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
            </div>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input id="password" name="password" type="password" required className="pl-10"/>
            </div>
          </div>
          <Button disabled={isLoading} className="mt-2">
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {view === 'login' ? "Login" : "Sign Up"}
          </Button>
           <p className="px-8 text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={toggleView}
              className="underline underline-offset-4 hover:text-primary"
            >
              {view === 'login'
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"}
            </button>
          </p>
        </div>
      </form>
  )
}


function PhoneAuth() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [confirmationResult, setConfirmationResult] = React.useState<any>(null);
  const recaptchaButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && recaptchaButtonRef.current) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaButtonRef.current, {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  }, []);

  const handlePhoneSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setStep("otp");
      toast({ title: "OTP Sent!", description: `An OTP has been sent to ${phoneNumber}` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const target = event.target as typeof event.target & { otp: { value: string } };
    const otp = target.otp.value;
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;
      // Check if user is new
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        phone: user.phoneNumber,
        name: `User ${user.uid.substring(0, 5)}`,
      }, { merge: true });
      
      toast({ title: "Login Successful!" });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground text-center">
                Enter your phone number to login or create an account
              </p>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  required
                  className="pl-10"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
            <Button ref={recaptchaButtonRef} disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send OTP
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground text-center">
              We've sent a One-Time Password to your phone
            </p>
            <div className="grid gap-2">
              <Label htmlFor="otp">One-Time Password</Label>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="otp" name="otp" type="text" required placeholder="_ _ _ _ _ _" className="pl-10 tracking-[0.5em] text-center"/>
              </div>
            </div>
            <Button disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify & Login
            </Button>
          </div>
        </form>
      )}
    </>
  );
}


export function AuthForm() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-semibold font-headline tracking-tight">
          Welcome to BloodLink
        </h1>
      </div>
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>
        <TabsContent value="email" className="mt-6">
           <EmailPasswordAuth />
        </TabsContent>
        <TabsContent value="phone" className="mt-6">
           <PhoneAuth />
        </TabsContent>
      </Tabs>
    </>
  );
}
