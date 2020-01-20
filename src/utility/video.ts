import * as _ from 'lodash'
import Decimal from 'decimal.js'

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

/**
 * 再生位置からフレームに変換
 * @param sec 秒
 * @param fps フレームレート
 */
export function timeToFrame (sec: number, fps: number): number {
  let frameDuration // 1フレームの秒数
  if (fps % 1 !== 0) {
    // 23.976, 29.97, 59.94
    frameDuration = Decimal.div(1.001, Math.ceil(fps))
  }
  else {
    // 24, 25, 30, 50, 60
    frameDuration = Decimal.div(1, fps)
  }
  return Decimal.div(sec, frameDuration).round().toNumber()
}

/**
 * フレームを再生位置に変換
 * @param frame フレーム
 * @param fps フレームレート
 */
export function frameToTime (frame: number, fps: number): number {
  let value: Decimal

  if (fps % 1 !== 0) {
    // 23.967, 29.97, 59.94
    value = Decimal.div(frame, Math.ceil(fps)).mul(1.001)
  }
  else {
    // 24, 25, 30, 50, 60
    value = Decimal.div(frame, fps)
  }

  return value.toNumber()
}

/**
 * video要素に設定するcurrentTimeを取得する
 * @param sec 再生位置（秒）
 * @param fps フレームレート
 */
export function timeForVideo (sec: number, fps?: number): number {
  let value: Decimal | null = null

  if (sec > 0) {
    // videoのcurrentTimeとフレームがずれるので少し進めた時間にする
    if (fps) {
      // fpsの指定あり→フレームの1％進める
      value = Decimal.add(sec, durationPerFrame(fps) * 0.001)
    }
    else {
      // fpsの指定なし→1ミリ秒進める
      value = Decimal.add(sec, 0.001)
    }
  }

  return value ? value.toNumber() : sec
}

/**
 * nフレーム移動したtimeを取得
 * @param sec 秒
 * @param fps フレームレート
 * @param moveFrame 移動するフレーム数
 */
export function getMoveFrame (sec: number, fps: number, moveFrame: number): number {
  const frame = timeToFrame(sec, fps) // 秒数をフレームに変換
  return frameToTime(frame + moveFrame, fps) // 移動後のフレームを秒に変換
}

/**
 * 1フレームあたりの秒を取得
 * @param fps フレームレート
 * @return 秒
 */
function durationPerFrame (fps: number): number {
  let duration = 0

  if (fps % 1 !== 0) {
    // 23.976, 29.97, 59.94
    duration = 1.001 / Math.ceil(fps)
  }
  else if (fps > 0) {
    // 24, 25, 30, 50, 60
    duration = 1 / fps
  }

  return duration
}
