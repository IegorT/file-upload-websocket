import * as fs from 'fs'
import * as os from 'os'

import Logger from '../log'

const logger = new Logger(module.filename).logger

const BASE_DIR = process.env.BASE_DIR || os.homedir()
const UPLOAD = `upload/`
const TEMP =  `${UPLOAD}tmp/`



try {
  process.chdir(BASE_DIR)
  logger.info(`Dir has been changed on ${process.cwd()}`)
} catch (err) {
  logger.error(`${err}`)
}



export const saveFile: (data: ArrayBuffer, filename:string) => Promise<any> =
async function saveFile (data, filename) {
  await ensureDirExists(UPLOAD)
  await ensureDirExists(TEMP)
  await saveToFile(data, `${TEMP}/${filename}`)
  return await fileStat(`${TEMP}/${filename}`)
}

const ensureDirExists: (path:string, mask?: number) => Promise<any> =
function ensureDirExists(path, mask) {
  return new Promise ((resolve, reject) => {
  fs.mkdir(path, mask = 0o777, (err) => {
      if (err !== null) {
          if (err.code === 'EEXIST') resolve(null) // ignore the error if the folder already exists
          else reject(err) // something else went wrong
      } else resolve(null) // successfully created folder
  })
  })
}

const saveToFile: (data: ArrayBuffer, path: string) => Promise<any> =
function saveToFile(data, path) {
  return new Promise ((resolve, reject) => {
    fs.appendFile(path, data, (err) => {
      if(err !== null) reject(err)
      resolve(null)
    })
  })
}

const fileStat: (path: string) => Promise<any> =
function fileStat (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, data) => {
      if (err !== null) reject(err)
      resolve(data)
    })
  })
}

export const moveFile: (filename:string) => Promise<any> = 
function moveFile (filename) {
  return new Promise ((resolve, reject) => {
    fs.rename(`${TEMP}/${filename}`, `${UPLOAD}/${filename}`, (err) => {
      if(err) reject(err)
      resolve(true)
    })
  })
}

export const wipeFiles: (date:Date) => Promise<any> =
function wipeFile (date) {
  return new Promise ((resolve, reject) => {
    fs.readdir(TEMP, (err, items) => {
      if (err) reject(err)
      items.forEach((item) => {
        fileStat(`${TEMP}/${item}`)
        .then(stat => {
          if (Number(stat.mtime) < Number(date)) {
            fs.unlinkSync(`${TEMP}/${item}`)
          }
        }).catch(err => reject(err))
      })
      resolve(true)
    })
  })
}

// const saveToFile: (data: ArrayBuffer, path: string) => Promise<any> =
// function saveToFile(data, path) {
//   return new Promise ((resolve, reject) => {
//     let file = fs.createWriteStream(path, {flags: 'a'})
//     file.write(data)
//     file.end()
//     resolve(true)
//   })
// }