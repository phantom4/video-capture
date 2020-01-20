import Vue from 'vue'
import { ActionContext, ActionTree, GetterTree, MutationTree, Module } from 'vuex'
import { Getter, Action, Mutation, IState, Picture, IPicture } from '@/store/modules/capture/types'
import { IRootState } from '@/store/types'
import * as videoUtil from '@/utility/video'

let pictureIndex = 0

const state: IState = {
  isSupportBrowser: true, // TODO Modernizrで処理する
  uploaded: {
    file: null,
  },
  status: {
    isUploaded: false,
    isLoadError: false,
    isCaptured: false,
  },
  element: {
    video: null,
    capture: {
      video: null,
      canvas: null,
      canvasContext: null,
    },
  },
  video: {
    src: null,
    width: 0,
    height: 0,
    duration: 0,
    currentTime: 0,
    fps: 30,
    isPlaying: false,
    isSeeking: false,
  },
  picture: {
    items: [],
    // TODO cookieから復元する
    sortType: 'created',
    imageFormat: 'jpeg',
    lastEditAt: null,
  },
}

const getters: GetterTree<IState, IRootState> = {
  [Getter.PICTURE.IMAGE_FORMAT_LABEL]: (state: IState): string => {
    let label = ''
    switch (state.picture.imageFormat) {
      case 'png':
        label = 'PNG'
        break
      case 'jpeg':
        label = 'JPG'
        break
      default:
        break
    }
    return label
  },
}

