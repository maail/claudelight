# claudelight

Control a Tuya smart light to show Claude Code status. Your light changes color when Claude is thinking, running tools, asking a question, or encounters an error — and glows a warm dim yellow when idle.

## Colors

| State | Color |
|-------|-------|
| Thinking | Purple |
| Running | Blue |
| Question | Yellow |
| Success | Green |
| Error | Red |
| Done | Warm Yellow (dim) |

## Install

```bash
npm install -g claudelight
```

## Setup

### 1. Get your Tuya credentials

You'll need the **device ID**, **local key**, and **local IP** of your Tuya smart light. The easiest way to get these is with [tinytuya](https://github.com/jasonacox/tinytuya):

```bash
pip install tinytuya
python -m tinytuya wizard
```

This will walk you through linking your [Tuya IoT Platform](https://iot.tuya.com/) account and scanning your local network for devices. You'll need to:

1. Create a Tuya IoT Platform account and a Cloud project
2. Link your Tuya/Smart Life app account to the project
3. Run the wizard — it outputs a `devices.json` with each device's `id`, `key`, and `ip`

### 2. Configure your credentials

Create a config file at `~/.config/claudelight/.env`:

```bash
mkdir -p ~/.config/claudelight
cat > ~/.config/claudelight/.env << 'EOF'
CLAUDELIGHT_DEVICE_ID=your_device_id
CLAUDELIGHT_KEY=your_local_key
CLAUDELIGHT_IP=192.168.1.100
CLAUDELIGHT_VERSION=3.5
EOF
```

`CLAUDELIGHT_VERSION` is optional and defaults to `3.5`.

For multiple devices, use comma-separated values:

```
CLAUDELIGHT_DEVICE_ID=id1,id2
CLAUDELIGHT_KEY=key1,key2
CLAUDELIGHT_IP=192.168.1.100,192.168.1.101
```

Alternatively, you can set these as environment variables in your shell profile.

### 3. Set up Claude Code hooks

```bash
claude-light setup-hooks
```

This adds hooks to `~/.claude/settings.json` so Claude Code automatically triggers the light on lifecycle events.

## Manual usage

```bash
claude-light thinking   # Purple
claude-light running    # Blue
claude-light question   # Yellow
claude-light success    # Green
claude-light error      # Red
claude-light done       # Warm yellow (dim)
```
