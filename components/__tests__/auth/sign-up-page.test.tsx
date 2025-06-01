import { render, screen, fireEvent } from "@testing-library/react";
import { saveSignUp } from "@/app/actions/auth";
import Signup from "@/app/(auth-pages)/sign-up/page";

// Server Actionのモック
jest.mock("@/app/actions/auth", () => ({
  saveSignUp: jest.fn(),
}));

// Next.js Linkのモック
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const mockSaveSignUp = saveSignUp as jest.MockedFunction<typeof saveSignUp>;

describe("Signup Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("新規登録フォームが正しく表示される", async () => {
    const mockSearchParams = Promise.resolve({ success: "" });

    render(await Signup({ searchParams: mockSearchParams }));

    // フォーム要素の確認
    expect(
      screen.getByRole("heading", { name: "新規登録" })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ユーザー名")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "確認画面へ" })
    ).toBeInTheDocument();

    // リンクの確認
    expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute(
      "href",
      "/sign-in"
    );
  });

  it("必須項目が設定されている", async () => {
    const mockSearchParams = Promise.resolve({ success: "" });

    render(await Signup({ searchParams: mockSearchParams }));

    const nameInput = screen.getByPlaceholderText("ユーザー名");
    const emailInput = screen.getByPlaceholderText("メールアドレス");
    const passwordInput = screen.getByPlaceholderText("パスワード");

    expect(nameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("minLength", "6");
  });

  it("エラーメッセージが表示される", async () => {
    const mockSearchParams = Promise.resolve({
      error: "登録に失敗しました",
    });

    render(await Signup({ searchParams: mockSearchParams }));

    expect(screen.getByText("登録に失敗しました")).toBeInTheDocument();
  });

  it("成功メッセージが表示される", async () => {
    const mockSearchParams = Promise.resolve({
      success: "登録に成功しました",
    });

    render(await Signup({ searchParams: mockSearchParams }));

    expect(screen.getByText("登録に成功しました")).toBeInTheDocument();
  });

  it("メッセージがある場合はメッセージのみ表示される", async () => {
    const mockSearchParams = Promise.resolve({
      message: "確認メールを送信しました",
    });

    render(await Signup({ searchParams: mockSearchParams }));

    expect(screen.getByText("確認メールを送信しました")).toBeInTheDocument();
    // フォームは表示されない
    expect(
      screen.queryByRole("heading", { name: "新規登録" })
    ).not.toBeInTheDocument();
  });

  it("フォームの入力値が正しく設定される", async () => {
    const mockSearchParams = Promise.resolve({ success: "" });

    render(await Signup({ searchParams: mockSearchParams }));

    const nameInput = screen.getByPlaceholderText(
      "ユーザー名"
    ) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(
      "メールアドレス"
    ) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(
      "パスワード"
    ) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "テストユーザー" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(nameInput.value).toBe("テストユーザー");
    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });
});
