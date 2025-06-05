# 技術ノート - テスト実装詳細

## 🔧 環境構築の詳細

### パッケージインストール

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### jest.config.js

```javascript
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "app/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

### jest.setup.js

```javascript
import "@testing-library/jest-dom";
```

### package.json テストスクリプト

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### tsconfig.json 型定義追加

```json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

## 🎭 モック戦略パターン

### 1. 基本的なモック

```typescript
// 関数のモック
jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

// 使用例
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
mockGetCurrentUser.mockResolvedValue({ id: "1", name: "Test User" });
```

### 2. 動的モック（getter使用）

```typescript
// 変数を使った動的モック
let mockHasEnvVars = true;

jest.mock("@/utils/supabase/check-env-vars", () => ({
  get hasEnvVars() {
    return mockHasEnvVars;
  },
}));

// テスト内で値を変更
beforeEach(() => {
  mockHasEnvVars = true; // デフォルト値
});

it("should handle missing env vars", () => {
  mockHasEnvVars = false; // この テストでのみ false
  // テスト実行
});
```

### 3. Next.js Router のモック

```typescript
// next/navigation のモック
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));
```

### 4. Server Actions のモック

```typescript
// Server Actions のモック
jest.mock("@/app/actions/auth", () => ({
  signOutAction: jest.fn(),
  signInAction: jest.fn(),
  saveSignUp: jest.fn(),
}));

// 使用例
const mockSignOutAction = signOutAction as jest.MockedFunction<
  typeof signOutAction
>;
mockSignOutAction.mockResolvedValue({ success: "ログアウトしました" });
```

## 🧪 テストパターン集

### 1. 基本的なコンポーネントテスト

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 2. フォーム操作のテスト

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle form input', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);

  await user.type(emailInput, 'test@example.com');
  await user.type(passwordInput, 'password123');

  expect(emailInput).toHaveValue('test@example.com');
  expect(passwordInput).toHaveValue('password123');
});
```

### 3. 非同期処理のテスト

```typescript
import { render, screen, waitFor } from '@testing-library/react';

it('should handle async operations', async () => {
  const mockAsyncFunction = jest.fn().mockResolvedValue('success');

  render(<AsyncComponent onSubmit={mockAsyncFunction} />);

  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
});
```

### 4. エラーハンドリングのテスト

```typescript
it('should display error message on failure', async () => {
  const mockFailingFunction = jest.fn().mockRejectedValue(new Error('API Error'));

  render(<ComponentWithErrorHandling onSubmit={mockFailingFunction} />);

  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
  });
});
```

### 5. 条件分岐のテスト

```typescript
describe('Conditional rendering', () => {
  it('should show login form when not authenticated', () => {
    mockGetCurrentUser.mockResolvedValue(null);

    render(<AuthButton />);

    expect(screen.getByText('ログイン')).toBeInTheDocument();
    expect(screen.getByText('新規登録')).toBeInTheDocument();
  });

  it('should show user info when authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: '1',
      email: 'test@example.com'
    });

    render(<AuthButton />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});
```

## 🐛 トラブルシューティング

### 1. モジュール解決エラー

```
Cannot resolve module '@/components/...'
```

**解決方法**: `jest.config.js` の `moduleNameMapper` を確認

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### 2. toBeDisabled() エラー

```
expect(received).toBeDisabled()
received value must be an input, select, textarea, or button element
```

**原因**: `<Button asChild>` により `<a>` タグが生成される
**解決方法**:

```typescript
// ❌ 間違い
expect(screen.getByRole("button")).toBeDisabled();

// ✅ 正しい
const link = screen.getByRole("link");
expect(link).toHaveAttribute("disabled");
expect(link).toHaveClass("pointer-events-none");
```

### 3. Server Component のテストエラー

```
Error: Cannot read properties of undefined (reading 'getCurrentUser')
```

**解決方法**: 適切なモック設定

```typescript
// モックを先に定義
const mockGetCurrentUser = jest.fn();

