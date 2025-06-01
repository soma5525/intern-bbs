"use client";

import { useState } from "react";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface LoginFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  message?: Message;
  isLoading?: boolean;
}

export function LoginForm({
  onSubmit,
  message,
  isLoading = false,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "メールアドレスは必須です";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }

    if (!password) {
      newErrors.password = "パスワードは必須です";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="w-full max-w-md px-6">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-lg shadow-lg p-8 space-y-6"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">ログイン</h1>
          <p className="text-sm text-muted-foreground">
            アカウントをお持ちでない方は
            <Link
              className="text-primary font-medium hover:underline ml-1"
              href="/sign-up"
            >
              新規登録
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              メールアドレス
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-sm font-medium">
                パスワード
              </Label>
              <Link
                className="text-xs text-primary hover:underline"
                href="/forgot-password"
              >
                パスワードを忘れた方はこちら
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="パスワード"
              className="w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errors.password && (
              <p className="text-sm text-destructive" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <SubmitButton
            className="w-full"
            pendingText="ログイン中..."
            disabled={isLoading}
          >
            ログイン
          </SubmitButton>

          {message && <FormMessage message={message} />}
        </div>
      </form>
    </div>
  );
}
