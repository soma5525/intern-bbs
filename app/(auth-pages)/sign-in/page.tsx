import { signInAction } from "@/app/actions/auth";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-6">
        <form className="bg-card rounded-lg shadow-lg p-8 space-y-6">
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
                required
              />
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
                required
              />
            </div>

            <SubmitButton
              className="w-full"
              pendingText="ログイン中..."
              formAction={signInAction}
            >
              ログイン
            </SubmitButton>

            <FormMessage message={searchParams} />
          </div>
        </form>
      </div>
    </div>
  );
}
