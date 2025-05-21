"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  updateAction: (
    formData: FormData
  ) => Promise<{ error?: string } | { success: true } | undefined>;
  deactivateAction: () => Promise<{ error?: string } | undefined>;
  initialData: {
    name: string;
    email: string;
  };
}

export function ProfileForm({
  updateAction,
  deactivateAction,
  initialData,
}: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateAction(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      } else if (result && "success" in result) {
        router.push("/protected/posts");
      }
    } catch (err) {
      // リダイレクトエラーをチェック
      if (err && typeof err === "object" && "digest" in err) {
        const digestStr = String(err.digest || "");
        if (digestStr.includes("NEXT_REDIRECT")) {
          // リダイレクトエラーは正常なフローなので、エラーとして扱わない
          // リダイレクトはサーバーサイドで処理されるため、ここで何もする必要なし
          console.log(
            "リダイレクトが発生します。このエラーは無視してください。"
          );
          return;
        }
      }
      // それ以外の予期しないエラー
      console.error("handleSubmit catch error:", JSON.stringify(err, null, 2));
      setError("予期しないエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeactivate() {
    setIsLoading(true);
    try {
      await deactivateAction();
    } catch (err) {
      setError("Failed to deactivate account");
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>プロフィール編集</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData.email}
              required
            />
          </div>
          <Link
            className="text-sm text-primary hover:underline"
            href="/forgot-password"
          >
            パスワードを忘れた方はこちら
          </Link>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/protected/posts">キャンセル</Link>
            </Button>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="mt-4">
              アカウントを削除する
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>本当に削除しますか？</DialogTitle>
              <DialogDescription>
                この操作はアカウントを削除します。掲示板にアクセスできなくなります。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={isLoading}
              >
                {isLoading ? "削除中..." : "削除する"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
