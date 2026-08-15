export function buildOpenApi(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "药品 · 疾病查询 API",
      version: "1.0.0",
      description:
        "供 LLM / 程序调用的离线医学检索接口。所有接口需要 Header: Authorization: Bearer $API_KEY，或已登录网页会话。数据仅供学习参考，不能替代医师或药师指导。",
    },
    servers: [{ url: origin }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
    paths: {
      "/api/v1/search": {
        get: {
          summary: "综合检索药品或疾病",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" }, description: "关键词，可空格分词" },
            { name: "scope", in: "query", schema: { type: "string", enum: ["all", "drug", "wiki"] } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "size", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
            { name: "class", in: "query", schema: { type: "string" }, description: "药品分类，仅 scope=drug" },
            { name: "nature", in: "query", schema: { type: "string" }, description: "药品性质，仅 scope=drug" },
            { name: "dept", in: "query", schema: { type: "string" }, description: "疾病科室，仅 scope=wiki" },
          ],
        },
      },
      "/api/v1/suggest": {
        get: {
          summary: "输入联想",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" } },
            { name: "mode", in: "query", schema: { type: "string", enum: ["home", "drug", "wiki"] } },
          ],
        },
      },
      "/api/v1/drugs/{id}": {
        get: {
          summary: "按说明书 id 取结构化正文",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        },
      },
      "/api/v1/generics/{name}": {
        get: {
          summary: "按通用名列出批准文号 / 厂家 / 规格",
          parameters: [{ name: "name", in: "path", required: true, schema: { type: "string" } }],
        },
      },
      "/api/v1/diseases/{name}": {
        get: {
          summary: "疾病百科。高血压 / 高血压病会自动对齐。找不到百科时返回相关药品通用名。",
          parameters: [{ name: "name", in: "path", required: true, schema: { type: "string" } }],
        },
      },
      "/api/v1/drugs-for/{name}": {
        get: {
          summary: "某疾病在说明书库中标注过的相关药品",
          parameters: [{ name: "name", in: "path", required: true, schema: { type: "string" } }],
        },
      },
    },
  };
}
