import { getCurrentUser } from "@/lib/auth";
import { getSignUpData } from "@/app/actions/auth";
import { render, screen } from "@testing-library/react";
import SignUpConfirmPage from "@/app/(auth-pages)/sign-up/confirm/page";

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/app/actions/auth", () => ({
  getSignUpData: jest.fn(),
}));

jest.mock("@/components/confirmation-page", () => {
  return {
    ConfirmationPage: ({
      title,
      description,
      items,
      onConfirm,
      cancelHref,
    }: any) => (
      <div data-testid="confirmation-page">
        <h1>{title}</h1>
        <p>{description}</p>
        <div data-testid="items">
          {items.map((item: any, index: number) => (
            <div key={index}>
              <span>{item.label}:</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onConfirm} data-testid="confirm-button">
          確認
        </button>
        <a href={cancelHref} data-testid="cancel-link">
          キャンセル
        </a>
      </div>
    ),
  };
});

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

const mockGetSignUpData = getSignUpData as jest.MockedFunction<
  typeof getSignUpData
>;

describe("SignUpConfirmPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("確認画面が正しく表示される", async () => {
    const mockSignUpData = {
      name: "テストユーザー",
      email: "test@example.com",
      password: "password123",
    };

    mockGetCurrentUser.mockResolvedValue(null);
    mockGetSignUpData.mockResolvedValue(mockSignUpData);

    render(await SignUpConfirmPage());

    expect(screen.getByText("アカウント作成の確認")).toBeInTheDocument();
    expect(
      screen.getByText(
        "以下の内容でアカウントを作成します。内容を確認してください。"
      )
    ).toBeInTheDocument();
    // 入力データの確認
    expect(screen.getByText("名前:")).toBeInTheDocument();
    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    expect(screen.getByText("メールアドレス:")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("パスワード:")).toBeInTheDocument();

    // パスワードがマスクされていることを確認
    const maskedPassword = "•".repeat(mockSignUpData.password.length);
    expect(screen.getByText(maskedPassword)).toBeInTheDocument();

    expect(screen.getByTestId("confirm-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-link")).toHaveAttribute(
      "href",
      "/sign-up"
    );
  });

  it("ConfirmationPageに正しいpropsが渡される", async () => {
    const mockSignUpData = {
      name: "テストユーザー",
      email: "test@example.com",
      password: "password123",
    };

    mockGetCurrentUser.mockResolvedValue(null);
    mockGetSignUpData.mockResolvedValue(mockSignUpData);

    render(await SignUpConfirmPage());

    expect(screen.getByTestId("confirmation-page")).toBeInTheDocument();

    const itemsContainer = screen.getByTestId("items");
    expect(itemsContainer).toBeInTheDocument();

    const items = itemsContainer.children;
    expect(items).toHaveLength(3);
  });

  it("パスワードが正しくマスクされる", async () => {
    const mockSignUpData = {
      name: "テストユーザー",
      email: "test@example.com",
      password: "realylongpassword",
    };

    mockGetCurrentUser.mockResolvedValue(null);
    mockGetSignUpData.mockResolvedValue(mockSignUpData);

    render(await SignUpConfirmPage());

    const expectedMask = "•".repeat(mockSignUpData.password.length);
    expect(screen.getByText(expectedMask)).toBeInTheDocument();

    expect(screen.queryByText("realylongpassword")).not.toBeInTheDocument();
  });
});
