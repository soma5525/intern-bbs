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
import { Suspense } from "react";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header
      className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          href={user ? "/protected/posts" : "/"}
          className="text-xl font-bold"
          aria-label="掲示板トップページ"
        >
          掲示板
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-4">
          <Suspense fallback={<div>Loading...</div>}>
            <AuthButton />
          </Suspense>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="メニューを開く"
                aria-haspopup="true"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              role="dialog"
              aria-label="ナビゲーションメニュー"
            >
              <SheetHeader className="mb-4">
                <SheetTitle>メニュー</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-3" role="navigation">
                <SheetClose asChild>
                  <Link
                    href={user ? "/protected/posts" : "/"}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    aria-label="投稿一覧へ移動"
                  >
                    <List className="h-5 w-5" aria-hidden="true" />
                    投稿一覧
                  </Link>
                </SheetClose>
                {user ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/protected/profile/edit"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        aria-label="プロフィール編集へ移動"
                      >
                        <User className="h-5 w-5" aria-hidden="true" />
                        プロフィール編集
                      </Link>
                    </SheetClose>
                    <form action={signOutAction} className="w-full">
                      <SheetClose asChild>
                        <Button
                          type="submit"
                          variant="ghost"
                          className="w-full justify-start flex items-center gap-2 p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          aria-label="ログアウト"
                        >
                          <LogOut className="h-5 w-5" aria-hidden="true" />
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
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        aria-label="ログインページへ移動"
                      >
                        ログイン
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/sign-up"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        aria-label="新規登録ページへ移動"
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
