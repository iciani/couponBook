async function acquireLock(
  redis,
  key,
  value,
  ttlSeconds
) {
  const ok = await redis.set(
    key,
    value,
    "NX",
    "EX",
    ttlSeconds
  );
  return ok === "OK";
}

async function releaseLock(
  redis,
  key,
  value
) {
  const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;
  return redis.eval(
    script,
    1,
    key,
    value
  );
}

module.exports = {
  acquireLock,
  releaseLock,
};
