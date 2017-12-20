export function login (url, info) {
  return new Promise((resolve, reject) => {
    if (info.length > 0) {
      let xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          let json = JSON.parse(xhr.responseText)
          if (json.token) {
            resolve(json.token)
          } else {
            reject(new Error(json.error))
          }
        }
      }
      xhr.send(info)
    } else {
      reject(new Error('Enter password and email'))
    }
  })
}
