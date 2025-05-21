import { updateUserProfile } from "@/app/actions/user";
import { Header } from "@/components/header";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData } from "@/app/actions/user";
import { redirect } from "next/navigation";
import { ConfirmationPage } from "@/components/confirmation-page";

export default async function ConfirmPage() {
  const user = await getCurrentUser();
  const profileData = await getProfileData();

  if (!user) {
    redirect("/sign-in");
  }

  if (profileData.error || !profileData.name || !profileData.email) {
    redirect("/protected/profile/edit");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
        <ConfirmationPage
          title="プロフィール更新の確認"
          description="以下の内容でプロフィールを更新します。内容を確認してください。"
          items={
            ProfileDataIsError(profileData)
              ? []
              : [
                  { label: "名前", value: profileData.name },
                  { label: "メールアドレス", value: profileData.email },
                ]
          }
          onConfirm={updateUserProfile}
          cancelHref="/protected/profile/edit"
        />
      </main>
    </div>
  );
}

function ProfileDataIsError(data: any): data is { error: string } {
  return data && typeof data.error === "string";
}
