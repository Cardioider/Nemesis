// ============================================================
//   GitHub 智能安全清理单向关注脚
//   运行环境：浏览器 F12 控制台 (Console)
//   作者说明：基于 GitHub REST API + 个人访问令牌 (PAT)
// ============================================================

async function safeAutoUnfollow() {
  console.clear();

  // ── 样式封装（让输出更易读）─────────────────────────────────
  const log = {
    title : (msg) => console.log(`%c${msg}`, "color:#58a6ff;font-size:14px;font-weight:bold;"),
    info  : (msg) => console.log(`%c${msg}`, "color:#8b949e;"),
    ok    : (msg) => console.log(`%c${msg}`, "color:#3fb950;font-weight:bold;"),
    warn  : (msg) => console.warn(msg),
    error : (msg) => console.error(msg),
    shield: (msg) => console.log(`%c${msg}`, "color:#d29922;"),
    step  : (msg) => console.log(`%c${msg}`, "color:#bc8cff;font-weight:bold;"),
  };

  log.title("╔════════════════════════════════════════════╗");
  log.title("║   GitHub 智能单向关注清理脚本 v2.0 启动中  ║");
  log.title("╚════════════════════════════════════════════╝");

  // ════════════════════════════════════════════════════════════
  //  ★ 【第一步】在这里配置你的信息
  // ════════════════════════════════════════════════════════════

  // ── 核心白名单（直接在此处编辑，大小写不敏感）─────────────
  // 无论这些用户是否回关你，脚本都绝对不会取消关注他们。
const CORE_WHITE_LIST = [
    // ↓↓↓ 在这两行之间添加你想永久保护的用户名 ↓↓↓
    "sindresorhus",
    // ↑↑↑ 示例大 V，请按需保留或删除 ↑↑↑
  ];

  // ── 操作模式 ───────────────────────────────────────────────
  // DRY_RUN = true  → 只分析，只打印名单，不真正取消关注（强烈建议首次运行使用！）
  // DRY_RUN = false → 正式执行取消关注
  const DRY_RUN = true;

  // ── 延迟配置（毫秒） ───────────────────────────────────────
  const DELAY_MIN_MS = 2000; // 最短等待时间
  const DELAY_MAX_MS = 5000; // 最长等待时间
  const PAGE_DELAY_MS = 800; // 翻页间隔

  // ════════════════════════════════════════════════════════════
  //  ★ 【第二步】运行时输入 Token 和用户名
  // ════════════════════════════════════════════════════════════

  let token = prompt("📌 步骤 1/3：请粘贴你的 GitHub PAT Token（以 ghp_ 或 github_pat_ 开头）:");
  if (!token || token.trim() === "") {
    return log.error("❌ 已取消：必须提供有效的 Token 才能运行！");
  }
  token = token.trim();

  // 简单校验 token 格式
  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    const proceed = confirm("⚠️ Token 格式看起来不标准（应以 ghp_ 或 github_pat_ 开头），是否继续？");
    if (!proceed) return log.warn("操作已中止。");
  }

  const username = prompt("📌 步骤 2/3：请输入你的 GitHub 用户名（注意区分大小写）:");
  if (!username || username.trim() === "") {
    return log.error("❌ 已取消：必须提供用户名！");
  }
  const myUsername = username.trim();

  // 运行时追加额外白名单
  const extraInput = prompt(
    "📌 步骤 3/3：临时追加白名单用户？\n（多个用逗号 ',' 分隔；无需追加请直接回车）:",
    ""
  );

  // ════════════════════════════════════════════════════════════
  //  合并白名单（去重 + 统一小写）
  // ════════════════════════════════════════════════════════════
  const combinedRaw = [...CORE_WHITE_LIST];
  if (extraInput && extraInput.trim() !== "") {
    combinedRaw.push(...extraInput.split(","));
  }
  const whiteList = new Set(combinedRaw.map((s) => s.trim().toLowerCase()).filter(Boolean));

  log.ok(`\n🛡️  白名单加载完毕，共保护 ${whiteList.size} 个账号。`);
  if (DRY_RUN) {
    log.warn("⚠️  【演习模式 DRY_RUN=true】本次只分析，不会真正取消关注任何人。");
  }
  log.info(`📡  开始扫描 [${myUsername}] 的关注数据，请勿关闭页面...\n`);

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  // ════════════════════════════════════════════════════════════
  //  工具函数：分页获取完整列表
  // ════════════════════════════════════════════════════════════
  async function fetchAllPages(endpoint, label) {
    const list = [];
    let page = 1;
    while (true) {
      log.info(`  🔄 正在拉取 [${label}] 第 ${page} 页...`);
      const url = `https://api.github.com/users/${myUsername}/${endpoint}?per_page=100&page=${page}`;
      const res = await fetch(url, { headers });

      // 速率限制检查
      const remaining = parseInt(res.headers.get("x-ratelimit-remaining") || "999", 10);
      const resetAt   = parseInt(res.headers.get("x-ratelimit-reset") || "0", 10);
      if (remaining < 15) {
        const waitSec = Math.max(resetAt - Math.floor(Date.now() / 1000), 0);
        throw new Error(
          `⚠️  GitHub API 额度即将耗尽（剩余 ${remaining} 次）。` +
          `预计在 ${Math.ceil(waitSec / 60)} 分钟后重置，请稍后再试。`
        );
      }

      if (res.status === 401) throw new Error("🔑 Token 无效或已过期，请重新生成 PAT。");
      if (res.status === 403) throw new Error("🚫 无访问权限，请检查 PAT 的 Scope 是否包含 user:follow。");
      if (res.status === 404) throw new Error(`❓ 找不到用户 [${myUsername}]，请检查用户名拼写。`);
      if (!res.ok) throw new Error(`API 异常: HTTP ${res.status} ${res.statusText}`);

      const data = await res.json();
      if (data.length === 0) break; // 没有更多数据，退出循环

      list.push(...data);
      log.info(`     ✔ 已获取 ${list.length} 条记录...`);
      page++;

      // 翻页小延迟，避免触发防刷机制
      await sleep(PAGE_DELAY_MS);
    }
    return list;
  }

  // ════════════════════════════════════════════════════════════
  //  工具函数：随机延迟
  // ════════════════════════════════════════════════════════════
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function randomDelay() {
    return Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1) + DELAY_MIN_MS);
  }

  // ════════════════════════════════════════════════════════════
  //  主逻辑
  // ════════════════════════════════════════════════════════════
  try {
    // ── Step 1: 获取数据 ───────────────────────────────────────
    log.step("\n【步骤 1/4】正在获取你的「关注列表」(Following)...");
    const following = await fetchAllPages("following", "Following");
    log.ok(`  ✅ 关注列表获取完毕，共 ${following.length} 人。`);

    log.step("\n【步骤 2/4】正在获取你的「粉丝列表」(Followers)...");
    const followers = await fetchAllPages("followers", "Followers");
    log.ok(`  ✅ 粉丝列表获取完毕，共 ${followers.length} 人。`);

    // ── Step 2: 对比 ────────────────────────────────────────────
    log.step("\n【步骤 3/4】正在分析单向关注数据...");

    const followerSet = new Set(followers.map((u) => u.login.toLowerCase()));
    const nonMutuals  = following.filter((u) => !followerSet.has(u.login.toLowerCase()));

    // ── Step 3: 过滤白名单 ─────────────────────────────────────
    const protectedUsers = [];
    const toUnfollow     = [];

    for (const user of nonMutuals) {
      const loginLower = user.login.toLowerCase();
      if (whiteList.has(loginLower)) {
        protectedUsers.push(user.login);
        log.shield(`  🛡️  白名单保护，跳过: ${user.login}`);
      } else {
        toUnfollow.push(user);
      }
    }

    // ── Step 4: 生成分析报告 ───────────────────────────────────
    console.log("\n");
    log.title("╔═══════════════════════ 📊 分析报告 ═══════════════════════╗");
    log.info (`  📌 你的用户名   : ${myUsername}`);
    log.info (`  ➡️  你的关注数   : ${following.length} 人`);
    log.info (`  ⬅️  你的粉丝数   : ${followers.length} 人`);
    log.warn (`  ❓ 单向关注     : ${nonMutuals.length} 人（你关注他/她，但他/她没关注你）`);
    log.shield(`  🛡️  白名单赦免   : ${protectedUsers.length} 人`);
    log.error (`  🗑️  最终待清理   : ${toUnfollow.length} 人`);
    log.title("╚════════════════════════════════════════════════════════════╝\n");

    if (toUnfollow.length === 0) {
      return alert("🎉 你的关注列表非常干净，没有需要清理的用户！");
    }

    // ── 打印待取消关注的完整名单 ───────────────────────────────
    log.step("【步骤 4/4】以下是即将被取消关注的完整名单（请仔细核查）：\n");
    console.table(
      toUnfollow.map((u, i) => ({
        "#"               : i + 1,
        "用户名"          : u.login,
        "主页（双击可打开）": u.html_url,
        "账号类型"        : u.type === "Organization" ? "🏢 组织" : "👤 个人",
      }))
    );

    if (DRY_RUN) {
      log.warn("\n⚠️  【演习模式】分析已完成，不执行真正的取消关注操作。");
      log.warn("   如需正式执行，请将脚本顶部的 DRY_RUN 改为 false，然后重新运行。");
      return;
    }

    // ── 最终安全确认（倒计时 + 手动输入 yes）─────────────────
    const minMin = (toUnfollow.length * DELAY_MIN_MS / 1000 / 60).toFixed(1);
    const maxMin = (toUnfollow.length * DELAY_MAX_MS / 1000 / 60).toFixed(1);

    log.warn(`\n⚠️  即将在 5 秒后显示最终确认框，请做好准备...`);
    for (let i = 5; i >= 1; i--) {
      await sleep(1000);
      log.warn(`   倒计时：${i} 秒...`);
    }

    const confirmMsg =
      `⚠️  【最终确认】即将取消关注 ${toUnfollow.length} 人。\n\n` +
      `📋 请先查看控制台中打印的「名单表格」确认无误。\n` +
      `⏱️  预计耗时：${minMin} ~ ${maxMin} 分钟\n` +
      `🛡️  防滥用策略：每次操作随机延迟 ${DELAY_MIN_MS/1000}~${DELAY_MAX_MS/1000} 秒\n\n` +
      `❗ 确认执行请输入：  yes\n（输入其他任何内容均视为取消）`;

    const userConfirm = prompt(confirmMsg);
    if (userConfirm !== "yes") {
      return log.warn("⏹️  操作已取消。未修改任何关注关系。");
    }

    // ── 正式执行取消关注 ───────────────────────────────────────
    log.title("\n🚀 开始执行清理任务...\n");

    let successCount = 0;
    let failCount    = 0;
    const failedUsers = [];

    for (let i = 0; i < toUnfollow.length; i++) {
      const user  = toUnfollow[i];
      const delay = randomDelay();
      const pct   = (((i + 1) / toUnfollow.length) * 100).toFixed(1);

      log.info(`⏳ [${i + 1}/${toUnfollow.length}] (${pct}%)  等待 ${(delay/1000).toFixed(1)} 秒后取消关注: ${user.login}`);
      await sleep(delay);

      const res = await fetch(`https://api.github.com/user/following/${user.login}`, {
        method: "DELETE",
        headers,
      });

      if (res.status === 204) {
        successCount++;
        log.ok(`  ✅ 已成功取消关注: ${user.login}`);
      } else {
        failCount++;
        failedUsers.push(user.login);
        log.error(`  ❌ 取消关注失败: ${user.login}（HTTP ${res.status}）`);

        // 触发速率限制或滥用检测，安全中止
        if (res.status === 403 || res.status === 429) {
          const retryAfter = res.headers.get("retry-after") || "未知";
          log.error(`\n🚨 触发 GitHub API 速率限制或滥用检测保护！脚本已安全停止。`);
          log.error(`   Retry-After: ${retryAfter} 秒`);
          log.error(`   ✅ 本次已成功取消关注 ${successCount} 人`);
          log.error(`   ❌ 尚有 ${toUnfollow.length - i} 人未处理，请等待后重新运行脚本。`);
          alert(`🚨 触发速率限制！脚本已停止。\n\n已处理 ${successCount} 人，剩余 ${toUnfollow.length - i} 人未完成。\n请等待一段时间后重新运行。`);
          return;
        }
      }
    }

    // ── 最终汇报 ────────────────────────────────────────────────
    console.log("\n");
    log.title("╔═══════════════════════ 🎉 任务完成 ═══════════════════════╗");
    log.ok   (`  ✅ 成功取消关注: ${successCount} 人`);
    if (failCount > 0) {
      log.error(`  ❌ 失败: ${failCount} 人 → ${failedUsers.join(", ")}`);
    }
    log.title("╚════════════════════════════════════════════════════════════╝");
    alert(`🎉 清理任务完成！\n✅ 成功: ${successCount} 人\n❌ 失败: ${failCount} 人`);

  } catch (err) {
    log.error(`\n❌ 运行时错误: ${err.message}`);
    console.error(err);
    alert(`❌ 发生错误:\n${err.message}\n\n请查看控制台 (F12) 了解详细信息。`);
  }
}

// ════════════════════════════════════════════════════════════
//  启动脚本
// ════════════════════════════════════════════════════════════
safeAutoUnfollow();
