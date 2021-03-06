<template lang="pug">
  //- TEST
  .container
    video
    canvas
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import Decimal from 'decimal.js'
import * as captureModule from '@/store/modules/capture/types'
import * as videoUtil from '@/utility/video'

interface Size {
  width: number;
  height: number;
}

@Component
export default class Capture extends Vue {
  $video: HTMLVideoElement | null = null
  $canvas: HTMLCanvasElement | null = null
  $canvasContext: CanvasRenderingContext2D | null = null
  isPlaying: boolean = false  // キャプチャ中
  debounceTimer: number = NaN // 処理を間引くタイマー
  detectCaptureTimer: number = NaN // キャプチャ用のvideoが移動されたか確認するためにタイマー

  mounted () {
    this.$video = this.$el.querySelector('video')
    this.$canvas = this.$el.querySelector('canvas')

    if (this.$canvas) {
      this.$canvasContext = this.$canvas.getContext('2d')
    }
  }

  // computed

  get video () {
    return this.$store.state[captureModule.moduleName].video
  }

  /**
   * 動画のサイズ
   * @return object
   * @return object.width 幅
   * @return object.height 高さ
   */
  get videoSize (): Size {
    const video = this.$store.state[captureModule.moduleName].video
    return {
      width: video.width,
      height: video.height,
    }
  }

  // methods

  /**
   * キャプチャ処理
   */
  capture () {
    // ちゃんと止めたタイミングを検知するため、デバウンス処理をする（意図しないキャプチャを減らす）
    if (!isNaN(this.debounceTimer)) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = Number(setTimeout(() => {
      this.debounceTimer = NaN
      this.captureVideo()
    }, 1000))
    // NodeJS.Timeout型になってしまうので、Numberでキャストしておく
  }

  /**
   * キャプチャ処理
   */
  private captureVideo () {
    if (!this.isPlaying &&
      this.video.src !== null &&
      !this.video.isPlaying &&
      !this.video.isSeeking
    ) {
      // console.group('captureVideo')
      // console.log('captureVideo', new Date())
      // console.log('isPlaying: ', !this.isPlaying)
      // console.log('video.src: ', this.video.src)
      // console.log('video.isPlaying: ', !this.video.isPlaying)
      // console.log('video.isSeeking: ', !this.video.isSeeking)
      // console.groupEnd()

      // 動画の再生位置を設定
      if (this.$video) {
        this.isPlaying = true

        // 実際の秒数から少しだけ進める
        // ブラウザによって同じcurrentTimeでも違うフレームが表示されることがある
        const destCurrentTime = videoUtil.timeForVideo(this.video.currentTime)

        this.seekVideo(destCurrentTime)
          .then(() => {
            if (
              this.$canvas &&
              this.$canvasContext &&
              this.$video
            ) {
              const videoTime = this.$video.currentTime

              // video→canvas
              this.$canvasContext.drawImage(this.$video, 0, 0, this.videoSize.width, this.videoSize.height)

              // canvasをキャプチャ
              Promise.all([
                this.videoToBlob('jpeg'),
                this.videoToBlob('png'),
              ])
                .then((values) => {
                  const jpeg = values[0]
                  const png = values[1]

                  // キャプチャを追加する
                  this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.PICTURE.ADD}`, {
                    blobURL: {
                      png: window.URL.createObjectURL(png),
                      jpeg: window.URL.createObjectURL(jpeg),
                    },
                    videoTime,
                  })

                  this.isPlaying = false
                })
                .catch(() => {
                  this.isPlaying = false
                })
            }
            else {
              // 諦める
              this.isPlaying = false
            }
          })
          .catch(() => {
            this.isPlaying = false
          })
      }
    }
  }

  /**
   * キャプチャ用動画の再生位置を設定
   */
  private seekVideo (time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.$video && isNaN(this.detectCaptureTimer)) {
        let retry = 8 // リトライ

        this.$video.currentTime = time

        // currentTimeが反映されるまで待つ
        // ミリ秒まで完全に一致しないことがあるので、100ミリ秒以下の誤差まで許容する
        this.detectCaptureTimer = Number(setTimeout(() => {
          if (this.$video && Decimal.sub(this.$video.currentTime, time).abs().toNumber() < 0.1) {
            // currentTimeが反映されてもvideoは動いていないことがあるので、反映されてるまで待つ
            setTimeout(() => {
              clearTimeout(this.detectCaptureTimer)
              this.detectCaptureTimer = NaN
              resolve()
            }, 500)
          }
          else {
            if (retry >= 0) {
              retry--
            }
            else {
              // 諦める
              clearTimeout(this.detectCaptureTimer)
              this.detectCaptureTimer = NaN
              reject(new Error('can\'t seek'))
            }
          }
        }, 250))
      }
      else {
        if (this.$video === null) {
          reject(new Error('video is null'))
        }
        else {
          reject(new Error('capture is playing'))
        }
      }
    })
  }

  /**
   * 動画（のcanvas）をblobに変換する
   * @param type 画像形式
   */
  private videoToBlob (type: 'jpeg' | 'png' = 'png'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (this.$canvas) {
        const mimeType: string | undefined = (type === 'jpeg') ? 'image/jpeg' : undefined  // 書き出し形式
        const quality = (type === 'jpeg') ? 0.9 : null  // jpegのときの画質

        this.$canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          }
          else {
            reject(new Error('blob is null'))
          }
        }, mimeType, quality)
      }
      else {
        reject(new Error('canvas is null'))
      }
    })
  }

  // watch

  @Watch('video.src')
  onChangeVideoSrc (src: string) {
    if (this.$video) {
      if (src) {
        this.$video.src = src
      }
    }
  }

  @Watch('videoSize')
  onChangeVideoSize (size: Size) {
    // 動画のサイズを設定
    if (this.$video) {
      this.$video.width = size.width
      this.$video.height = size.height
    }

    // キャプチャ用のcanvasのサイズを設定
    if (this.$canvas) {
      this.$canvas.width = size.width
      this.$canvas.height = size.height
    }
  }

  @Watch('video.src')
  onSrcChanged (src: Blob | null) {
    // 動画が選択されたときにキャプチャする
    this.capture()
  }

  @Watch('video.currentTime')
  onTimeUpdate (time: number) {
    // 再生位置が変更されたらキャプチャする
    this.capture()
  }

  @Watch('video.isPlaying')
  onChangePlaying (isPlaying: boolean) {
    // 停止されたらキャプチャを撮る
    this.capture()
  }

  @Watch('video.isSeeking')
  onChangeSeeking (isSeeking: boolean) {
    // シーク完了でキャプチャを撮る
    this.capture()
  }
}
</script>

<style scoped lang="scss">
  .container {
    display: none;
  }

  video {
    max-width: none;
  }
</style>
