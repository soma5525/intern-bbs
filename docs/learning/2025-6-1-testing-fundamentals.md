# テスト学習記録 - 2024年12月19日

## 📚 学習概要

今日はReactアプリケーションにおけるテストの基礎から実践まで、包括的に学習しました。特にユニットテストとE2Eテストの違い、テストフレームワークの導入、実際のコンポーネントテストの実装まで幅広くカバーしました。

## 🎯 学習目標と達成状況

### ✅ 達成した目標

- [x] ユニットテストとE2Eテストの概念理解
- [x] Jest + React Testing Libraryの環境構築
- [x] 基本的なコンポーネントテストの実装
- [x] 非同期コンポーネントのテスト手法習得
- [x] モック戦略の理解と実装
- [x] テスト練習問題生成システムの構築

### 🔄 継続学習項目

- [ ] E2Eテスト（Cypress/Playwright）の実装
- [ ] より複雑な状態管理のテスト
- [ ] パフォーマンステストの導入

## 📖 学習内容詳細

### 1. テストの基礎概念

#### ユニットテスト

- **目的**: 小さな単位（関数、メソッド、コンポーネント）の動作確認
- **特徴**: 高速実行、問題箇所の特定が容易
- **ツール**: Jest、React Testing Library

#### E2Eテスト（フューチャーテスト）

- **目的**: ユーザー視点での機能全体の動作確認
- **特徴**: ブラウザ操作をエミュレート、実際のユーザー体験をテスト
- **ツール**: Cypress、Playwright

### 2. 環境構築

#### 導入したパッケージ

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

#### 設定ファイル

- `jest.config.js`: Next.jsとの統合、moduleNameMapper設定
- `jest.setup.js`: @testing-library/jest-domのインポート
- `package.json`: テストスクリプト追加
- `tsconfig.json`: 型定義の追加

### 3. 実装したテスト

#### AuthButtonコンポーネント

- **課題**: 非同期サーバーコンポーネントのテスト
- **解決策**:
  - 依存関係のモック（`@/lib/auth`、`@/utils/supabase/check-env-vars`、`@/app/actions/auth`）
  - 動的モック（getter使用）
  - 条件分岐のテスト（環境変数、ログイン状態）

#### ConfirmationPageコンポーネント

- **課題**: 汎用確認画面コンポーネントのテスト
- **解決策**:
  - `next/navigation`のモック
  - プロパティのモック
  - 基本表示とボタン動作のテスト

#### 認証ページのテスト

- **実装**: ログイン・新規登録ページのテスト
- **技術**: Server Componentのテスト手法
- **課題**: Server Actionsのモック、Message型の正しい使用

### 4. 技術的な学び

#### モック戦略

```typescript
// 基本的なモック
jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

// 動的モック（getter使用）
jest.mock("@/utils/supabase/check-env-vars", () => ({
  get hasEnvVars() {
    return mockHasEnvVars;
  },
}));
```

#### テスト構造

```typescript
describe("コンポーネント名", () => {
  beforeEach(() => {
    // モックのリセット
  });

  it("should render correctly", () => {
    // 基本的な表示テスト
  });

  it("should handle user interactions", () => {
    // ユーザー操作のテスト
  });
});
```

#### 非同期テスト

```typescript
it("should handle async operations", async () => {
  // 非同期処理のテスト
  await waitFor(() => {
    expect(screen.getByText("Expected text")).toBeInTheDocument();
  });
});
```

### 5. 解決した技術的課題

#### モジュール解決エラー

- **問題**: `jest.config.js`のパス設定
- **解決**: `moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }`

#### 要素取得の問題

- **問題**: `<Button asChild>`による要素ロールの変化
- **解決**: `screen.getByRole("link")`での取得、適切な属性確認

#### Server Componentのテスト

- **問題**: 非同期コンポーネントのテスト方法
- **解決**: 依存関係の適切なモック、条件分岐の網羅的テスト

## 🛠️ 作成したツール・システム

### テスト練習問題生成システム

完成したテストコードから初学者向けの練習問題を自動生成するシステムを構築しました。

