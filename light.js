const TuyAPI = require("tuyapi");

const DEFAULT_COLORS = {
  thinking: "011803e803e8",
  running: "00f003e803e8",
  question: "003203e803e8",
  success: "007803e803e8",
  error: "000003e803e8",
  done: "003c03e80190",
};

async function setDeviceState(device, state, color) {
  const tuya = new TuyAPI({
    id: device.id,
    key: device.key,
    ip: device.ip,
    version: device.version || "3.5",
    issueRefreshOnConnect: true,
  });

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      try { tuya.disconnect(); } catch {}
      resolve();
    }, 3000);

    tuya.on("connected", async () => {
      try {
        await tuya.set({ multiple: true, data: { 20: true, 21: "colour", 24: color } });
      } catch (err) {
        console.error(`[claudelight] ${device.ip}: ${err.message}`);
      } finally {
        clearTimeout(timeout);
        tuya.disconnect();
        resolve();
      }
    });

    tuya.on("error", (err) => {
      console.error(`[claudelight] ${device.ip}: ${err.message}`);
      clearTimeout(timeout);
      resolve();
    });

    tuya.find().then(() => tuya.connect()).catch(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function setLight(state, devices) {
  const color = DEFAULT_COLORS[state];
  if (!color) {
    console.error(`[claudelight] Unknown state: ${state}`);
    return;
  }

  await Promise.all(devices.map((d) => setDeviceState(d, state, color)));
}

module.exports = { setLight, DEFAULT_COLORS };
