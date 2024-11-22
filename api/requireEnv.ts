export default function requireEnv<T extends Array<string>>(...names: T) {
  if (names.length == 0) {
    throw new Error(`At least one variable name must be provided`)
  }
  return names.reduce((acc, name) => {
    if (!process.env[name] === undefined) {
      throw new Error(`Missing environment variable: ${name}`)
    }
    return { ...acc, [name]: process.env[name] }
  }, {}) as { [name in T[number]]: string }
}
