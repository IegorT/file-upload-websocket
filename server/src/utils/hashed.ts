import * as crypto from 'crypto'


const makeSalt: (length?: number) => string = 
function makeSalt (length=16) {
  return crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0, length)
}

export const passwordHash: (password: string, salt?:string) => {hash:string, salt:string} =
function passwordHash (password, salt) {
  if (!salt) salt = makeSalt()
  let hash = crypto.createHmac('sha512', salt).update(password).digest('hex')
  return {
    hash: `${hash}`,
    salt: `${salt}`
  }
}

export const fileHash: (fileInfo: {}, hash_type?: string) => string =
function fileHash (fileInfo, hash_type='sha256') {  
  return crypto.createHash(hash_type).update(JSON.stringify(fileInfo)).digest('hex')
}