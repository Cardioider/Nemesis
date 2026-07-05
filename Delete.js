async function safeAutoUnfollow() {
  console.clear();

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
  log.title("║             Nemesis Chiffon Cyan           ║");
  log.title("╚════════════════════════════════════════════╝");

  // ════════════════════════════════════════════════════════════
  //  ★ Configuration information
  // ════════════════════════════════════════════════════════════

  // ── Core whitelist, Case insensitive ────────────────────────
const CORE_WHITE_LIST = [
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
  ];

  // ─────────────────────────────────────────────────
  // true  → They only analyze and print out the lists, but don't actually unfollow.
  // false → Officially implementing unfollow
  const DRY_RUN = true;


  const DELAY_MIN_MS = 2000;
  const DELAY_MAX_MS = 5000;
  const PAGE_DELAY_MS = 800;

  const MAX_RETRY = 3;

  let token = prompt("Step 1/2: Please paste your GitHub PAT Token (starting with ghp_ or github_pat_):");
  if (!token || token.trim() === "") {
    return log.error("Cancelled: A valid token is required to run!");
  }
  token = token.trim();

  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    const proceed = confirm("Token format looks non-standard (should start with ghp_ or github_pat_), continue?");

    if (!proceed) return log.warn("Operation aborted.");
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  const controller = new AbortController();
  const signal = controller.signal;
  const abortOnUnload = () => controller.abort();
  window.addEventListener("beforeunload", abortOnUnload);

  let myUsername;
  try {
    log.step("\n[Verification Initiation] Verifying Token permissions and automatically retrieving username...");
    const meRes = await fetch("https://api.github.com/user", { headers, signal });

    if (meRes.status === 401) throw new Error("Token is invalid or has expired. Please regenerate your PAT.");
    if (!meRes.ok) throw new Error(`Token verification failed: HTTP ${meRes.status} ${meRes.statusText}`);

    const scopesHeader = meRes.headers.get("X-OAuth-Scopes") || "";
    const scopes = scopesHeader.split(",").map(s => s.trim().toLowerCase());
    log.debug(`Token Scopes: ${scopesHeader || "(No response header was returned, possibly indicating a fine-grained token)"}`);

    if (scopesHeader && !scopes.includes("user:follow") && !scopes.includes("user")) {
      throw new Error(
        `Token permissions insufficient!\n` +
        `Current Token scopes: [${scopesHeader}]\n` +
        `Required scope: user:follow\n` +
        `Please regenerate the Token in GitHub → Settings → Developer settings → Personal access tokens\n` +
        `and ensure the user → user:follow permission is selected.`
      );
    }

    const meData = await meRes.json();
    myUsername = meData.login;
    log.ok(`Token verification passed! Automatically retrieved username: ${myUsername}`);
  } catch (err) {
    token = null;
    headers.Authorization = "";
    window.removeEventListener("beforeunload", abortOnUnload);
    log.error(`\nStartup verification failed: ${err.message}`);
    alert(`Startup verification failed:\n${err.message}`);
    return;
  }

  const extraInput = prompt(
    "Step 2/2: Temporarily add users to the whitelist?\n(Separate multiple users with commas ','; press Enter to skip):",
    ""
  );

  const combinedRaw = [...CORE_WHITE_LIST];
  if (extraInput && extraInput.trim() !== "") {
    combinedRaw.push(...extraInput.split(","));
  }
  const whiteList = new Set(combinedRaw.map((s) => s.trim().toLowerCase()).filter(Boolean));

  log.ok(`\nWhitelist loaded successfully, protecting ${whiteList.size} accounts.`);
  if (DRY_RUN) {
    log.warn("[DRY_RUN=true]This session is in simulation mode only. No actual unfollowing will occur.");
  }
  log.info(`Starting to scan follow data for [${myUsername}], please do not close the page...\n`);

  async function handleRateLimit(res, context = "") {
    const remaining = parseInt(res.headers.get("x-ratelimit-remaining") || "999", 10);
    const resetAt   = parseInt(res.headers.get("x-ratelimit-reset") || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    const waitSec = Math.max(resetAt - now + 2, 0);

    if (remaining < 10 && waitSec > 0) {
      const waitMin = Math.ceil(waitSec / 60);
      log.warn(`\nAPI quota insufficient (remaining ${remaining} calls)${context}, automatically waiting ${waitMin} minutes before continuing...`);
      log.warn(`  Estimated recovery time: ${new Date(resetAt * 1000).toLocaleTimeString()}`);
      await sleep(waitSec * 1000);
      log.ok(` API quota has been reset, continuing execution...`);
    }
    return remaining;
  }

  async function fetchAllPages(endpoint, label) {
    const list = [];
    let page = 1;
    while (true) {
      log.info(`Fetching page ${page} of [${label}]...`);
      const url = `https://api.github.com/users/${myUsername}/${endpoint}?per_page=100&page=${page}`;
      const res = await fetch(url, { headers, signal });

      await handleRateLimit(res, ` (while fetching ${label} page ${page})`);

      if (res.status === 401) throw new Error("Token is invalid or has expired. Please regenerate the PAT.");
      if (res.status === 403) throw new Error("No access permission. Please check if the PAT's Scope includes user:follow.");
      if (res.status === 404) throw new Error(`User [${myUsername}] not found. Please check the username spelling.`);
      if (!res.ok) throw new Error(`API Error: HTTP ${res.status} ${res.statusText}`);

      const data = await res.json();
      if (data.length === 0) break;

      list.push(...data);
      log.info(`✔ ${list.length} records retrieved...`);
      page++;

      await sleep(PAGE_DELAY_MS);
    }
    return list;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function randomDelay() {
    return Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1) + DELAY_MIN_MS);
  }

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

  async function unfollowWithRetry(userLogin) {
    for (let retry = 0; retry < MAX_RETRY; retry++) {
      if (signal.aborted) throw new DOMException("User has aborted the operation", "AbortError");

      const res = await fetch(`https://api.github.com/user/following/${userLogin}`, {
        method: "DELETE",
        headers,
        signal,
      });

      if (res.status === 204) return true;

      if (res.status === 429 || res.status === 403) {
        await handleRateLimit(res, ` (while unfollowing ${userLogin})`);
        continue;
      }

      if (res.status >= 500 && retry < MAX_RETRY - 1) {
        const backoff = Math.pow(2, retry + 1) * 1000;
        log.warn(`HTTP retry for ${retry + 2} times after ${(backoff / 1000)}s...`);
        await sleep(backoff);
        continue;
      }

      return false;
    }
    return false;
  }

  // ════════════════════════════════════════════════════════════
  //  main
  // ════════════════════════════════════════════════════════════
  try {
    // ── Step 1: Get data ───────────────────────────────────────
    log.step("\n[Step 1/4] Retrieving your Following list...");
    const following = await fetchAllPages("following", "Following");
    log.ok(`Following list retrieved, total ${following.length} users.`);

    log.step("\n[Step 2/4] Retrieving your Followers list...");
    const followers = await fetchAllPages("followers", "Followers");
    log.ok(`Followers list retrieved, total ${followers.length} users.`);

    // ── Step 2: Compare lists ────────────────────────────────────────────
    log.step("\n[Step 3/4] Analyzing one-way follows...");

    const followerSet = new Set(followers.map((u) => u.login.toLowerCase()));
    const nonMutuals  = following.filter((u) => !followerSet.has(u.login.toLowerCase()));

    // ── Step 3: Filtering whitelist ─────────────────────────────────────
    const protectedUsers = [];
    const toUnfollow     = [];

    for (const user of nonMutuals) {
      const loginLower = user.login.toLowerCase();
      if (whiteList.has(loginLower)) {
        protectedUsers.push(user.login);
        log.shield(`Whitelist protected, skipping: ${user.login}`);
      } else {
        toUnfollow.push(user);
      }
    }

    // ── Step 4: Generate analysis report ───────────────────────────────────
    console.log("\n");
    log.title("╔══════════════════════ Analysis Report ══════════════════════╗");
    log.info (`   Your username     : ${myUsername}`);
    log.info (`   Following count   : ${following.length} users`);
    log.info (`   Followers count   : ${followers.length} users`);
    log.warn (`   One-way follows   : ${nonMutuals.length} users (You follow them, but they don't follow you)`);
    log.shield(`   Whitelist protected   : ${protectedUsers.length} users`);
    log.error (`   To be unfollowed   : ${toUnfollow.length} users`);
    log.title("╚════════════════════════════════════════════════════════════╝\n");

    if (toUnfollow.length === 0) {
      return alert("Your following list is clean, no users to unfollow!");
    }

    // ── Print the complete list of those to be unfollowed ───────────────────────────────
    log.step("【Step 4/4】The following is the complete list of users to be unfollowed (please verify carefully):\n");
    console.table(
      toUnfollow.map((u, i) => ({
        "#"               : i + 1,
        "Username"          : u.login,
        "Profile (double-click to open)" : u.html_url,
        "Account Type"    : u.type === "Organization" ? "Organization" : "Individual",
      }))
    );

    if (!DRY_RUN) {
      const exportData = JSON.stringify(
        toUnfollow.map(u => ({ login: u.login, url: u.html_url, id: u.id, type: u.type })),
        null, 2
      );
      downloadAsFile(exportData, "to_unfollow.json");
      log.ok(`\nAutomatically downloaded to_unfollow.json (${toUnfollow.length} people), which can be used to restore followers with one click after accidental operations.`);
    }

    if (DRY_RUN) {
      log.warn("\n[Drill Mode] Analysis complete, no actual unfollow operation performed.");
      log.warn("To execute the script, change DRY_RUN to false at the top of the script and then run it again.");
      return;
    }

    // ── Final confirmation ─────────────────
    const minMin = (toUnfollow.length * DELAY_MIN_MS / 1000 / 60).toFixed(1);
    const maxMin = (toUnfollow.length * DELAY_MAX_MS / 1000 / 60).toFixed(1);

    log.warn(`\nThe final confirmation box will be displayed in 5 seconds, please be prepared...`);
    for (let i = 5; i >= 1; i--) {
      await sleep(1000);
      log.warn(`Countdown: ${i} seconds...`);
    }

    const confirmMsg =
      `[Final Confirmation]You are about to unfollow ${toUnfollow.length} users.\n\n` +
      `Please check the "List Table" printed in the console first to ensure it is correct.\n` +
      `Estimated time: ${minMin} ~ ${maxMin} minutes\n` +
      `Anti-abuse strategy: Random delay of ${DELAY_MIN_MS/1000}~${DELAY_MAX_MS/1000} seconds for each operation\n\n` +
      `To confirm execution, please type:   yes\n(Any other input will be treated as cancellation)`;

    const userConfirm = prompt(confirmMsg);
    if (userConfirm !== "yes") {
      return log.warn("Operation cancelled. No following relationships have been modified.");
    }

    // ── implement ───────────────────────────────────────
    log.title("\nStarting the cleanup task...\n");

    let successCount = 0;
    let failCount    = 0;
    const failedUsers = [];

    for (let i = 0; i < toUnfollow.length; i++) {
      if (signal.aborted) {
        log.warn("\nAn abort signal was detected (page closed/refreshed). The task has been safely stopped.");
        break;
      }

      const user  = toUnfollow[i];
      const delay = randomDelay();
      const pct   = (((i + 1) / toUnfollow.length) * 100).toFixed(1);

      log.info(`[${i + 1}/${toUnfollow.length}] (${pct}%)  Waiting ${(delay/1000).toFixed(1)} seconds before unfollowing: ${user.login}`);
      await sleep(delay);

      const success = await unfollowWithRetry(user.login);
      if (success) {
        successCount++;
        log.ok(`Successfully unfollowed: ${user.login}`);
      } else {
        failCount++;
        failedUsers.push({ login: user.login, url: user.html_url, id: user.id, type: user.type });
        log.error(`Failed to unfollow: ${user.login} (Retried ${MAX_RETRY} times)`);
      }
    }

    if (failedUsers.length > 0) {
      const failedJson = JSON.stringify(failedUsers, null, 2);
      downloadAsFile(failedJson, "failed_users.json");
      log.warn(`\nThe failed_users.json file (${failedUsers.length} people) has been automatically downloaded.`);
    }

    // ── report ────────────────────────────────────────────────
    console.log("\n");
    log.title("╔══════════════════════ Task Completed ══════════════════════╗");
    log.ok   (`Successfully unfollowed: ${successCount} people`);
    if (failCount > 0) {
      log.error(`Failed: ${failCount} people (failed_users.json exported)`);
    }
    log.title("╚════════════════════════════════════════════════════════════╝");
    alert(`Task completed!\nSuccessful: ${successCount} people\nFailed: ${failCount} people${failCount > 0 ? "\n\nFailed list downloaded as failed_users.json" : ""}`);

  } catch (err) {
    if (err.name === "AbortError") {
      log.warn("\nOperation was aborted (AbortController).");
      return;
    }
    log.error(`\nRuntime error: ${err.message}`);
    console.error(err);
    alert(`An error occurred:\n${err.message}\n\nPlease check the console (F12) for details.`);
  } finally {
    token = null;
    headers.Authorization = "";
    window.removeEventListener("beforeunload", abortOnUnload);
    log.debug("Token reference cleaned up, sensitive data retention time minimized.");
  }
}

safeAutoUnfollow();