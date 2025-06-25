import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getSignUpData,
  saveSignUp,
  signUpAction,
  signInAction,
  forgotPasswordAction,
  resetPasswordAction,
  signOutAction,
} from "../auth";
import { prisma } from "@/lib/prisma";

// next/headersのモック設定
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

// リダイレクト関数のモック
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Supabaseクライアントのモック
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// encodedRedirectのモック
jest.mock("@/lib/utils", () => ({
  encodedRedirect: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// モック関数の型定義
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// 追加のモック
const mockCreateClient = require("@/lib/supabase/server").createClient;
const mockEncodedRedirect = require("@/lib/utils").encodedRedirect;

describe("📝 Auth Actions 統合テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveSignUp", () => {
    it("正常にデータを保存できる", async () => {
      // Prismaモックの設定
      (mockPrisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

      // cookiesモックの設定
      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      };
      mockCookies.mockReturnValue(mockCookieStore as any);

      // テストデータ作成
      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");
      formData.append("name", "Test User");

      // 関数実行
      await saveSignUp(formData);

      // 検証
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "signUpData",
        JSON.stringify({
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        }),
        expect.objectContaining({
          maxAge: 60 * 10,
          path: "/",
        })
      );
      expect(mockRedirect).toHaveBeenCalledWith("/sign-up/confirm");
    });

    it("データが不足している場合はエラーリダイレクトを返す", async () => {
      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      await saveSignUp(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/sign-up",
        "メールアドレス、パスワード、名前は必須項目です"
      );
    });

    it("メールアドレスがすでに存在する場合はエラーリダイレクトを返す", async () => {
      (mockPrisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        id: "user1",
        email: "test@example.com",
        name: "Test User",
        isActive: true,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");
      formData.append("name", "Test User");

      await saveSignUp(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/sign-up",
        "メールアドレスはすでに使用されています"
      );
    });

    it("パスワードが6文字未満の場合はエラーリダイレクトを返す", async () => {
      (mockPrisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);
      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "12345");
      formData.append("name", "Test User");

      await saveSignUp(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/sign-up",
        "パスワードは6文字以上である必要があります"
      );
    });
  });

  describe("getSignUpData", () => {
    it("正常にデータを取得できる", async () => {
      const signUpData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      const mockCookieStore = {
        get: jest.fn(),
        delete: jest.fn(),
      };

      mockCookies.mockReturnValue(mockCookieStore as any);

      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(signUpData),
      });

      const result = await getSignUpData();
      expect(result).toEqual(signUpData);
    });

    it("Cookieが存在しない場合はリダイレクトする", async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(null),
        delete: jest.fn(),
      };

      mockCookies.mockReturnValue(mockCookieStore as any);

      await getSignUpData();
      expect(mockRedirect).toHaveBeenCalledWith("/sign-up");
    });

    it("JSONパースに失敗した場合はCookieを削除してリダイレクトする", async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({
          value: "invalid-json",
        }),
        delete: jest.fn(),
      };

      mockCookies.mockReturnValue(mockCookieStore as any);

      await getSignUpData();
      expect(mockCookieStore.delete).toHaveBeenCalledWith("signUpData");
      expect(mockRedirect).toHaveBeenCalledWith("/sign-up");
    });
  });

  describe("signUpAction", () => {
    beforeEach(() => {
      // getSignUpDataのモック（signUpActionで使用される）
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({
          value: JSON.stringify({
            email: "test@example.com",
            password: "password123",
            name: "Test User",
          }),
        }),
      };
      mockCookies.mockReturnValue(mockCookieStore as any);
    });

    it("正常にユーザー登録できる", async () => {
      // Supabaseモックの設定
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: { id: "supabase-user-id" } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      // Prismaモックの設定
      (mockPrisma.userProfile.create as jest.Mock).mockResolvedValue({
        id: "user1",
        supabaseUid: "supabase-user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true,
      });

      // headersモックの設定
      require("next/headers").headers.mockReturnValue({
        get: jest.fn().mockReturnValue("http://localhost:3000"),
      });

      const formData = new FormData();
      const result = await signUpAction(formData);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          data: { full_name: "Test User" },
          emailRedirectTo: "http://localhost:3000/auth/callback",
        },
      });
      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          supabaseUid: "supabase-user-id",
          name: "Test User",
          email: "test@example.com",
          isActive: true,
        },
      });
      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "success",
        "/sign-in",
        "Thanks for signing up! Please log in."
      );
    });

    it("認証エラーが発生した場合はエラーを返す", async () => {
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Email already exists" },
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      require("next/headers").headers.mockReturnValue({
        get: jest.fn().mockReturnValue("http://localhost:3000"),
      });

      const formData = new FormData();
      await signUpAction(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/sign-up",
        "Email already exists"
      );
    });

    it("プロフィール作成エラーが発生した場合はエラーを返す", async () => {
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: { id: "supabase-user-id" } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      (mockPrisma.userProfile.create as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      require("next/headers").headers.mockReturnValue({
        get: jest.fn().mockReturnValue("http://localhost:3000"),
      });

      const formData = new FormData();
      await signUpAction(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/sign-up",
        "profile creation failed"
      );
    });
  });

  describe("signInAction", () => {
    it("正常にログインできる", async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            error: null,
            data: { user: { id: "supabase-user-id" } },
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      // アクティブユーザーのモック
      (mockPrisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        id: "user1",
        supabaseUid: "supabase-user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: true, // アクティブ
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      await signInAction(formData);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockRedirect).toHaveBeenCalledWith("/protected/posts");
    });

    it("ログインエラーが発生した場合はエラーを返す", async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            error: { message: "Invalid credentials" },
            data: { user: null },
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "wrongpassword");

      await signInAction(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/sign-in",
        "Invalid credentials"
      );
    });

    it("非アクティブユーザーのログインは拒否される", async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            error: null,
            data: { user: { id: "supabase-user-id" } },
          }),
          signOut: jest.fn().mockResolvedValue({}),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      // 非アクティブユーザーのモック
      (mockPrisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        id: "user1",
        supabaseUid: "supabase-user-id",
        name: "Test User",
        email: "test@example.com",
        isActive: false, // 非アクティブ
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      await signInAction(formData);

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/sign-in",
        "このアカウントは無効化されています"
      );
    });

    it("ユーザープロフィールが存在しない場合もログインは拒否される", async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            error: null,
            data: { user: { id: "supabase-user-id" } },
          }),
          signOut: jest.fn().mockResolvedValue({}),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      // ユーザープロフィールが存在しない
      (mockPrisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      await signInAction(formData);

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/sign-in",
        "このアカウントは無効化されています"
      );
    });
  });

  describe("forgotPasswordAction", () => {
    it("正常にパスワードリセットメールを送信できる", async () => {
      const mockSupabase = {
        auth: {
          resetPasswordForEmail: jest.fn().mockResolvedValue({
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      require("next/headers").headers.mockReturnValue({
        get: jest.fn().mockReturnValue("http://localhost:3000"),
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");

      await forgotPasswordAction(formData);

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        {
          redirectTo:
            "http://localhost:3000/auth/callback?redirect_to=/protected/reset-password",
        }
      );
      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "success",
        "/forgot-password",
        "送信したメールを確認してください"
      );
    });

    it("メールアドレスが未入力の場合はエラーを返す", async () => {
      const formData = new FormData();

      await forgotPasswordAction(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/forgot-password",
        "Email is required"
      );
    });

    it("パスワードリセットエラーが発生した場合はエラーを返す", async () => {
      const mockSupabase = {
        auth: {
          resetPasswordForEmail: jest.fn().mockResolvedValue({
            error: { message: "Email not found" },
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      require("next/headers").headers.mockReturnValue({
        get: jest.fn().mockReturnValue("http://localhost:3000"),
      });

      const formData = new FormData();
      formData.append("email", "nonexistent@example.com");

      await forgotPasswordAction(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/forgot-password",
        "Could not reset password"
      );
    });
  });

  describe("resetPasswordAction", () => {
    it("正常にパスワードをリセットできる", async () => {
      const mockSupabase = {
        auth: {
          updateUser: jest.fn().mockResolvedValue({
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const formData = new FormData();
      formData.append("password", "newpassword123");
      formData.append("confirmPassword", "newpassword123");

      await resetPasswordAction(formData);

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: "newpassword123",
      });
      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "success",
        "/sign-in",
        "パスワードを更新しました"
      );
    });

    it("パスワードが未入力の場合はエラーを返す", async () => {
      const formData = new FormData();
      formData.append("confirmPassword", "newpassword123");

      await resetPasswordAction(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/protected/reset-password",
        "パスワードと確認用パスワードは必須項目です"
      );
    });

    it("パスワードが一致しない場合はエラーを返す", async () => {
      const formData = new FormData();
      formData.append("password", "newpassword123");
      formData.append("confirmPassword", "differentpassword");

      await resetPasswordAction(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/protected/reset-password",
        "パスワードと確認用パスワードが一致しません"
      );
    });

    it("パスワード更新エラーが発生した場合はエラーを返す", async () => {
      const mockSupabase = {
        auth: {
          updateUser: jest.fn().mockResolvedValue({
            error: { message: "Password update failed" },
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const formData = new FormData();
      formData.append("password", "newpassword123");
      formData.append("confirmPassword", "newpassword123");

      await resetPasswordAction(formData);

      expect(mockEncodedRedirect).toHaveBeenCalledWith(
        "error",
        "/protected/reset-password",
        "パスワードの更新に失敗しました"
      );
    });
  });

  describe("signOutAction", () => {
    it("正常にログアウトできる", async () => {
      const mockSupabase = {
        auth: {
          signOut: jest.fn().mockResolvedValue({}),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      await signOutAction();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
    });
  });
});
