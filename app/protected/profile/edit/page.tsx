import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ProfileForm } from "@/components/profile-form";
import { saveProfileData, deactivateAccount } from "@/app/actions/user";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロフィール編集",
  description: "プロフィールを編集します",
};

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const email = user.email;
  if (!email) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <ProfileForm
          updateAction={saveProfileData}
          deactivateAction={deactivateAccount}
          initialData={{
            name: user.user_metadata.full_name,
            email: email,
          }}
        />
      </main>
    </div>
  );
}
