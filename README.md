# ルリアのぽけっと手帳 – グランブルーファンタジー 所持チェッカー

GBF Wiki（https://gbf.wiki/）からキャラクター・召喚石・武器のデータを取得し、  
ユーザーが所持状況を管理できる Web アプリです。

---

## 技術スタック

| 分類 | 採用技術 | 理由 |
|------|----------|------|
| フレームワーク | [Next.js 16](https://nextjs.org/) (App Router) | SSR/SSG・API Routes を一体化できるフルスタック構成 |
| 言語 | TypeScript | 型安全性・補完による開発効率向上 |
| データベース | SQLite (開発) / PostgreSQL (本番) | ローカル開発は設定不要の SQLite、本番は Supabase 等の PostgreSQL |
| ORM | [Prisma 7](https://www.prisma.io/) | 型安全なクエリ・マイグレーション管理 |
| 認証 | [NextAuth.js v5](https://authjs.dev/) | Credentials / OAuth 両対応・セッション管理が容易 |
| スタイル | [Tailwind CSS v4](https://tailwindcss.com/) | ユーティリティクラスで素早く UI 構築 |
| データ取得 | GBF Wiki MediaWiki API（Cargo 拡張） | 英語名・日本語名の構造化データを取得可能 |

---

## 取得できる情報

### キャラクター（特に SSR）
- 英語名 / 日本語名
- 画像
- 属性（Fire / Water / Earth / Wind / Light / Dark）
- 得意武器種
- カテゴリ（リミテッド・水着・バレンタイン など）
- 実装時期・ガチャ種類（グランデ・レジェフェス など）
- スキル名・サポアビ名

### 召喚石
- 英語名 / 日本語名
- 画像
- 属性・カテゴリ
- メイン加護・サブ加護

### 武器
- 英語名 / 日本語名
- 画像
- 武器種・属性・カテゴリ
- スキル（複数）

---

## セットアップ

### 前提条件
- Node.js 18 以上
- npm 9 以上

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/spencomeister/gbf-checker.git
cd gbf-checker

# 2. 依存関係インストール
npm install

# 3. 環境変数を設定
cp .env.example .env
# .env の AUTH_SECRET を強いランダム値に変更してください
# openssl rand -base64 32

# 4. データベースのマイグレーション
npm run db:migrate

# 5. GBF Wiki からデータを取得（インターネット接続が必要）
npm run fetch:wiki          # 全データ取得
npm run fetch:characters    # キャラクターのみ
npm run fetch:summons       # 召喚石のみ
npm run fetch:weapons       # 武器のみ

# 6. 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

---

## 機能

### データ閲覧
- `/characters` – キャラクター一覧（属性・武器種・カテゴリでフィルタ、ページネーション）
- `/summons` – 召喚石一覧（属性・カテゴリでフィルタ）
- `/weapons` – 武器一覧（属性・武器種・カテゴリでフィルタ）

### ユーザー機能
- `/auth/signup` – アカウント作成
- `/auth/signin` – ログイン
- `/dashboard` – 所持アイテム一覧・管理

### API エンドポイント
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/characters` | キャラクター一覧（フィルタ・ページネーション） |
| GET | `/api/summons` | 召喚石一覧 |
| GET | `/api/weapons` | 武器一覧 |
| POST | `/api/fetch-wiki?target=all` | Wiki データ取得・DB保存（バッチ用） |
| POST | `/api/auth/register` | ユーザー登録 |
| GET | `/api/user/inventory` | 所持アイテム一覧（要認証） |
| POST | `/api/user/inventory` | 所持アイテム追加（要認証） |
| DELETE | `/api/user/inventory` | 所持アイテム削除（要認証） |

---

## GBF Wiki API について

GBF Wiki は [MediaWiki](https://www.mediawiki.org/) + [Cargo 拡張](https://www.mediawiki.org/wiki/Extension:Cargo) を使用しており、  
`api.php` を通じて英語名・日本語名を含む構造化データにアクセスできます。

```
GET https://gbf.wiki/api.php
  ?action=cargoquery
  &tables=characters
  &fields=name,name__full,element,weapon,rarity,type,image,release_date,obtain,skills,support_skills
  &where=rarity="SSR"
  &limit=500
  &format=json
```

**利点:**
- 定期的に更新されており、最新の実装キャラクターも取得できる
- 英語名（`name`）と日本語名（`name__full`）を同時取得可能
- カテゴリ・スキルなどの構造化データが利用可能

**注意点:**
- API の利用は GBF Wiki の利用規約に従うこと
- 過度なリクエストは避け、取得後は DB にキャッシュすること（本アプリでは upsert で対応）
- テーブルスキーマが変更された場合、取得スクリプトの修正が必要

---

## 本番環境への展開

### Vercel + Supabase（推奨）

```bash
# 環境変数（Vercel ダッシュボードで設定）
DATABASE_URL=postgresql://...  # Supabase の接続文字列
AUTH_SECRET=...                # openssl rand -base64 32

# Prisma マイグレーション（PostgreSQL 用に provider を変更）
# prisma/schema.prisma の provider = "postgresql" に変更後:
npx prisma migrate deploy
```

### データ更新（Cron Job）
```bash
# Vercel Cron / GitHub Actions などで定期実行
POST https://your-app.vercel.app/api/fetch-wiki?target=all
```

---

## データモデル

```
Character (キャラクター)
  id, name, nameJp, rarity, element, weapon, category,
  imageUrl, releaseDate, obtain, skills(JSON), abilities(JSON)

Summon (召喚石)
  id, name, nameJp, element, category, imageUrl, mainAura, subAura

Weapon (武器)
  id, name, nameJp, element, weaponType, category,
  imageUrl, skills(JSON), obtain

User (ユーザー)
  id, name, email, password(ハッシュ化)

UserInventory (所持管理)
  id, userId, itemType(character|summon|weapon), itemId,
  quantity(個数), uncap(上限解放数)
```

---

## ライセンス

MIT

GBF のゲームデータは Cygames の著作物です。  
データ出典: [Granblue Fantasy Wiki](https://gbf.wiki/)