const mutations: MutationTree<IState> = {
  /**
   * 動画がアップロードされた
   * @param state
   * @param payload
   */
  [Mutation.UPLOADED]: (state: IState, payload: { file: File }) => {
    state.uploaded.file = payload.file
    state.status.isUploaded = true
  },

  /**
   * アップロードされた動画をクリア
   * @param state
   */
  [Mutation.CLEAR_UPLOADED]: (state: IState) => {
    state.uploaded.file = null
    state.status.isUploaded = false
  },

  /**
   * blobを設定する
   * @param state
   * @param payload
   * @param payload src Blob URL
   */
  [Mutation.VIDEO.SRC]: (state: IState, payload: { src: string }) => {
    if (state.video.src !== null) {
      // Blobを解放しておく
      URL.revokeObjectURL(state.video.src)
    }
    state.video.src = payload.src
  },

  /**
   * 動画の情報を設定する
   * @param state
   * @param payload
   * @param payload.width 幅
   * @param payload.height 高さ
   * @param payload.duration 再生時間
   */
  [Mutation.VIDEO.INFO]: (state: IState, payload: { width: number; height: number; duration: number; }) => {
    state.video.width = payload.width
    state.video.height = payload.height
    state.video.duration = payload.duration
  },

  /**
   * 動画のフレームレートを設定する
   * @param state
   * @param payload
   * @param payload.fps フレームレート
   */
  [Mutation.VIDEO.FPS]: (state: IState, payload: { fps: number }) => {
    state.video.fps = payload.fps
  },

  /**
   * 動画が再生された
   * @param state
   * @param payload
   */
  [Mutation.VIDEO.PLAY]: (state: IState) => {
    state.video.isPlaying = true
  },

  /**
   * 動画が再生された
   * @param state
   * @param payload
   */
  [Mutation.VIDEO.PAUSE]: (state: IState) => {
    state.video.isPlaying = false
  },

  /**
   * 動画がシークされた
   * @param state
   * @param payload
   */
  [Mutation.VIDEO.SEEK]: (state: IState) => {
    state.video.isSeeking = true
  },

  /**
   * 動画のシークが終了
   * @param state
   * @param payload
   */
  [Mutation.VIDEO.SEEKED]: (state: IState) => {
    state.video.isSeeking = false
  },

  /**
   * 動画の再生位置
   * @param state
   * @param payload
   * @param payload.time 再生位置
   */
  [Mutation.VIDEO.CURRENT_TIME]: (state: IState, payload: { time: number; }) => {
    state.video.currentTime = payload.time
  },

  /**
   * 次のフレームへ
   * @param state
   */
  [Mutation.VIDEO.PREV_FRAME]: (state: IState) => {
    const time = videoUtil.getMoveFrame(state.video.currentTime, state.video.fps, -1)
    const dest = videoUtil.timeForVideo(time) // video用の秒数に補正

    state.video.currentTime = Math.min(dest, state.video.duration)
  },

  /**
   * 前のフレームへ
   * @param state
   */
  [Mutation.VIDEO.NEXT_FRAME]: (state: IState) => {
    const time = videoUtil.getMoveFrame(state.video.currentTime, state.video.fps, 1)
    const dest = videoUtil.timeForVideo(time) // video用の秒数に補正

    state.video.currentTime = Math.min(dest, state.video.duration)
  },

  /**
   * アップロード前に戻す
   * @param state
   */
  [Mutation.VIDEO.CLEAR]: (state: IState) => {
    state.uploaded.file = null

    if (state.video.src !== null) {
      // Blobを解放しておく
      URL.revokeObjectURL(state.video.src)
    }

    state.video.src = null
    state.video.width = 0
    state.video.height = 0
    state.video.duration = 0
    state.video.currentTime = 0
    state.video.fps = 30
    state.video.isPlaying = false
    state.video.isSeeking = false
  },

  /**
   * ステータスをリセット
   * @param state
   */
  [Mutation.RESET_STATUS]: (state: IState) => {
    state.status.isUploaded = false
    state.status.isLoadError = false
    state.status.isCaptured = false
  },

  /**
   * キャプチャ画像を追加する
   * @param state
   * @param payload
   * @param payload.blobURL blobURL
   * @param payload.videoTime 動画の再生位置
   */
  [Mutation.PICTURE.ADD]: (state: IState, payload: { blobURL: { png: string, jpeg: string }, videoTime: number }) => {
    // 同じ秒数のキャプチャがあれば削除する
    for (let i = state.picture.items.length - 1; i >= 0; i--) {
      const item = state.picture.items[i]

      if (item.videoTime === payload.videoTime) {
        state.picture.items.splice(i, 1)
      }
    }

    state.picture.items.push({
      id: pictureIndex++,
      blobURL: payload.blobURL,
      videoTime: payload.videoTime,
      createdAt: new Date(),
    })

    state.picture.lastEditAt = new Date() // 日時を更新
  },

  /**
   * 指定のキャプチャ画像を削除する
   * @param state
   * @param payload
   */
  [Mutation.PICTURE.REMOVE]: (state: IState, payload: { id: number; }) => {
    let findIndex = -1

    // idが一致する要素を探す
    for (let i = 0, len = state.picture.items.length; i < len; i++) {
      const item = state.picture.items[i]
      if (item.id === payload.id) {
        findIndex = i
        break
      }
    }

    if (findIndex >= 0) {
      const removed: IPicture[] = state.picture.items.splice(findIndex, 1)

      // blobを解放
      for (let i = 0, len = removed.length; i < len; i++) {
        URL.revokeObjectURL(removed[i].blobURL.jpeg)
        URL.revokeObjectURL(removed[i].blobURL.png)
      }

      state.picture.lastEditAt = new Date() // 日時を更新
    }
  },

  /**
   * キャプチャ画像をクリアする
   * @param state
   */
  [Mutation.PICTURE.CLEAR_ALL]: (state: IState) => {
    // Blob URLを解放する
    for (let i = 0, len = state.picture.items.length; i < len; i++) {
      const item = state.picture.items[i]
      URL.revokeObjectURL(item.blobURL.jpeg)
      URL.revokeObjectURL(item.blobURL.png)
    }

    state.picture.items = []
  },

  /**
   * 並び順を変更する
   * @param state
   * @param payload
   * @param payload.sortType 並び順
   */
  [Mutation.PICTURE.SORT_TYPE]: (state: IState, payload: { sortType: Picture.SortType }) => {
    state.picture.sortType = payload.sortType
  },

  /**
   * 並び順を変更する
   * @param state
   * @param payload
   * @param payload.imageFormat 画像形式
   */
  [Mutation.PICTURE.IMAGE_FORMAT]: (state: IState, payload: { imageFormat: Picture.ImageFormat }) => {
    state.picture.imageFormat = payload.imageFormat
  },
}

const actions: ActionTree<IState, IRootState> = {

}

const store: Module<IState, IRootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}

export default store
