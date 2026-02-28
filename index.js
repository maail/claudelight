#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { setLight } = require("./light");

const VALID_STATES = ["thinking", "running", "question", "success", "error", "done"];
const CONFIG_PATH = path.join(os.homedir(), ".config", "claudelight", ".env");

function loadConfigFile() {
  try {
    const content = fs.readFileSync(CONFIG_PATH, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {}
}

function parseDevices() {
  loadConfigFile();

  const ids = (process.env.CLAUDELIGHT_DEVICE_ID || "").split(",").filter(Boolean);
  const keys = (process.env.CLAUDELIGHT_KEY || "").split(",").filter(Boolean);
  const ips = (process.env.CLAUDELIGHT_IP || "").split(",").filter(Boolean);
  const versions = (process.env.CLAUDELIGHT_VERSION || "").split(",").filter(Boolean);

  if (!ids.length || !keys.length || !ips.length) {
    console.error("[claudelight] Missing env vars. Set CLAUDELIGHT_DEVICE_ID, CLAUDELIGHT_KEY, and CLAUDELIGHT_IP.");
    console.error("[claudelight] For multiple devices, use comma-separated values.");
    process.exit(1);
  }

  if (ids.length !== keys.length || ids.length !== ips.length) {
    console.error("[claudelight] CLAUDELIGHT_DEVICE_ID, CLAUDELIGHT_KEY, and CLAUDELIGHT_IP must have the same number of comma-separated values.");
    process.exit(1);
  }

  return ids.map((id, i) => ({
    id: id.trim(),
    key: keys[i].trim(),
    ip: ips[i].trim(),
    version: versions[i]?.trim() || "3.5",
  }));
}

function setupHooks() {
  const settingsPath = path.join(os.homedir(), ".claude", "settings.json");

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  }

  if (!settings.hooks) settings.hooks = {};

  const hookEvents = {
    UserPromptSubmit: { command: "claude-light thinking" },
    PreToolUse: { command: "claude-light running" },
    Notification: { matcher: "idle_prompt", command: "claude-light question" },
    Stop: { command: "claude-light done" },
  };

  let added = [];
  let skipped = [];

  for (const [event, { matcher, command }] of Object.entries(hookEvents)) {
    if (!settings.hooks[event]) settings.hooks[event] = [];

    const exists = settings.hooks[event].some((entry) => {
      const hooks = entry.hooks || [];
      return hooks.some((h) => h.command === command) &&
        (entry.matcher || "") === (matcher || "");
    });

    if (exists) {
      skipped.push(event);
      continue;
    }

    const entry = { hooks: [{ type: "command", command }] };
    if (matcher) entry.matcher = matcher;
    settings.hooks[event].push(entry);
    added.push(event);
  }

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");

  if (added.length) {
    console.log(`[claudelight] Added hooks: ${added.join(", ")}`);
  }
  if (skipped.length) {
    console.log(`[claudelight] Already configured: ${skipped.join(", ")}`);
  }
  console.log(`[claudelight] Settings updated: ${settingsPath}`);
}

async function main() {
  const command = process.argv[2];

  if (command === "setup-hooks") {
    setupHooks();
    return;
  }

  if (!command || !VALID_STATES.includes(command)) {
    console.error(`[claudelight] Usage: claude-light <${VALID_STATES.join("|")}|setup-hooks>`);
    process.exit(0);
  }

  const devices = parseDevices();
  await setLight(command, devices);
}

main().catch((err) => {
  console.error(`[claudelight] ${err.message}`);
  process.exit(0);
});
