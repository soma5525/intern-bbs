import { signOutAction } from "@/app/actions/auth";
import { hasEnvVars } from "@/lib/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthButton() {
  const user = await getCurrentUser();

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              Please update .env.local file with anon key and url
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">ログイン</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up">新規登録</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.name || user.email || "ゲスト"}さん!
      <Button variant="ghost" size="sm" asChild>
        <Link href="/protected/profile/edit">プロフィール編集</Link>
      </Button>
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"}>
          ログアウト
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">ログイン</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">新規登録</Link>
      </Button>
    </div>
  );
}
