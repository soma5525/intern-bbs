import { saveSignUp } from "@/app/actions/auth";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "新規登録",
  description: "新規登録ページです。",
};

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-md px-6">
        <form className="bg-card rounded-lg shadow-lg p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">新規登録</h1>
            <p className="text-sm text text-foreground">
              すでにアカウントをお持ちですか？{" "}
              <Link
                className="text-primary font-medium hover:underline ml-1"
                href="/sign-in"
              >
                ログイン
              </Link>
            </p>
          </div>

          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
            <Label htmlFor="name">ユーザー名</Label>
            <Input name="name" placeholder="ユーザー名" required />

            <Label htmlFor="email">メールアドレス</Label>
            <Input name="email" placeholder="メールアドレス" required />

            <Label htmlFor="password">パスワード</Label>
            <Input
              type="password"
              name="password"
              placeholder="パスワード"
              minLength={6}
              required
            />
            <SubmitButton formAction={saveSignUp} pendingText="確認画面へ...">
              確認画面へ
            </SubmitButton>
            <FormMessage message={searchParams} />
          </div>
        </form>
      </div>
    </div>
  );
}
