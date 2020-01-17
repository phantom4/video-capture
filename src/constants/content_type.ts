// 画像のコンテンツタイプ
export const map = new Map([
  ['image/png', { ext: ['png'] }],
  ['image/jpeg', { ext: ['jpg', 'jpeg', 'jpe'] }],
  ['image/gif', { ext: ['gif'] }],
  ['image/svg+xml', { ext: ['svg'] }],
  ['image/webp', { ext: ['webp'] }],
  ['image/bmp', { ext: ['bmp'] }],

  // // 以下は今回は不要
  // ['image/fif', { ext: ['fif'] }],
  // ['image/gif', { ext: ['gif'] }],
  // ['image/gif', { ext: ['ifm'] }],
  // ['image/ief', { ext: ['ief'] }],
  // ['image/tiff', { ext: ['tif', 'tiff'] }],
  // ['image/vasa', { ext: ['mcf'] }],
  // ['image/vnd.rn-realpix', { ext: ['rp'] }],
  // ['image/vnd.wap.wbmp', { ext: ['wbmp'] }],
  // ['image/x-cmu-raster', { ext: ['ras'] }],
  // ['image/x-freehand', { ext: ['fh', 'fh4', 'fh5', 'fh7', 'fhc'] }],
  // ['image/x-icon', { ext: ['ico'] }],
  // ['image/x-jps', { ext: ['jps'] }],
  // ['image/x-portable-anymap', { ext: ['pnm'] }],
  // ['image/x-portable-bitmap', { ext: ['pbm'] }],
  // ['image/x-portable-graymap', { ext: ['pgm'] }],
  // ['image/x-portable-pixmap', { ext: ['ppm'] }],
  // ['image/x-rgb', { ext: ['rgb'] }],
  // ['image/x-xbitmap', { ext: ['xbm'] }],
  // ['image/x-xpixmap', { ext: ['xpm'] }],
  // ['image/x-xres', { ext: ['swx'] }],
  // ['image/x-xwindowdump', { ext: ['xwd'] }],
])

/**
 * 拡張子からコンテンツタイプを取得する
 * @param ext 拡張子
 */
export function getContentTypeByExt (ext: string): string | null {
  const maps = Array.from(map.keys())
  let result: string | null = null

  for (let i = 0, l = maps.length; i < l; i++) {
    const key = maps[i]
    const value = map.get(key)

    if (value && value.ext.indexOf(ext) >= 0) {
      result = key as string
    }
  }
  // for (let key of mimeTypeMap.keys()) { } だとうまく動かない？

  return result
}
