# 数告星官网模板

保留原官网布局、配色、动画和固定页面，统一电话、备案与文章接口。协议为 `standard-static-v1.1`，文件路径配置仍为 `version: 1`。源码不能直接作为上线产物，必须渲染占位符。

**兼容性：当前已部署主控 v1.2 尚不支持备案字段，直接构建此模板会因残留占位符失败。**
先补齐官网表单、内容 API、发布快照和构建器的 `icp_number` / `icp_url`，并校验 requiredCapabilities；本次仅改模板，没有修改或部署主控。

## 发布中心配置

- 模板源分支：`master`
- 历史发布分支：`publish`（新 Agent 流程不依赖该分支）
- 模板目录：`.`
- 模板配置：`publisher.config.json`
- 文章详情模板：`templates/article.html`
- 文章卡片模板：`templates/article-card.html`
- `assets/site.css`：文章详情页与官网共同使用的样式文件。
- `index.html`、`news/index.html`：均包含 `{{article_cards}}` 占位符，发布中心会用已发布文章自动替换其中的资讯卡片。

文章详情页、文章列表、首页资讯区和 `sitemap.xml` 均由发布中心在发布任务中生成。因此请保留上述文件路径和文章占位符；不要直接修改 `publish` 分支。

## 新主控流程

1. 将选定版本放入 `/opt/sitecontrol/customer-templates/shugaoxing/`，不带 Git、凭据和测试产物。
2. 从容器路径 `/imports/shugaoxing` 导入，绑定客户网站，确认电话/域名/备案信息。
3. 预览后发布，由 OSS + Agent 分发到客户服务器；GitHub 只是可选源码备份。

`templates/site.defaults.json` 仅供首次接入确认，不会自动写入数据库，模板升级不得覆盖客户已有数据。
电话使用 `contact_phone` / `contact_phone_url`，备案使用 `icp_number` / `icp_url`。
固定介绍仍在 HTML 中，不代表全站可视化编辑。当前主控列表无分页，分类/封面/标签尚未完整接通。

验收（PowerShell，使用已安装依赖的主控源码）：

```powershell
$env:PUBLISHER_ROOT = 'D:\Documents\网站cms架构设计\统一网站管理平台'
node --test scripts/template.test.mjs
```

测试在临时副本中注入经过校验的备案字段，然后调用真实主控构建器；这是验收适配，不是线上 v1.2 已具备该能力。
规范见 [模板接入规范](docs/模板接入规范.md)，服务器要求见 [客户服务器接入说明](docs/客户服务器接入说明.md)。
