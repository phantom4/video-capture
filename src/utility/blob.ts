import axios, { AxiosPromise } from 'axios'

/**
 * Blob URLをBlobに変換
 * @param blobURL
 */
export function blobUrlToBlob (blobURL: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    axios(blobURL, {
      responseType: 'blob',
    })
      .then((response) => {
        console.log('blobUrlToBlob', response)
        resolve(response.data)
      })
      .catch((error) => {
        reject(error)
      })
  })
}
