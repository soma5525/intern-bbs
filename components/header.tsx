import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import AuthButton from "./auth-button";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/posts" className="text-xl font-bold">
          掲示板
        </Link>
        <div className="flex items-center gap-4">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
