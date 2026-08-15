# 药品 · 疾病查询（TypeScript / Vercel）

这是给 Vercel 部署的在线版，和旁边的 `site` 离线 HTML 版分开。浏览器不再下载 26MB 目录，检索和详情都在服务端完成；LLM 走同一套 JSON API。

## 1. 准备数据（在有 `data/drugs.db` 的这台电脑上）

```bash
cd D:\Desktop\药品
python export_web.py
```

会生成 `ts-web/public/data/`（gzip 分片，部署时一起上传）。

## 2. 本地运行

```bash
cd ts-web
copy .env.example .env.local
npm install
npm run dev
```

打开 http://localhost:3000 ，用 `.env.local` 里的账号登录。

## 3. Vercel 环境变量（Settings → Environment Variables）

| 变量 | 用途 |
| --- | --- |
| `AUTH_USERNAME` | 网页登录账号 |
| `AUTH_PASSWORD` | 网页登录密码 |
| `AUTH_SECRET` | 至少 16 位随机串，用来签发登录 Cookie |
| `API_KEY` | LLM / 程序调用 API 的密钥 |

不要把账号密码写进代码或 Git。

## 4. 部署

数据文件大约几十到一百多 MB，**建议在本机用 CLI 部署**（会带上 `public/data`）：

```bash
cd ts-web
npx vercel --prod
```

如果只推 GitHub 再让 Vercel 构建，仓库里没有 `public/data`，网站会起不来。除非你另行把数据放到可访问的 CDN，并设置 `DATA_BASE_URL`。

## 5. LLM API

鉴权：`Authorization: Bearer $API_KEY` 或 Header `x-api-key`。

说明文档：`GET /api/v1/openapi`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/search?q=阿司匹林&scope=all` | 综合检索，`scope=drug\|wiki\|all` |
| GET | `/api/v1/suggest?q=阿司` | 联想 |
| GET | `/api/v1/drugs/{id}` | 说明书结构化正文（无 HTML） |
| GET | `/api/v1/generics/{name}` | 某通用名下的文号/厂家 |
| GET | `/api/v1/diseases/{name}` | 疾病百科（高血压/高血压病会对齐） |
| GET | `/api/v1/drugs-for/{name}` | 该病在说明书里出现过的药品 |

示例：

```bash
curl -H "Authorization: Bearer $API_KEY" "https://你的域名/api/v1/diseases/高血压病"
```

给 LLM 的工具描述可以直接喂 `/api/v1/openapi` 的 JSON。
