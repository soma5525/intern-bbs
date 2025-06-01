import Login from "@/app/(auth-pages)/sign-in/page";
import { signInAction } from "@/app/actions/auth";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/app/actions/auth", () => ({
  signInAction: jest.fn(),
}));

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

const mockSignInAction = signInAction as jest.MockedFunction<
  typeof signInAction
>;

describe("SignInPage", () => {
  beforeEach(() => {
    // 全てのテストの前にモックをクリア
    jest.clearAllMocks();
  });

  it("ログインフォームが正しく表示される", async () => {
    const mockSearchParams = Promise.resolve({ message: "" });

    render(await Login({ searchParams: mockSearchParams }));

    expect(
      screen.getByRole("heading", { name: "ログイン" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログイン" })
    ).toBeInTheDocument();

    // リンクの確認
    expect(screen.getByRole("link", { name: "新規登録" })).toHaveAttribute(
      "href",
      "/sign-up"
    );
    expect(
      screen.getByRole("link", { name: "パスワードを忘れた方はこちら" })
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("必須項目が設定されている", async () => {
    const mockSearchParams = Promise.resolve({ message: "" });
    render(await Login({ searchParams: mockSearchParams }));

    const emailInput = screen.getByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();

    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("エラーメッセージが表示される", async () => {
    const mockSearchParams = Promise.resolve({
      error: "ログインに失敗しました",
    });

    render(await Login({ searchParams: mockSearchParams }));
    expect(screen.getByText("ログインに失敗しました")).toBeInTheDocument();
  });

  it("成功メッセージが表示される", async () => {
    const mockSearchParams = Promise.resolve({
      success: "ログインに成功しました",
    });

    render(await Login({ searchParams: mockSearchParams }));
    expect(screen.getByText("ログインに成功しました")).toBeInTheDocument();
  });

  it("フォームの入力値が正しく設定される", async () => {
    const mockSearchParams = Promise.resolve({ message: "" });

    render(await Login({ searchParams: mockSearchParams }));

    const emailInput = screen.getByLabelText(
      "メールアドレス"
    ) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      "パスワード"
    ) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: "test@exmaple.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput.value).toBe("test@exmaple.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("ログインボタンをクリックしたらsignInActionが呼ばれる", async () => {
    const mockSearchParams = Promise.resolve({ message: "" });
    render(await Login({ searchParams: mockSearchParams }));

    const emailInput = screen.getByLabelText(
      "メールアドレス"
    ) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      "パスワード"
    ) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: "test@exmaple.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const loginButton = screen.getByRole("button", { name: "ログイン" });
    fireEvent.click(loginButton);

    // FormDataオブジェクトが渡されたことを確認
    expect(mockSignInAction).toHaveBeenCalledTimes(1);
    expect(mockSignInAction).toHaveBeenCalledWith(expect.any(FormData));
  });
});
