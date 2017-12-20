import * as fs from 'fs'
import { resolve } from 'path';


export const fileStats: (filename: string) => Promise<any> = 
async function fileStats (filename) {
  return new Promise ((resolve, reject) => {
    fs.stat(filename, (err, stats) => {
      if (err !== null) reject(err)
      resolve(stats)
    })
  })
}
