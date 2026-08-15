# 药品 · 疾病查询（TypeScript / Vercel）

在线版检索站（与旁边的 `site` 离线 HTML 分开）。浏览器不下载整库；检索与详情在服务端完成。LLM / 脚本走同一套 `/api/v1` JSON API。

## 1. 导出语料

```powershell
cd D:\Desktop\药品
python export_web.py
```

会写入 `ts-web/public/data/`（含 `meta.json`、gzip 目录与分片）。`npm run build` 会先跑 `scripts/check-data.mjs`；本地缺文件且未设 `DATA_BASE_URL` 时构建失败。

## 2. 本地运行

```powershell
cd ts-web
copy .env.example .env.local
npm install
npm run dev
```

打开 http://localhost:3000 。

## 3. 环境变量（Vercel → Settings → Environment Variables，勾选 Production）

| 变量 | 说明 |
|---|---|
| `AUTH_USERNAME` | 网页登录账号 |
| `AUTH_PASSWORD` 或 `AUTH_PASSWORD_HASH` | 明文密码，或 `node scripts/hash-password.mjs "密码"` 生成的 `scrypt$…` |
| `AUTH_SECRET` | ≥16 位随机串，签发会话 Cookie |
| `API_KEY` | LLM / 程序调用 Bearer Token |
| `DATA_BASE_URL` | 可选。语料在 CDN 时的根 URL（不要指向本站 `/data`，该路径已禁止公开下载） |
| `DATA_FETCH_TOKEN` | 可选。拉取 CDN 语料时的 Bearer |

## 4. 部署

优先本机上传（含 `public/data`）：

```powershell
npx vercel --prod
```

若只推 GitHub 再由 Vercel 构建，仓库必须包含 `public/data`，否则构建被 `check-data` 拦住（除非配置了 `DATA_BASE_URL`）。

## 5. 安全说明

- `/data/*` 对浏览器返回 403；语料只由服务端读盘（或 `DATA_BASE_URL`）。
- 登录有 Origin 校验与简易限流；联想接口也有限流。
- 会话 Cookie：HttpOnly、SameSite=Lax、生产环境 Secure，约 14 天。
- 「退出」仅 POST，避免 Link 预取误清 Cookie。

## 6. API

登录后打开 `/docs`，或请求 `/api/v1/openapi`。调用示例：

```http
Authorization: Bearer $API_KEY
GET /api/v1/search?q=阿莫西林&scope=drug
```
