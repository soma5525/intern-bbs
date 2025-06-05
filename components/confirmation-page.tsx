"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConfirmationPageProps {
  title: string;
  description: string;
  items: { label: string; value: string }[];
  onConfirm: (
    formData: FormData
  ) => Promise<{ error?: string } | { success: true } | undefined>;
  cancelHref: string;
  isLoading?: boolean;
  successRedirectPath?: string;
}

export function ConfirmationPage({
  title,
  description,
  items,
  onConfirm,
  cancelHref,
  isLoading = false,
  successRedirectPath = "/protected/posts",
}: ConfirmationPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    setError(null);

    try {
      const result = await onConfirm(new FormData());
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push(successRedirectPath);
      } else {
        setError("処理に失敗しました。");
      }
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) {
        const digestStr = String(err.digest || "");
        if (digestStr.includes("NEXT_REDIRECT")) {
          return;
        }
      }

      setError("予期しないエラーが発生しました");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-3 gap-4">
              <div className="font-medium text-muted-foreground">
                {item.label}
              </div>
              <div className="col-span-2">{item.value}</div>
            </div>
          ))}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={cancelHref}>戻る</Link>
        </Button>
        <Button onClick={handleConfirm} disabled={isLoading || processing}>
          {isLoading || processing ? "処理中..." : "確認して保存"}
        </Button>
      </CardFooter>
    </Card>
  );
}
