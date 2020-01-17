import * as _ from 'lodash'

/**
 * ファイルパスをファイル名と拡張子に分ける
 * @param fileName
 */
export function parsedFileName (fileName: string): { name: string; ext: string | null; } {
  const parsed = fileName.match(/(.*)(?:\.([^.]+$))/)  // ファイル名と拡張子を分割

  return parsed ? {
    // 拡張子で分割できた
    name: parsed[1],
    ext: parsed[2],
  } : {
    // 拡張子が判別できない場合
    name: fileName,
    ext: null,
  }
}

/**
 * 動画の再生位置をファイル名用に変換する
 * @param videoTime 再生位置（ミリ秒）
 */
export function timeToFileName (videoTime: number): string {
  return _.padStart(`${Math.round(videoTime * 1000)}`, 8, '0')  // 動画の秒数。24時間が86400000ミリ秒なので8桁用意すれば十分かと
}
