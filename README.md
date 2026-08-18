# 数告星官网模板

这是“上海数告星网络科技有限公司”的静态官网源模板，适配当前统一静态发布中心的 `standard-static-v1` 通用模板协议。

## 发布中心配置

- 模板源分支：`master`
- 正式发布分支：`publish`
- 模板目录：`.`
- 模板配置：`publisher.config.json`
- 文章详情模板：`templates/article.html`
- 文章卡片模板：`templates/article-card.html`
- `assets/site.css`：文章详情页与官网共同使用的样式文件。
- `index.html`、`news/index.html`：均包含 `{{article_cards}}` 占位符，发布中心会用已发布文章自动替换其中的资讯卡片。

文章详情页、文章列表、首页资讯区和 `sitemap.xml` 均由发布中心在发布任务中生成。因此请保留上述文件路径和文章占位符；不要直接修改 `publish` 分支。
