const crypto = require("crypto");
function genrateKey() {
    const raw = '${data.moisture}|${data.ph}|${data.temperature}|${data.humidity}|${data.npk}';
    return crypto.createHash("md5").update(raw).digest("hex");


}
module.exports = { genrateKey };