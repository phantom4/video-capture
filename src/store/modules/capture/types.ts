
// モジュール名
export const moduleName = 'capture'

export const Getter = {

}

export const Mutation = {
  UPLOADED: 'uploaded',
  CLEAR_UPLOADED: 'clearUploaded',
  RESET_STATUS: 'resetStatus',
  VIDEO: {
    SRC: 'video.src',
    INFO: 'video.info',
    PLAY: 'video.play',
    PAUSE: 'video.pause',
    SEEK: 'video.seek',
    SEEKED: 'video.seeked',
    CURRENT_TIME: 'video.currentTime',
    CLEAR: 'video.clear',
  },
  PICTURE: {
    ADD: 'picture.add',
    REMOVE: 'picture.remove',
    CLEAR_ALL: 'picture.clearAll',
    SORT_TYPE: 'picture.sortType',
    IMAGE_FORMAT: 'picture.imageFormat',
  },
}

export const Action = {

}

export interface IPicture {
  id: number  // ID
  blobURL: {
    jpeg: string  // キャプチャ画像（jpeg）のBlob URL
    png: string // キャプチャ画像（png）のBlob URL
  }
  videoTime: number // キャプチャした動画の再生位置
  createdAt: Date  // キャプチャした時間
}

export namespace Picture {
  export type SortType = 'created' | 'videoTime' // 画像の並び順
  export type ImageFormat = 'png' | 'jpeg' // 画像形式
}

export interface IStatus {
  isUploaded: boolean // アップロードされたか
  isLoadError: boolean  // ファイルの読み込みに失敗した
  isCaptured: boolean // サムネイルが作成できた
}

// state
export interface IState {
  isSupportBrowser: boolean // サポートされているブラウザか

  // アップロードされた動画ファイル
  uploaded: {
    file: File | null
  }

  // ステータス
  status: IStatus

  // 要素
  element: {
    video: HTMLVideoElement | null
    capture: {
      video: HTMLVideoElement | null
      canvas: HTMLCanvasElement | null
      canvasContext: CanvasRenderingContext2D | null
    }  // キャプチャ用の要素
  }

  // アップロードされた動画
  video: {
    src: Blob | null
    width: number
    height: number
    duration: number
    currentTime: number  // 再生ヘッド
    fps: number  // フレームレート
    isPlaying: boolean  // 再生中？
    isSeeking: boolean  // シーク中？
  }

  // キャプチャした画像
  picture: {
    items: IPicture[]
    sortType: Picture.SortType
    imageFormat: Picture.ImageFormat
  }
}
