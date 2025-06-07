"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function saveProfileData(formData: FormData) {
  const user = await getCurrentUser();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }

  if (!name) {
    return { error: "名前は必須です" };
  }

  if (!email) {
    return { error: "メールアドレスは必須です" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    "profileData",
    JSON.stringify({ name, email, userId: user.id }),
    {
      maxAge: 60 * 10, // 10分間有効
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }
  );

  redirect("/protected/profile/confirm");
}

export async function updateUserProfile(formData: FormData) {
  const user = await getCurrentUser();
  const profileData = await getProfileData();

  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }

  const supabase = await createClient();

  const { error: authErr, data: updatedAuth } = await supabase.auth.updateUser({
    email: profileData.email,
    data: { full_name: profileData.name }, // 名前も metadata に保存
  });

  if (authErr) {
    return { error: authErr.message };
  }

  try {
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { name: profileData.name, email: profileData.email },
    });
    // return { success: true };
  } catch (dbErr) {
    // rollback（成功可否は無視してユーザーへはエラー返却）
    await supabase.auth.updateUser({ email: user.email });
    return { error: "データベース更新に失敗しました" };
  }

  revalidatePath("/protected/profile/edit");
  return { success: true };
}

export async function deactivateAccount() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }

  if (user.isActive === false) {
    return { error: "アカウントが無効です" };
  }

  // Prismaでユーザーを非アクティブ化
  await prisma.userProfile.update({
    where: { id: user.id },
    data: {
      isActive: false,
    },
  });

  // Supabase Authからサインアウト
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/protected/profile/edit");
  redirect("/sign-in");
}

export async function getProfileData() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }

  const cookieStore = (await cookies()).get("profileData");
  if (!cookieStore) {
    return { error: "プロフィールデータが見つかりません" };
  }

  try {
    const data = JSON.parse(cookieStore.value);

    if (data.userId !== user.id) {
      (await cookies()).delete("profileData");
      return { error: "プロフィールデータが見つかりません" };
    }

    return data;
  } catch (error) {
    (await cookies()).delete("profileData");
    return { error: "プロフィールデータが見つかりません" };
  }
}
