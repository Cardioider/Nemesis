// ============================================================
//   GitHub 智能安全清理单向关注脚本 · 增强版 v2.1
//   运行环境：浏览器 F12 控制台 (Console)
//   作者说明：基于 GitHub REST API + 个人访问令牌 (PAT)
// ============================================================

async function safeAutoUnfollow() {
  console.clear();

  // ── 样式封装（让输出更易读）─────────────────────────────────
  // [问题9] 增加日志等级控制
  // 可选值: "DEBUG" | "INFO" | "WARN" | "ERROR"
  // "DEBUG" 输出最详细信息，"INFO" 为默认，"ERROR" 只输出错误
  const LOG_LEVEL = "INFO";
  const _LL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  const _lv = _LL[LOG_LEVEL] ?? 1;

  const log = {
    debug : (msg) => { if (_lv <= 0) console.log(`%c[DEBUG] ${msg}`, "color:#484f58;"); },
    title : (msg) => console.log(`%c${msg}`, "color:#58a6ff;font-size:14px;font-weight:bold;"),
    info  : (msg) => { if (_lv <= 1) console.log(`%c${msg}`, "color:#8b949e;"); },
    ok    : (msg) => { if (_lv <= 1) console.log(`%c${msg}`, "color:#3fb950;font-weight:bold;"); },
    warn  : (msg) => { if (_lv <= 2) console.warn(msg); },
    error : (msg) => console.error(msg),
    shield: (msg) => { if (_lv <= 1) console.log(`%c${msg}`, "color:#d29922;"); },
    step  : (msg) => { if (_lv <= 1) console.log(`%c${msg}`, "color:#bc8cff;font-weight:bold;"); },
  };

  log.title("╔════════════════════════════════════════════╗");
  log.title("║   GitHub 智能单向关注清理脚本 v2.1 启动中  ║");
  log.title("╚════════════════════════════════════════════╝");

  // ════════════════════════════════════════════════════════════
  //  ★ 【第一步】在这里配置你的信息
  // ════════════════════════════════════════════════════════════

  // ── 核心白名单（直接在此处编辑，大小写不敏感）─────────────
  // 无论这些用户是否回关你，脚本都绝对不会取消关注他们。
const CORE_WHITE_LIST = [
    // ↓↓↓ 在这两行之间添加你想永久保护的用户名 ↓↓↓
    "sindresorhus",
    "torvalds",
    "ruanyf",
    "yyx990803",
    "antfu",
    "gaearon",
    "tj",
    "rauchg",
    "Rich-Harris",
    "posva",
    "sdras",
    "kentcdodds",
    "getify",
    "feross",
    "addyosmani",
    "paulirish",
    "mdo",
    "fat",
    "defunkt",
    "mojombo",
    "kennethreitz",
    "mitsuhiko",
    "tiangolo",
    "dhh",
    "taylorotwell",
    "fabpot",
    "kelvins",
    "jwasham",
    "donnemartin",
    "vinta",
    "kamranahmedse",
    "trekhleb",
    "koush",
    "gabrielfalcao",
    "FredKSchott",
    "akien-mga",
    "Dreamacro",
    "DIYgod",
    "jaywcjlove",
    "surmon-china",
    "phodal",
    "fouber",
    "sofish",
    "lifesinger",
    "alsotang",
    "dead-horse",
    "fengmk2",
    "atian25",
    "microsoft",
    "google",
    "facebook",
    "apple",
    "netflix",
    "airbnb",
    "twitter",
    "alibaba",
    "tencent",
    "baidu",
    "bytedance",
    "huawei",
    "xiaomi",
    "vuejs",
    "reactjs",
    "angular",
    "vercel",
    "nextjs",
    "nestjs",
    "expressjs",
    "fastify",
    "pytorch",
    "tensorflow",
    "huggingface",
    "openai",
    "deepmind",
    "ultralytics",
    "optuna",
    "karpathy",
    "ggerganov",
    "automattic",
    "electron",
    "atom",
    "docker",
    "kubernetes",
    "ansible",
    "hashicorp",
    "mitchellh",
    "clowwindy",
    "fatedier",
    "junegunn",
    "neovim",
    "vim",
    "rust-lang",
    "golang",
    "python",
    "nodejs",
    "denoland",
    "ry",
    "whatwg",
    "w3c",
    "linux",
    "git",
    "github",
    "labuladong",
    "azl397985856",
    "halfrost",
    "keon",
    "lemire",
    "skeeto",
    "MisterBooo",
    "youngyangyang04",
    "kdn251",
    "TheAlgorithms"
    // ↑↑↑ 示例大 V，请按需保留或删除 ↑↑↑
  ];

  // ── 操作模式 ───────────────────────────────────────────────
  // DRY_RUN = true  → 只分析，只打印名单，不真正取消关注（强烈建议首次运行使用！）
  // DRY_RUN = false → 正式执行取消关注
  const DRY_RUN = false;

  // ── 延迟配置（毫秒） ───────────────────────────────────────
  const DELAY_MIN_MS = 2000; // 最短等待时间
  const DELAY_MAX_MS = 5000; // 最长等待时间
  const PAGE_DELAY_MS = 800; // 翻页间隔

  // [问题5] DELETE 最大重试次数
  const MAX_RETRY = 3;

  // ════════════════════════════════════════════════════════════
  //  ★ 【第二步】运行时输入 Token
  // ════════════════════════════════════════════════════════════

  // [问题8] 移除了手动输入用户名的步骤，改由 GET /user 自动获取
  let token = prompt("📌 步骤 1/2：请粘贴你的 GitHub PAT Token（以 ghp_ 或 github_pat_ 开头）:");
  if (!token || token.trim() === "") {
    return log.error("❌ 已取消：必须提供有效的 Token 才能运行！");
  }
  token = token.trim();

  // 简单校验 token 格式
  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    const proceed = confirm("⚠️ Token 格式看起来不标准（应以 ghp_ 或 github_pat_ 开头），是否继续？");
    if (!proceed) return log.warn("操作已中止。");
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  // [问题4] AbortController：用于在用户关闭/刷新页面时中止所有飞行中的请求
  const controller = new AbortController();
  const signal = controller.signal;
  const abortOnUnload = () => controller.abort();
  window.addEventListener("beforeunload", abortOnUnload);

  // ════════════════════════════════════════════════════════════
  //  [问题2 + 问题8] 验证 Token 权限，并自动获取当前用户名
  // ════════════════════════════════════════════════════════════
  let myUsername;
  try {
    log.step("\n【启动验证】正在验证 Token 权限并自动获取用户名...");
    const meRes = await fetch("https://api.github.com/user", { headers, signal });

    if (meRes.status === 401) throw new Error("🔑 Token 无效或已过期，请重新生成 PAT。");
    if (!meRes.ok) throw new Error(`Token 验证请求失败: HTTP ${meRes.status} ${meRes.statusText}`);

    // [问题2] 读取并检查 X-OAuth-Scopes 响应头
    const scopesHeader = meRes.headers.get("X-OAuth-Scopes") || "";
    const scopes = scopesHeader.split(",").map(s => s.trim().toLowerCase());
    log.debug(`Token Scopes: ${scopesHeader || "（响应头中未返回，可能是 fine-grained token）"}`);

    // fine-grained PAT 不返回此 Header，仅对 classic token 进行检查
    if (scopesHeader && !scopes.includes("user:follow") && !scopes.includes("user")) {
      throw new Error(
        `Token 权限不足！\n` +
        `当前 Token 拥有的权限: [${scopesHeader}]\n` +
        `需要的权限: user:follow\n` +
        `请在 GitHub → Settings → Developer settings → Personal access tokens 中\n` +
        `重新生成 Token 并勾选 user → user:follow 权限。`
      );
    }

    // [问题8] 从响应体中直接提取用户名，无需手动输入
    const meData = await meRes.json();
    myUsername = meData.login;
    log.ok(`  ✅ Token 验证通过！自动获取到用户名: ${myUsername}`);
  } catch (err) {
    // [问题1] 验证失败时立即清理 Token
    token = null;
    headers.Authorization = "";
    window.removeEventListener("beforeunload", abortOnUnload);
    log.error(`\n❌ 启动验证失败: ${err.message}`);
    alert(`❌ 启动验证失败:\n${err.message}`);
    return;
  }

  // 运行时追加额外白名单
  const extraInput = prompt(
    "📌 步骤 2/2：临时追加白名单用户？\n（多个用逗号 ',' 分隔；无需追加请直接回车）:",
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

  // ════════════════════════════════════════════════════════════
  //  [问题3] Rate Limit 处理：自动等待重置而非直接抛出错误
  // ════════════════════════════════════════════════════════════
  async function handleRateLimit(res, context = "") {
    const remaining = parseInt(res.headers.get("x-ratelimit-remaining") || "999", 10);
    const resetAt   = parseInt(res.headers.get("x-ratelimit-reset") || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    const waitSec = Math.max(resetAt - now + 2, 0); // +2 秒缓冲

    if (remaining < 10 && waitSec > 0) {
      const waitMin = Math.ceil(waitSec / 60);
      log.warn(`\n⏸️  API 额度不足（剩余 ${remaining} 次）${context}，自动等待 ${waitMin} 分钟后继续...`);
      log.warn(`   预计恢复时间: ${new Date(resetAt * 1000).toLocaleTimeString()}`);
      await sleep(waitSec * 1000);
      log.ok(`  ✅ API 额度已重置，继续执行...`);
    }
    return remaining;
  }

  // ════════════════════════════════════════════════════════════
  //  工具函数：分页获取完整列表
  // ════════════════════════════════════════════════════════════
  async function fetchAllPages(endpoint, label) {
    const list = [];
    let page = 1;
    while (true) {
      log.info(`  🔄 正在拉取 [${label}] 第 ${page} 页...`);
      const url = `https://api.github.com/users/${myUsername}/${endpoint}?per_page=100&page=${page}`;
      const res = await fetch(url, { headers, signal }); // [问题4] 传入 signal

      // [问题3] 使用自动等待函数替代直接抛出错误
      await handleRateLimit(res, `（拉取 ${label} 第 ${page} 页时）`);

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
  //  [问题6 + 问题10] 导出文件工具函数
  // ════════════════════════════════════════════════════════════
  function downloadAsFile(content, filename, mimeType = "application/json") {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ════════════════════════════════════════════════════════════
  //  [问题5] DELETE 请求，带指数退避自动重试
  // ════════════════════════════════════════════════════════════
  async function unfollowWithRetry(userLogin) {
    for (let retry = 0; retry < MAX_RETRY; retry++) {
      if (signal.aborted) throw new DOMException("用户已中止操作", "AbortError");

      const res = await fetch(`https://api.github.com/user/following/${userLogin}`, {
        method: "DELETE",
        headers,
        signal, // [问题4]
      });

      if (res.status === 204) return true; // 成功

      // [问题3] 速率限制 → 自动等待后重试
      if (res.status === 429 || res.status === 403) {
        await handleRateLimit(res, `（取消关注 ${userLogin} 时）`);
        continue;
      }

      // 服务器错误 5xx → 指数退避后重试（2s, 4s, 8s）
      if (res.status >= 500 && retry < MAX_RETRY - 1) {
        const backoff = Math.pow(2, retry + 1) * 1000;
        log.warn(`  ⚠️  HTTP ${res.status}，${(backoff / 1000)}s 后进行第 ${retry + 2} 次重试...`);
        await sleep(backoff);
        continue;
      }

      // 其他错误直接失败，不再重试
      return false;
    }
    return false;
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

    // [问题10] 正式执行前自动导出完整名单 JSON，用于误操作后手动恢复
    if (!DRY_RUN) {
      const exportData = JSON.stringify(
        toUnfollow.map(u => ({ login: u.login, url: u.html_url, id: u.id, type: u.type })),
        null, 2
      );
      downloadAsFile(exportData, "to_unfollow.json");
      log.ok(`\n📥 已自动下载 to_unfollow.json（${toUnfollow.length} 人），可用于误操作后一键恢复关注。`);
    }

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
    // [问题6] failedUsers 改为存储完整对象，以便导出可用的 JSON
    const failedUsers = [];

    for (let i = 0; i < toUnfollow.length; i++) {
      // [问题4] 每次循环检查是否收到 abort 信号（如页面刷新/关闭）
      if (signal.aborted) {
        log.warn("\n⏹️  检测到中止信号（页面关闭/刷新），任务已安全停止。");
        break;
      }

      const user  = toUnfollow[i];
      const delay = randomDelay();
      const pct   = (((i + 1) / toUnfollow.length) * 100).toFixed(1);

      log.info(`⏳ [${i + 1}/${toUnfollow.length}] (${pct}%)  等待 ${(delay/1000).toFixed(1)} 秒后取消关注: ${user.login}`);
      await sleep(delay);

      // [问题5] 使用带重试的函数替代直接 fetch
      const success = await unfollowWithRetry(user.login);
      if (success) {
        successCount++;
        log.ok(`  ✅ 已成功取消关注: ${user.login}`);
      } else {
        failCount++;
        // [问题6] 存储完整对象信息
        failedUsers.push({ login: user.login, url: user.html_url, id: user.id, type: user.type });
        log.error(`  ❌ 取消关注最终失败: ${user.login}（已重试 ${MAX_RETRY} 次）`);
      }
    }

    // [问题6] 导出失败名单 JSON 文件，方便后续重新处理
    if (failedUsers.length > 0) {
      const failedJson = JSON.stringify(failedUsers, null, 2);
      downloadAsFile(failedJson, "failed_users.json");
      log.warn(`\n📥 已自动下载 failed_users.json（${failedUsers.length} 人），可稍后重新运行脚本处理。`);
    }

    // ── 最终汇报 ────────────────────────────────────────────────
    console.log("\n");
    log.title("╔═══════════════════════ 🎉 任务完成 ═══════════════════════╗");
    log.ok   (`  ✅ 成功取消关注: ${successCount} 人`);
    if (failCount > 0) {
      log.error(`  ❌ 失败: ${failCount} 人（已导出 failed_users.json）`);
    }
    log.title("╚════════════════════════════════════════════════════════════╝");
    alert(`🎉 清理任务完成！\n✅ 成功: ${successCount} 人\n❌ 失败: ${failCount} 人${failCount > 0 ? "\n\n📥 失败名单已下载为 failed_users.json" : ""}`);

  } catch (err) {
    // [问题4] AbortError 是正常中止，不应视为错误
    if (err.name === "AbortError") {
      log.warn("\n⏹️  操作已被中止（AbortController）。");
      return;
    }
    log.error(`\n❌ 运行时错误: ${err.message}`);
    console.error(err);
    alert(`❌ 发生错误:\n${err.message}\n\n请查看控制台 (F12) 了解详细信息。`);
  } finally {
    // [问题1] 无论成功、失败、中止，始终在最后清理 Token 引用
    token = null;
    headers.Authorization = "";
    window.removeEventListener("beforeunload", abortOnUnload);
    log.debug("🔒 Token 引用已清理，敏感信息驻留时间已最小化。");
  }
}

// ════════════════════════════════════════════════════════════
//  启动脚本
// ════════════════════════════════════════════════════════════
safeAutoUnfollow();
