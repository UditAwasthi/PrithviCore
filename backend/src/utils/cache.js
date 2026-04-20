const cache = new Map();
function getCache(key) {
    return cache.get(key);

}
function setCache(key, value) {
    cache.set(key, value);
}
module.exports = { getCache, setCache };