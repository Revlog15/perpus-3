const fs = require('fs');
const path = require('path');

function readJsonSafeSync(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Failed to read or parse ${path.basename(filePath)}: ${err.message}`);
    return fallback;
  }
}

function writeJsonAtomicSync(filePath, data) {
  const tmpPath = filePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`Failed to save ${path.basename(filePath)}:`, err);
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
  }
}

module.exports = {
  readJsonSafeSync,
  writeJsonAtomicSync,
};


