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

interface ConfirmationPageProps {
  title: string;
  description: string;
  items: { label: string; value: string }[];
  onConfirm: (formData: FormData) => Promise<{ error?: string }>;
  cancelHref: string;
  isLoading?: boolean;
}

export function ConfirmationPage({
  title,
  description,
  items,
  onConfirm,
  cancelHref,
  isLoading = false,
}: ConfirmationPageProps) {
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={cancelHref}>戻る</Link>
        </Button>
        <Button onClick={() => onConfirm(new FormData())} disabled={isLoading}>
          {isLoading ? "処理中..." : "確認して保存"}
        </Button>
      </CardFooter>
    </Card>
  );
}
