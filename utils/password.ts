import bcrypt from "bcryptjs"

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

export async function verifyPassword(plain: string, hash: string) {
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}