jest.mock("@/lib/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// テスト内で値を設定
beforeEach(() => {
  mockGetCurrentUser.mockResolvedValue(null);
});
```

### 4. 非同期コンポーネントのテスト

```
Warning: An invalid form control with name='' is not focusable
```

**解決方法**: 適切な待機処理

```typescript
// ❌ 間違い
render(<AsyncComponent />);
expect(screen.getByText('...')).toBeInTheDocument();

// ✅ 正しい
render(<AsyncComponent />);
await waitFor(() => {
  expect(screen.getByText('...')).toBeInTheDocument();
});
```

## 📊 テストカバレッジ

### カバレッジレポートの確認

```bash
npm run test:coverage
```

### カバレッジ設定

```javascript
// jest.config.js
collectCoverageFrom: [
  'components/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  'app/**/*.{js,jsx,ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
  '!**/__tests__/**',
  '!**/coverage/**',
],
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
```

## 🎯 ベストプラクティス

### 1. テストファイルの構造

```
components/
├── auth/
│   ├── login-form.tsx
│   └── __tests__/
│       └── login-form.test.tsx
├── ui/
│   ├── button.tsx
│   └── __tests__/
│       └── button.test.tsx
└── __tests__/
    ├── auth-button.test.tsx
    └── confirmation-page.test.tsx
```

### 2. テストの命名規則

```typescript
describe("LoginForm", () => {
  describe("Rendering", () => {
    it("should render email and password fields", () => {});
    it("should render submit button", () => {});
  });

  describe("User Interactions", () => {
    it("should update email field on input", () => {});
    it("should submit form with valid data", () => {});
  });

  describe("Error Handling", () => {
    it("should display error message on invalid credentials", () => {});
    it("should handle network errors", () => {});
  });
});
```

### 3. モックのリセット

```typescript
describe("Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // または
    mockFunction.mockReset();
  });
});
```

### 4. テストデータの管理

```typescript
// test-utils/fixtures.ts
export const mockUser = {
  id: "1",
  email: "test@example.com",
  name: "Test User",
};

export const mockPost = {
  id: "1",
  title: "Test Post",
  content: "Test content",
  authorId: "1",
};

// テストファイル内
import { mockUser, mockPost } from "../test-utils/fixtures";
```

### 5. カスタムレンダー関数

```typescript
// test-utils/render.tsx
import { render } from '@testing-library/react';
import { ReactElement } from 'react';

const customRender = (ui: ReactElement, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <div data-testid="test-wrapper">
        {children}
      </div>
    ),
    ...options,
  });
};

export * from '@testing-library/react';
export { customRender as render };
```

## 🔄 継続的改善

### 1. テストの実行速度向上

```javascript
// jest.config.js
maxWorkers: '50%', // CPU使用率を制限
testTimeout: 10000, // タイムアウト設定
```

### 2. テストの並列実行

```bash
# 並列実行
npm test -- --maxWorkers=4

# ウォッチモード
npm test -- --watch --maxWorkers=2
```

### 3. テストの選択実行

```bash
# 特定のファイルのみ
npm test auth-button.test.tsx

# パターンマッチング
npm test -- --testNamePattern="should render"

# 変更されたファイルのみ
npm test -- --onlyChanged
```

---

このノートは実際の開発で遭遇した問題と解決方法をまとめたものです。新しい問題や解決方法が見つかり次第、継続的に更新していきます。

## 🚀 React useFormStatus を活用したフォーム状態管理

### 概要

投稿ボタンのdisabled属性が正しく動作しない問題を解決するため、React 19の`useFormStatus`を活用したモダンなフォーム状態管理に移行しました。

### 問題の背景

**解決前の問題:**

- 投稿ボタンのdisabled属性が正しく動作しない
- 手動の`isLoading`状態管理による複雑性
- Server Actionとの連携が不完全

**従来の実装:**

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(formData: FormData) {
  setIsLoading(true);
  try {
    const result = await action(formData);
    // 処理...
  } finally {
    setIsLoading(false); // 手動でリセット
  }
}

<Button type="submit" disabled={isLoading}>
  {isLoading ? "投稿中..." : "投稿"}
</Button>
```

### useFormStatus を活用した解決方法

**新しい実装:**

