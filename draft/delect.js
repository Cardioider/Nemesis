// === GitHub Smart Auto-Unfollow Script (Fixed Version) ===
async function safeAutoUnfollow() {
  console.clear();
  console.log("🚀 Initializing script...");

  // 1. Get Token (Auto trim checks)
  let token = prompt("Step 1: Please paste your GitHub Token:");
  if (!token) return alert("Cannot run without a Token!");
  token = token.trim(); // 修复：去除可能的空格

  const username = prompt("Step 2: Your username:");
  if (!username) return;

  // 2. Whitelist (Case-Insensitive Fix)
  // 建议：将核心大V名单保留在代码中，避免 prompt 字符超限
  const coreWhiteList = [
    "sindresorhus", "torvalds", "ruanyf", "yyx990803", "antfu", "gaearon", "tj", "rauchg", 
    "Rich-Harris", "posva", "sdras", "kentcdodds", "getify", "feross", "addyosmani", "paulirish", 
    "mdo", "fat", "defunkt", "mojombo", "kennethreitz", "mitsuhiko", "tiangolo", "dhh", 
    "taylorotwell", "fabpot", "kelvins", "jwasham", "donnemartin", "vinta", "kamranahmedse", 
    "trekhleb", "koush", "gabrielfalcao", "FredKSchott", "akien-mga", "Dreamacro", "DIYgod", 
    "jaywcjlove", "surmon-china", "phodal", "fouber", "sofish", "lifesinger", "alsotang", 
    "dead-horse", "fengmk2", "atian25", "microsoft", "google", "facebook", "apple", "netflix", 
    "airbnb", "twitter", "alibaba", "tencent", "baidu", "bytedance", "huawei", "xiaomi", 
    "vuejs", "reactjs", "angular", "vercel", "nextjs", "nestjs", "expressjs", "fastify", 
    "pytorch", "tensorflow", "huggingface", "openai", "deepmind", "ultralytics", "optuna", 
    "karpathy", "ggerganov", "automattic", "electron", "atom", "docker", "kubernetes", 
    "ansible", "hashicorp", "mitchellh", "clowwindy", "fatedier", "junegunn", "neovim", 
    "vim", "rust-lang", "golang", "python", "nodejs", "denoland", "ry", "whatwg", "w3c", 
    "linux", "git", "github", "labuladong", "azl397985856", "halfrost", "keon", "lemire", 
    "skeeto", "MisterBooo", "youngyangyang04", "kdn251", "TheAlgorithms"
  ];

  const userCustomInput = prompt("Step 3: Add extra whitelist users? (Separate by comma, leave empty if none):", "");
  
  // 修复：逻辑合并并统一转小写，防止大小写导致匹配失败
  const combinedList = [...coreWhiteList];
  if (userCustomInput) {
    combinedList.push(...userCustomInput.split(","));
  }
  const whiteList = new Set(combinedList.map(s => s.trim().toLowerCase()));

  console.log(`🛡️ Whitelist loaded: ${whiteList.size} users protected.`);
  console.log(`🚀 [Safe Mode] Scanning following list for ${username}...`);

  const headers = { 
    "Authorization": `token ${token}`, 
    "Accept": "application/vnd.github.v3+json" 
  };

  // Helper function
  async function getAll(type) {
    let list = [];
    let page = 1;
    while (true) {
      console.log(`📡 Reading ${type} page ${page}...`);
      let res = await fetch(`https://api.github.com/users/${username}/${type}?per_page=100&page=${page}`, { headers });
      
      // 检查 API 限额
      const remaining = res.headers.get('x-ratelimit-remaining');
      if (remaining && parseInt(remaining) < 10) {
        throw new Error("⚠️ GitHub API Rate Limit is almost exhausted. Please try again in an hour.");
      }

      if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
      let data = await res.json();
      if (data.length === 0) break;
      list = list.concat(data);
      page++;
      await new Promise(r => setTimeout(r, 1000));
    }
    return list;
  }

  try {
    const following = await getAll("following");
    const followers = await getAll("followers");
    
    // 修复：构建 Set 时统一转小写
    const followerLogins = new Set(followers.map(u => u.login.toLowerCase()));
    
    // 找出未回关的人 (比较时也用小写)
    const nonMutuals = following.filter(u => !followerLogins.has(u.login.toLowerCase()));
    
    // 过滤白名单 (比较时也用小写)
    const toDelete = nonMutuals.filter(u => !whiteList.has(u.login.toLowerCase()));

    console.log(`\n=== 📊 Analysis Report ===`);
    console.log(`You follow: ${following.length}`);
    console.log(`Follows you: ${followers.length}`);
    console.log(`Not following back: ${nonMutuals.length}`);
    console.log(`🛡️ Whitelist protection: ${nonMutuals.length - toDelete.length} users`);
    console.log(`🗑️ To be removed: ${toDelete.length} users`);

    if (toDelete.length === 0) return alert("Your list is very clean! No cleanup needed.");

    const minTime = (toDelete.length * 5 / 60).toFixed(1);
    const maxTime = (toDelete.length * 12 / 60).toFixed(1);
    
    const confirm = prompt(`⚠️ Ready to remove ${toDelete.length} users.\n\nTime Estimate: ${minTime} ~ ${maxTime} mins.\nStrategy: Random 5-12s delay.\n\nType "yes" to start:`);
    
    if (confirm !== "yes") return console.log("Operation cancelled.");

    let count = 0;
    for (const user of toDelete) {
      count++;
      
      const randomDelay = Math.floor(Math.random() * (12000 - 5000 + 1) + 5000);
      console.log(`\n⏳ [${count}/${toDelete.length}] Waiting ${(randomDelay/1000).toFixed(1)}s...`);
      await new Promise(r => setTimeout(r, randomDelay));

      console.log(` Unfollowing: ${user.login} `);
      
      const res = await fetch(`https://api.github.com/user/following/${user.login}`, {
        method: "DELETE",
        headers: headers
      });

      if (res.status === 204) {
        console.log(` ✅ Success (${user.login}) `);
      } else {
        console.error(` ❌ Failed (${user.login}) Code: ${res.status} `);
        if (res.status === 403 || res.status === 429) {
          alert("🚨 GitHub API Rate Limit Hit! Script stopped for safety.");
          break;
        }
        // 如果是 404，说明可能用户已经不存在或改名了，继续下一个
      }
    }

    alert("🎉 All cleanup tasks completed!");

  } catch (err) {
    console.error(err);
    alert(`❌ Error: ${err.message}`);
  }
}

safeAutoUnfollow();