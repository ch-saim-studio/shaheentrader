import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Register — Shaheen Traders" },
      {
        name: "description",
        content: "Sign in to your Shaheen Traders account to place orders and track deliveries.",
      },
      { property: "og:title", content: "Sign In — Shaheen Traders" },
      { property: "og:description", content: "Access your Shaheen Traders account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!username || !password) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("Incorrect username or password");
      return;
    }
    toast.success("Welcome back");
    void navigate({ to: "/", replace: true });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("full_name") ?? "").trim();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      toast.error("Username: 3–20 letters, numbers or underscore");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username, full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("already") ? "That username is taken" : error.message);
      return;
    }
    toast.success("Account created");
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-display text-5xl">Account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in with your username to place orders and track deliveries.
      </p>

      <Tabs defaultValue="signin" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={signIn} className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="si-username">Username</Label>
              <Input id="si-username" name="username" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="si-password">Password</Label>
              <Input
                id="si-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full font-semibold uppercase tracking-wide" disabled={busy}>
              Sign in
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={signUp} className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="su-name">Full name</Label>
              <Input id="su-name" name="full_name" autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-username">Username</Label>
              <Input id="su-username" name="username" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-password">Password</Label>
              <Input
                id="su-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full font-semibold uppercase tracking-wide" disabled={busy}>
              Create account
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
