# GitHub Smart One-Way Unfollow Cleanup Script · Tutorial

---

## Table of Contents

1. [Step 1: Apply for a GitHub Personal Access Token (PAT)](https://www.google.com/search?q=%23step1)
2. [Step 2: Configure the Whitelist](https://www.google.com/search?q=%23step2)
3. [Step 3: First Run in Simulation Mode (DRY RUN)](https://www.google.com/search?q=%23step3)
4. [Step 4: Execute Actual Unfollowing](https://www.google.com/search?q=%23step4)
5. [Feature Explanations](https://www.google.com/search?q=%23features)
6. [Frequently Asked Questions (FAQ)](https://www.google.com/search?q=%23faq)

---

## Step 1: Apply for a GitHub Personal Access Token (PAT) {#step1}

The PAT acts as the "key" for the script to call the GitHub API, and its permissions must be configured correctly.

### Steps

1. Log in to GitHub, click your avatar in the upper right corner → **Settings**
2. Scroll to the bottom of the left menu and click **Developer settings**
3. Select **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token** in the upper right corner → **Generate new token (classic)**
5. Fill out the form:
* **Note**: Enter `unfollow-cleaner` (or anything you like, just for easy identification)
* **Expiration**: `7 days` is recommended (disposable after use, much safer)
* **Select scopes**:
* Check **`user` → `user:follow**` only (to manage follow relationships)
* Do **NOT** check any other permissions, adhering to the principle of least privilege




6. Click **Generate token** at the bottom
7. **Copy the Token immediately** (it will only be displayed once, and you won't be able to see it again after closing the page)

> **Security Tip**: The Token is equivalent to a password. Do not share it with anyone or commit it to a Git repository.

---

## Step 2: Configure the Whitelist {#step2}

Open the downloaded `github-smart-unfollow.js` file and find the following code snippet:

```javascript
const CORE_WHITE_LIST = [
  "sindresorhus",
  "torvalds",
  // ... example usernames
];

```

### How to Edit

* **Add**: Insert a new line `"username",` inside the array (don't forget the English comma)
* **Delete**: Simply remove the corresponding line
* Usernames are **case-insensitive**; the script will automatically standardize them
* Users on the whitelist **will absolutely never** be unfollowed by the script, regardless of whether they follow you back

---

## Step 3: First Run in Simulation Mode {#step3}

Note that if you want to paste the code into the browser's F12 Console, you might encounter an error. To resolve this issue, you need to manually type the `allow pasting` command and run it beforehand.

For your first run, make sure to use simulation mode (`DRY_RUN = true`). This only analyzes data without making any actual changes, allowing you to double-check the list before executing for real.

### Confirm Simulation Mode is Enabled

Find this in the script:

```javascript
const DRY_RUN = true;

```

### Steps to Run

1. Open [github.com](https://github.com) in your browser and **make sure you are logged in**
2. Press **F12** to open Developer Tools
3. Click the **Console** tab at the top
4. Copy the **entire code** of the `github-smart-unfollow.js` file
5. Paste it into the Console input box and press **Enter** to run it
6. Follow the prompts to enter:
* Your GitHub PAT Token
* Your GitHub username
* Temporarily added whitelist users (you can leave this blank and just press Enter)


7. Wait for the script to finish scanning, then check the Console for:
* **Analysis Report** (following count, follower count, non-reciprocal follow count)
* **To-be-cleaned List Table** (carefully check every single username)



> The script will not make any modifications in simulation mode, so you can safely run it multiple times.

---

## Step 4: Execute Actual Unfollowing {#step4}

Once you have verified that the list in simulation mode is correct:

1. Turn off simulation mode in the script:

```javascript
const DRY_RUN = false;

```

2. Repeat the execution process from Step 3
3. The script will display a **5-second countdown** after printing the list
4. A confirmation box will then pop up. You must **manually type `yes**` to begin execution
5. Typing anything else (or clicking Cancel) will abort the operation

---

## Feature Explanations {#features}

| Feature | Description |
| --- | --- |
| **Whitelist Protection** | Dual-layer whitelist (built-in + runtime additions); logs a notice to the console when triggered |
| **Simulation Mode** | Only analyzes without taking action when `DRY_RUN=true` to safely verify the list |
| **Pagination Handling** | Processes 100 items per page, automatically turning pages until all data is fetched |
| **Rate Limit Detection** | Reads `x-ratelimit-remaining` in real-time, proactively aborting when it falls below 15 |
| **Random Delay** | Randomly waits 2~5 seconds before each unfollow action to mimic human behavior |
| **5-second Countdown** | Enforces a wait before actual execution, offering one final chance to back out |
| **Double Confirmation** | Requires manually typing `yes` to execute, preventing accidental operations |
| **Abuse Detection Stop** | Instantly stops and reports progress upon receiving an HTTP 403/429 error |
| **Colorful Logs** | Categorizes different types of logs with distinct colors for clear readability |
| **Progress Percentage** | Displays current progress during each operation (Processed X/Total, Percentage) |

---

## Frequently Asked Questions (FAQ) {#faq}

### Q: After entering the Token, it prompts `401 Token Invalid`?

Check the following points:

* Did you copy the full Token? (It should start with `ghp_` or `github_pat_`)
* Has the Token expired? (Check your GitHub settings)
* Does the Token's scope include `user:follow`?

### Q: What should I do if the script stops halfway through?

It is highly likely that you triggered GitHub's rate limit (usually caused by too many actions in a short period). The script will automatically stop and display the number of remaining unprocessed users. **Wait for 1 hour** and run it again. Users who have already been successfully unfollowed will not be processed again.

### Q: I follow over 2000+ people, can I still run it?

Absolutely. The script supports automatic pagination and can fetch the complete list regardless of the size. However, the operation will take longer (for example, taking up to 40 minutes to unfollow 500 users). Please keep the page open and do not close the tab.

### Q: The console displays `Could not establish connection` during execution?

This means a browser extension (such as an ad blocker) is interfering with the script. Try opening GitHub in **Incognito/Private Mode** and running it again.

### Q: How can I clean up only some users instead of all of them?

After the script generates the list table, you can note down the usernames you don't want to unfollow, add them to the whitelist, rerun simulation mode to confirm, and then execute it for real.

### Q: What is recommended to do with the Token after finishing?

It is highly recommended to **Revoke** the Token immediately in your GitHub settings to prevent leak risks:

> GitHub → Settings → Developer settings → Personal access tokens → Find the token → Delete

---

> The script is open-sourced for learning and reference purposes only. Please use it reasonably and abide by GitHub's Terms of Service.

Special thanks to the repositories:

[https://github.com/Phylactre/Github_fllower_fuck](https://github.com/Phylactre/Github_fllower_fuck)

[https://github.com/Phylactre/GitHub-follower-manager](https://github.com/Phylactre/GitHub-follower-manager)