```typescript
import { useFormStatus } from "react-dom";

// フォーム送信ボタンコンポーネント（useFormStatusを使用）
function SubmitButton({ type }: { type: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "投稿中..." : type === "create" ? "投稿" : "更新"}
    </Button>
  );
}

export function PostForm({ type, action, initialData }: PostFormProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    // isLoadingの手動管理は不要
    try {
      const result = await action(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      } else if (result && "success" in result) {
        router.push("/protected/posts");
      } else {
        setError("投稿処理に失敗しました。");
      }
    } catch (err) {
      setError("予期しないエラーが発生しました");
    }
    // finallyブロックも不要
  }

  return (
    <form action={handleSubmit}>
      {/* フォーム要素 */}
      <SubmitButton type={type} />
    </form>
  );
}
```

### 主な変更点

1. **useFormStatusを活用した自動的なフォーム状態管理**

   - `pending`状態を自動で管理
   - フォームアクションと自動的に連携

2. **手動のisLoading状態管理の削除**

   - `useState(false)`の削除
   - `setIsLoading`の呼び出しが不要
   - `finally`ブロックでのリセット処理が不要

3. **SubmitButtonコンポーネントの分離による責任分離**

   - フォーム状態の表示専用コンポーネント
   - 再利用性の向上

4. **テストファイルでの適切なモック化**

   ```typescript
   // useFormStatusのモック
   jest.mock("react-dom", () => ({
     ...jest.requireActual("react-dom"),
     useFormStatus: jest.fn(),
   }));

   const mockUseFormStatus = require("react-dom").useFormStatus as jest.MockedFunction<any>;

   beforeEach(() => {
     mockUseFormStatus.mockReturnValue({ pending: false });
   });

   it("投稿中はローディング状態になる", async () => {
     mockUseFormStatus.mockReturnValue({ pending: true });
     render(<PostForm type="create" action={mockAction} />);

     const loadingButton = screen.getByRole("button", { name: "投稿中..." });
     expect(loadingButton).toBeDisabled();
   });
   ```

### 技術的改善

**React 19のuseFormStatusを活用したモダンなフォーム状態管理:**

- Server Actionとの自動連携
- より直感的なAPI
- エラーの発生確率低下

**より良いコンポーネント分離による保守性向上:**

- 単一責任の原則に従った設計
- テストしやすい構造
- 再利用性の向上

**テストの安定性向上:**

- モック化が容易
- 状態管理のテストが簡潔
- フレーキーテストの減少

### useFormStatusの利点

1. **フォームアクションと自動的に連携**

   - Server Actionの実行状態を自動追跡
   - 手動での状態同期が不要

2. **手動の状態管理が不要**

   - useState不要
   - useEffectによる副作用管理不要
   - メモリリークのリスク低下

3. **エラーの発生確率が低下**
   - 状態の更新忘れがない
   - 非同期処理の競合状態が発生しにくい

### 今後の改善案

1. **他のフォームコンポーネントへの適用**

   ```typescript
   // ReplyFormコンポーネントも同様に修正
   function ReplySubmitButton() {
     const { pending } = useFormStatus();
     return (
       <Button type="submit" disabled={pending}>
         {pending ? "送信中..." : "返信"}
       </Button>
     );
   }
   ```

2. **より詳細なフォーム状態の表示**

   ```typescript
   function AdvancedSubmitButton() {
     const { pending, data, method, action } = useFormStatus();

     if (pending) {
       return <Button disabled>送信中...</Button>;
     }

     return <Button type="submit">送信</Button>;
   }
   ```

3. **グローバルな状態表示**

   ```typescript
   // アプリケーション全体でフォーム送信状態を表示
   function GlobalLoadingIndicator() {
     const { pending } = useFormStatus();

     if (pending) {
       return <div className="global-loading">処理中...</div>;
     }

     return null;
   }
   ```

### 学習効果

**React Server ActionsとuseFormStatusの組み合わせによる効率的なフォーム開発手法を習得:**

- モダンなReactパターンの理解
- サーバーサイド処理との統合手法
- テスト戦略の改善

**得られた知識:**

- useFormStatusの使用場面と利点
- フォームコンポーネントの設計パターン
- Server Actionとクライアントサイドの状態管理の連携
- モック戦略の改善

### 関連リソース

- [React useFormStatus Documentation](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Testing Server Actions](https://nextjs.org/docs/app/building-your-application/testing/jest)

---

**更新日:** 2024-12-22  
**実装者:** AI Assistant  
**関連ファイル:** `components/post-form.tsx`, `components/__tests__/post/post-form.test.tsx`
