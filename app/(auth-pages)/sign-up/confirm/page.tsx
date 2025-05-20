import { Header } from "@/components/header";
import { getCurrentUser } from "@/lib/auth";
import { getSignUpData } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { ConfirmationPage } from "@/components/confirmation-page";
import { Metadata } from "next";
import { signUpAction } from "@/app/actions/auth";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "新規登録確認 - 掲示板",
  description: "アカウント作成の確認",
};

export default async function SignUpConfirmPage() {
  const user = await getCurrentUser();
  const signUpData = await getSignUpData();

  const maskedPassword = "•".repeat(signUpData.password.length);

  if (!signUpData.name || !signUpData.email) {
    redirect("/sign-up");
  }

  async function handleConfirm() {
    "use server";

    const signUpData = await getSignUpData();

    const formData = new FormData();
    formData.append("email", signUpData.email);
    formData.append("password", signUpData.password);
    formData.append("name", signUpData.name);

    await signUpAction(formData); // singUpActionは成功したらsign-inにリダイレクトする
    (await cookies()).delete("signUpData");

    return { error: "サインアップに失敗しました" };
  }

  return (
    <div className="w-full flex justify-center py-12 px-4">
      <main className="w-full max-w-md">
        <ConfirmationPage
          title="アカウント作成の確認"
          description="以下の内容でアカウントを作成します。内容を確認してください。"
          items={[
            { label: "名前", value: signUpData.name },
            { label: "メールアドレス", value: signUpData.email },
            { label: "パスワード", value: maskedPassword },
          ]}
          onConfirm={handleConfirm}
          cancelHref="/sign-up"
        />
      </main>
    </div>
  );
}
