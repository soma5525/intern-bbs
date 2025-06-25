"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const saveSignUp = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const name = formData.get("name")?.toString();

  if (!email || !password || !name) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "メールアドレス、パスワード、名前は必須項目です"
    );
  }

  const existingUser = await prisma.userProfile.findUnique({
    where: {
      email,
    },
  });
  if (existingUser) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "メールアドレスはすでに使用されています"
    );
  }

  if (password.length < 6) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "パスワードは6文字以上である必要があります"
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("signUpData", JSON.stringify({ email, password, name }), {
    maxAge: 60 * 10,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/sign-up/confirm");
};

export const getSignUpData = async () => {
  const signUpDataCookie = (await cookies()).get("signUpData");
  if (!signUpDataCookie) {
    redirect("/sign-up");
  }

  try {
    return JSON.parse(signUpDataCookie.value);
  } catch (error) {
    (await cookies()).delete("signUpData");
    redirect("/sign-up");
  }
};

export const signUpAction = async (formData: FormData) => {
  const { email, password, name } = await getSignUpData();

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !name) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "user name, email, password are required" // 英語で入力
    );
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (authError) {
    return encodedRedirect("error", "/sign-up", authError.message);
  }

  if (authData.user) {
    try {
      await prisma.userProfile.create({
        data: {
          supabaseUid: authData.user.id,
          name: name || "",
          email: email,
          isActive: true,
        },
      });
    } catch (error) {
      return encodedRedirect(
        "error",
        "/sign-up",
        "profile creation failed" // 英語で入力
      );
    }
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Thanks for signing up! Please log in." // 英語で入力
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // ログイン成功後、Prismaでユーザーのアクティブ状態をチェック
  if (data.user) {
    const userProfile = await prisma.userProfile.findUnique({
      where: {
        supabaseUid: data.user.id,
      },
    });

    if (!userProfile || !userProfile.isActive) {
      // 非アクティブユーザーの場合はサインアウトして拒否
      await supabase.auth.signOut();
      return encodedRedirect(
        "error",
        "/sign-in",
        "このアカウントは無効化されています"
      );
    }
  }

  return redirect("/protected/posts");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "送信したメールを確認してください"
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "パスワードと確認用パスワードは必須項目です"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "パスワードと確認用パスワードが一致しません"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "パスワードの更新に失敗しました"
    );
  }

  encodedRedirect("success", "/sign-in", "パスワードを更新しました");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