#### 構成要素

1. **完全版プロンプト** (`docs/prompts/test-practice-generator.md`)

   - 詳細な要件定義
   - 6段階のレベル構成
   - カスタマイズ例

2. **簡潔版プロンプト** (`docs/prompts/test-practice-generator-simple.md`)

   - 素早い練習問題生成
   - コピー用テンプレート

3. **ドキュメント** (`docs/prompts/README.md`)
   - 使用方法の詳細説明
   - カスタマイズのヒント

#### 生成される教材

- 練習問題ドキュメント（学習目標、段階的問題）
- 練習用テンプレート（TODO形式）
- 解答例（詳細解説付き）

## 📋 プロジェクト管理

### タスク管理の改善

- 2つの`todo.md`ファイルを統合
- テスト関連タスクを既存プロジェクトに統合
- 見積時間を含む詳細なタスク管理体制を確立

### テスト計画の策定

認証システムとCRUD操作に絞った最低限のテスト計画を策定：

#### Week 1（認証システム）🔴

- LoginFormコンポーネントのテスト
- RegisterFormコンポーネントのテスト

#### Week 2-3（CRUD操作）🟡

- PostForm（作成）のテスト
- PostList（一覧）のテスト
- PostEditForm（編集）のテスト
- PostDeleteConfirmation（削除）のテスト

## 💡 重要な学習ポイント

### 1. テスト設計の考え方

- **ユーザー視点**: 実際の使用方法に基づいたテスト
- **境界値**: エッジケースの考慮
- **依存関係**: 適切なモック戦略

### 2. モックの使い分け

- **静的モック**: 固定値を返す場合
- **動的モック**: テストケースごとに値を変更する場合
- **部分モック**: 一部の機能のみモックする場合

### 3. テストの可読性

- **明確な命名**: テストケースの意図が分かる名前
- **適切な構造**: describe/itの階層化
- **コメント**: 複雑なロジックの説明

### 4. 継続的改善

- **リファクタリング**: テストコードも保守対象
- **カバレッジ**: 重要な部分の網羅
- **実行速度**: 効率的なテスト実行

## 🔄 次のステップ

### 短期目標（1週間）

1. 認証システムのテスト完成
2. 基本的なCRUD操作のテスト実装
3. テストカバレッジの向上

### 中期目標（1ヶ月）

1. E2Eテストの導入
2. パフォーマンステストの実装
3. CI/CDパイプラインへのテスト統合

### 長期目標（3ヶ月）

1. 包括的なテストスイートの完成
2. テスト駆動開発（TDD）の実践
3. チーム全体でのテスト文化の確立

## 📚 参考資料・リソース

### 公式ドキュメント

