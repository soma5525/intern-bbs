import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await prisma.userProfile.findUnique({
    where: {
      supabaseUid: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  return profile;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (!user.isActive) {
    redirect("/sign-out");
  }
  return user;
}
