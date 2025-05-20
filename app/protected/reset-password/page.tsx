import { resetPasswordAction } from "@/app/actions/auth";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-6">
        <form className="bg-card rounded-lg shadow-lg p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">パスワードをリセット</h1>
            <p className="text-sm text-muted-foreground">
              新しいパスワードを入力してください。
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                新しいパスワード
              </Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="新しいパスワード"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                新しいパスワードを確認
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="新しいパスワードを確認"
                className="w-full"
                required
              />
            </div>

            <SubmitButton className="w-full" formAction={resetPasswordAction}>
              パスワードをリセット
            </SubmitButton>

            <FormMessage message={searchParams} />
          </div>
        </form>
      </div>
    </div>
  );
}