- [Jest公式ドキュメント](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

### 学習リソース

- Testing Library のベストプラクティス
- React コンポーネントテストパターン
- モック戦略とテスト設計

### 作成したツール

- テスト練習問題生成プロンプト
- 段階的学習システム
- 自動化された教材生成

## 🚀 最新の学習: useFormStatus を活用したフォーム状態管理（2024年12月22日）

### 📝 学習の背景

PostFormコンポーネントの投稿ボタンでdisabled属性が正しく動作しない問題に遭遇し、この問題をReact 19の`useFormStatus`を活用して解決しました。

### 🎯 解決した課題

**技術的問題:**

- 投稿ボタンのdisabled属性が期待通りに動作しない
- 手動の`isLoading`状態管理による複雑性とエラーの可能性
- Server Actionとクライアントサイド状態の同期問題

**以前の実装の課題:**

```typescript
// ❌ 手動状態管理による問題
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(formData: FormData) {
  setIsLoading(true); // 手動でON
  try {
    const result = await action(formData);
    // 処理...
  } finally {
    setIsLoading(false); // 手動でOFF - 忘れやすい
  }
}
```

### 💡 学習した解決方法

**useFormStatusを活用した新しいアプローチ:**

```typescript
// ✅ useFormStatusによる自動状態管理
import { useFormStatus } from "react-dom";

function SubmitButton({ type }: { type: "create" | "edit" }) {
  const { pending } = useFormStatus(); // 自動で管理される

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "投稿中..." : type === "create" ? "投稿" : "更新"}
    </Button>
  );
}

// フォームコンポーネント側では状態管理不要
export function PostForm({ type, action, initialData }: PostFormProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    // isLoading関連のコードが不要！
    setError(null);
    try {
      const result = await action(formData);
      // エラーハンドリング...
    } catch (err) {
      setError("予期しないエラーが発生しました");
    }
    // finallyブロックも不要！
  }

  return (
    <form action={handleSubmit}>
      {/* フォーム要素 */}
      <SubmitButton type={type} />
    </form>
  );
}
```

### 🧪 テストでの学習ポイント

**useFormStatusのモック化手法:**

```typescript
// react-domのuseFormStatusをモック
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: jest.fn(),
}));

const mockUseFormStatus = require("react-dom").useFormStatus as jest.MockedFunction<any>;

describe("PostForm", () => {
  beforeEach(() => {
    // デフォルトはpending: false
    mockUseFormStatus.mockReturnValue({ pending: false });
  });

  it("投稿中はローディング状態になる", () => {
    // 特定のテストでのみpending: true
    mockUseFormStatus.mockReturnValue({ pending: true });
    render(<PostForm type="create" action={mockAction} />);

    const loadingButton = screen.getByRole("button", { name: "投稿中..." });
    expect(loadingButton).toBeDisabled();
  });

  it("フォーム送信状態ではないときはボタンが有効", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });
    render(<PostForm type="create" action={mockAction} />);

    const submitButton = screen.getByRole("button", { name: "投稿" });
    expect(submitButton).not.toBeDisabled();
  });
});
```

### 📊 学習成果

**技術的メリット:**

1. **自動状態管理**: 手動でのsetStateが不要
2. **エラー削減**: 状態の更新忘れがない
3. **コードの簡潔性**: isLoading関連のボイラープレートが削除
4. **Server Actionとの完璧な連携**: フォームアクションの実行状態を自動追跡

**設計上のメリット:**

1. **責任分離**: SubmitButtonコンポーネントが状態表示に専念
2. **再利用性**: 他のフォームでも使い回し可能
3. **テスタビリティ**: モック化が容易で安定したテスト

### 🔄 今後の応用計画

**他コンポーネントへの適用:**

- ReplyFormコンポーネント
- ユーザー情報編集フォーム
- ログイン・新規登録フォーム

**拡張可能性:**

```typescript
// より詳細な状態管理
function AdvancedSubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  if (pending && method === 'POST') {
    return <Button disabled>作成中...</Button>;
  } else if (pending && method === 'PUT') {
    return <Button disabled>更新中...</Button>;
  }

  return <Button type="submit">送信</Button>;
}
```

### 📚 学習リソース

**参考資料:**

- [React useFormStatus Documentation](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Testing Server Actions](https://nextjs.org/docs/app/building-your-application/testing/jest)

**習得したスキル:**

- React 19の新機能活用
- モダンなフォーム状態管理パターン
- Server Actionとクライアントサイドの連携
- useFormStatusのテスト戦略

### ✨ 実装品質の向上

**Before vs After:**

| 項目         | Before                   | After                    |
| ------------ | ------------------------ | ------------------------ |
| 状態管理     | 手動（useState）         | 自動（useFormStatus）    |
| コード量     | 多い（ボイラープレート） | 少ない（必要最小限）     |
| エラー可能性 | 高い（更新忘れ等）       | 低い（自動管理）         |
| テスト複雑度 | 高い（非同期制御）       | 低い（シンプルなモック） |
| 保守性       | 低い（散らばった状態）   | 高い（責任分離）         |

この学習により、React 19の新機能を活用したモダンなフォーム開発手法を習得し、より保守しやすく安定したコードを書けるようになりました。

---

**学習完了日:** 2024年12月22日  
**実装時間:** 約1時間  
**テスト確認:** ✅ 全テストパス
