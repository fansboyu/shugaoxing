import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.PUBLISHER_ROOT) throw Error('请设置 PUBLISHER_ROOT 为已安装依赖的主控源码目录');
const { buildWebsite } = await import(pathToFileURL(join(process.env.PUBLISHER_ROOT, 'pilot/templates.mjs')));
const defaults = JSON.parse(await fs.readFile(join(root, 'templates/site.defaults.json'), 'utf8'));
const site = { ...defaults, title: '让企业在 AI 答案中被准确理解与推荐', intro: '原官网固定介绍不被这个字段覆盖' };
const articles = ['p1', 'p2'].map((id, i) => ({ id, title: `测试观点 ${i + 1}`, summary: '验证文章卡片与正文链接', body: '这是验收文章，不会写入正式客户数据库。', format: 'text', updated: '2026-10-17T08:00:00.000Z' }));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 验收适配层：只在临时副本注入新字段，其余生成由真实 v1.2 buildWebsite 执行。
// 这不是生产导入器，不能作为“线上已实现 icp-fields”的证明。
async function render(nextSite = site, items = articles) {
  assert.match(nextSite.phone, /^\+?\d{5,20}$/);
  assert.ok(nextSite.icp_number.trim(), '备案号必填');
  assert.equal(nextSite.icp_url, 'https://beian.miit.gov.cn/');
  const folder = await fs.mkdtemp(join(tmpdir(), 'shugaoxing-template-test-'));
  try {
    for (const name of ['assets', 'templates', 'news', 'index.html', 'publisher.config.json'])
      await fs.cp(join(root, name), join(folder, name), { recursive: true });
    async function inject(dir) {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) await inject(path);
        else if (entry.name.endsWith('.html')) {
          const input = await fs.readFile(path, 'utf8');
          await fs.writeFile(path, input.replaceAll('{{icp_number}}', esc(nextSite.icp_number)).replaceAll('{{icp_url}}', esc(nextSite.icp_url)));
        }
      }
    }
    await inject(folder);
    return await buildWebsite({ site: nextSite, articles: items }, { source_path: folder });
  } finally {
    await fs.rm(folder, { recursive: true, force: true });
  }
}

test('所有完整页面具有电话和备案字段，配置声明新能力', async () => {
  const config = JSON.parse(await fs.readFile(join(root, 'publisher.config.json'), 'utf8'));
  assert.equal(config.protocol, 'standard-static-v1.1');
  assert.ok(config.requiredCapabilities.includes('icp-fields'));
  for (const name of ['index.html', 'news/index.html', 'templates/article.html']) {
    const html = await fs.readFile(join(root, name), 'utf8');
    for (const token of ['contact_phone', 'contact_phone_url', 'icp_number', 'icp_url']) assert.ok(html.includes(`{{${token}}}`), `${name}: ${token}`);
    assert.ok(!html.includes('18621265069') && !html.includes('186 2126 5069'));
    assert.match(html, /<footer class="site-footer">[\s\S]*href="\{\{icp_url\}\}"[\s\S]*\{\{icp_number\}\}/);
  }
});

test('空文章可构建完整首页/列表，原页面文案保留', async () => {
  const files = await render(site, []);
  assert.ok(files.has('index.html') && files.has('news/index.html'));
  assert.ok(![...files.keys()].some(p => p.startsWith('news/p')));
  const home = files.get('index.html').toString();
  assert.ok(home.includes('从搜索曝光到 AI 答案'));
  assert.ok(home.includes('把流量变成业务承接'));
  assert.doesNotMatch(home, /\{\{[a-z_]+\}\}/);
});

test('两篇文章、相对链接、每页备案和 JSON-LD 均正确', async () => {
  const files = await render();
  assert.ok(files.has('news/p1/index.html') && files.has('news/p2/index.html'));
  assert.ok(files.get('news/index.html').toString().includes('href="p1/"'));
  for (const [name, bytes] of files) {
    if (!name.endsWith('.html')) continue;
    const html = bytes.toString();
    assert.doesNotMatch(html, /\{\{[a-z_]+\}\}/, name);
    assert.ok(html.includes(`href="${site.icp_url}"`) && html.includes(site.icp_number), name);
    assert.ok(html.includes(`href="tel:${site.phone}"`), name);
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  }
  assert.ok(files.get('news/p1/index.html').toString().includes('行业洞察'));
  assert.ok(files.get('sitemap.xml').toString().includes('https://www.shugaoxing.com/news/p1/'));
});

test('后台换电话/备案后全站同步，无旧号码残留', async () => {
  const next = { ...site, phone: '13400617908', icp_number: '验收用备案号-2' };
  const files = await render(next);
  for (const [name, bytes] of files) {
    if (!name.endsWith('.html')) continue;
    const html = bytes.toString();
    assert.ok(html.includes('tel:13400617908') && html.includes(next.icp_number), name);
    assert.ok(!html.includes(site.phone) && !html.includes(site.icp_number), name);
  }
  const schema = JSON.parse(files.get('index.html').toString().match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.telephone, next.phone);
});

test('资源逐字节保留，模板源/初始化数据不会进入发布产物', async () => {
  const files = await render();
  async function check(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await check(path);
      else assert.deepEqual(files.get(relative(root, path).replaceAll('\\', '/')), await fs.readFile(path));
    }
  }
  await check(join(root, 'assets'));
  assert.ok(![...files.keys()].some(p => p.startsWith('templates/') || p.startsWith('scripts/') || p === 'publisher.config.json'));
});

test('无效电话、空备案号和非工信部链接禁止渲染', async () => {
  await assert.rejects(render({ ...site, phone: '\"</script>' }));
  await assert.rejects(render({ ...site, icp_number: '' }));
  await assert.rejects(render({ ...site, icp_url: 'https://example.com/' }));
});

test('兼容性门禁：旧版构建器直接使用新模板必须失败', async () => {
  await assert.rejects(buildWebsite({ site, articles }, { source_path: root }), /残留占位符/);
});
