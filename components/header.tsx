import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import AuthButton from "./auth-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Menu, LogOut, User, List } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          href={user ? "/protected/posts" : "/"}
          className="text-xl font-bold"
        >
          掲示板
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-4">
          <AuthButton />
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="mb-4">
                <SheetTitle>メニュー</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-3">
                <SheetClose asChild>
                  <Link
                    href={user ? "/protected/posts" : "/"}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                  >
                    <List className="h-5 w-5" />
                    投稿一覧
                  </Link>
                </SheetClose>
                {user ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/protected/profile/edit"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      >
                        <User className="h-5 w-5" />
                        プロフィール編集
                      </Link>
                    </SheetClose>
                    <form action={signOutAction} className="w-full">
                      <SheetClose asChild>
                        <Button
                          type="submit"
                          variant="ghost"
                          className="w-full justify-start flex items-center gap-2 p-2"
                        >
                          <LogOut className="h-5 w-5" />
                          ログアウト
                        </Button>
                      </SheetClose>
                    </form>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/sign-in"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      >
                        ログイン
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/sign-up"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      >
                        新規登録
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
