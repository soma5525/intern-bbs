"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReplyFormProps {
  parentId: string;
  action: (
    parentId: string,
    formData: FormData
  ) => Promise<{ error?: string } | { success?: boolean } | undefined>;
  type?: "create" | "edit";
  initialData?: {
    id: string;
    content: string;
  };
}

// フォーム送信ボタンコンポーネント（useFormStatusを使用）
function SubmitButton({
  type,
  content,
}: {
  type: "create" | "edit";
  content: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || !content.trim()}>
      {pending
        ? type === "create"
          ? "投稿中..."
          : "更新中..."
        : type === "create"
          ? "返信する"
          : "更新する"}
    </Button>
  );
}

// クリアボタンコンポーネント（useFormStatusを使用）
function ClearButton({
  onClear,
  disabled,
}: {
  onClear: () => void;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClear}
      disabled={pending || disabled}
    >
      クリア
    </Button>
  );
}

export function ReplyForm({
  parentId,
  action,
  type = "create",
  initialData,
}: ReplyFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState(initialData?.content || "");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);

    try {
      const result = await action(parentId, formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else if (type === "create") {
        setContent("");
        // Next.jsルーターを使用してページを更新（SPAナビゲーション）
        router.refresh();
      } else if (type === "edit" && result && "success" in result) {
        // Next.jsルーターを使用して親投稿ページにリダイレクト
        router.push(`/protected/posts/${parentId}`);
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました");
    }
  }

  const handleClear = () => {
    setContent(initialData?.content || "");
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{type === "create" ? "返信を投稿" : "返信を編集"}</CardTitle>
        <CardDescription>
          {type === "create"
            ? "この投稿に返信してください"
            : "返信内容を編集してください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {initialData?.id && (
            <input type="hidden" name="id" value={initialData.id} />
          )}
          <div className="space-y-2">
            <Label htmlFor="content">返信内容</Label>
            <Textarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="返信内容を入力してください..."
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end space-x-2">
            {type === "edit" && (
              <Button variant="outline" asChild>
                <Link href={`/protected/posts/${parentId}`}>キャンセル</Link>
              </Button>
            )}
            <ClearButton onClear={handleClear} />
            <SubmitButton type={type} content={content} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
