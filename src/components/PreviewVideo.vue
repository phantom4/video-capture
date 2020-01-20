<template lang="pug">
  section.section.has-text-centered.has-background-white.is-relative(v-show="hasVideo")
    h2.title.is-5 停止した位置がキャプチャされます
    p.video-filename.is-size-7.has-text-grey(v-show="videoFileName") {{ videoFileName }}
    .content
      video(:src="videoSrc" v-if="videoSrc" controls)
    .content
      //- コントロール
      .video-control
        .video-control__item.video-control__fps
          label.label.has-text-grey.is-small フレームレート
          .select.is-small
            select(v-model="videoFps")
              option 24
              option 25
              option 30
              option 50
              option 60

        .video-control__item.video-control__seek
          .is-inline-flex.buttons.is-centered.are-small
            button.button(@click.prevent="prevFrame" title="1フレーム戻る")
              span.icon
                img(src="../assets/back_frame.svg")
            button.button(@click.prevent="nextFrame" title="1フレーム進む")
              span.icon
                img(src="../assets/forward_frame.svg")

      p.help.has-text-grey フレームレートは手動で設定

    //- TODO アップロードした直後、5秒くらい再生して自動でfpsを計測したい

    .delete.is-medium(@click.prevent="remove")
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch, Mixins } from 'vue-property-decorator'
import * as scroll from 'scroll'
import Decimal from 'decimal.js'
import * as captureModule from '@/store/modules/capture/types'
import RemoveVideo from '@/mixins/RemoveVideo.vue'

@Component
export default class PreviewVideo extends Mixins(RemoveVideo) {
  $video: HTMLVideoElement | null = null
  isSeeking: boolean = false

  get videoSrc () {
    return this.$store.state[captureModule.moduleName].video.src
  }

  /**
   * アップロードされた動画のファイル名
   */
  get videoFileName () {
    return this.$store.state[captureModule.moduleName].uploaded.file.name || null
  }

  /**
   * videoがアップされているか
   */
  get hasVideo () {
    return this.videoSrc !== null
  }

  /**
   * 動画のフレームレート
   */
  get videoFps () {
    return this.$store.state[captureModule.moduleName].video.fps
  }

  set videoFps (value: number) {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.FPS}`, {
      fps: value,
    })
  }

  /**
   * 動画の再生位置
   */
  get currentTime () {
    return this.$store.state[captureModule.moduleName].video.currentTime
  }

  /**
   * 動画のイベント設定
   */
  addVideoEvent () {
    if (this.$video) {
      this.$video.addEventListener('play', this.onPlay)
      this.$video.addEventListener('pause', this.onPause)
      this.$video.addEventListener('seeking', this.onSeeking)
      this.$video.addEventListener('seeked', this.onSeeked)
      this.$video.addEventListener('timeupdate', this.onTimeUpdate)
    }
  }

  /**
   * 動画のイベントを解除
   */
  removeVideoEvent () {
    if (this.$video) {
      this.$video.removeEventListener('play', this.onPlay)
      this.$video.removeEventListener('pause', this.onPause)
      this.$video.removeEventListener('seeking', this.onSeeking)
      this.$video.removeEventListener('seeked', this.onSeeked)
      this.$video.removeEventListener('timeupdate', this.onTimeUpdate)
    }
  }

  /**
   * 動画が再生
   */
  onPlay () {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.PLAY}`)
  }

  /**
   * 動画が停止
   */
  onPause () {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.PAUSE}`)
  }

  /**
   * 動画のシーク開始
   */
  onSeeking (e: Event) {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.SEEK}`)
  }

  /**
   * 動画のシーク終了
   */
  onSeeked (e: Event) {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.SEEKED}`)
  }

  /**
   * 再生ヘッドが移動した
   */
  onTimeUpdate (e: Event) {
    if (this.$video) {
      this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.CURRENT_TIME}`, {
        time: this.$video.currentTime,
      })
    }
  }

  /**
   * videoのloadedmetadataイベントを取得
   * @param video
   */
  loadedMetaData (video: HTMLVideoElement): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        resolve(video)
      }
      else {
        const onLoadedMetaData = function (e: Event) {
          video.removeEventListener('loadedmetadata', onLoadedMetaData)
          resolve(video)
        }

        video.addEventListener('loadedmetadata', onLoadedMetaData)
      }
    })
  }

  /**
   * 1フレーム戻る
   */
  prevFrame () {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.PREV_FRAME}`)
  }

  /**
   * 1フレーム進む
   */
  nextFrame () {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.NEXT_FRAME}`)
  }

  /**
   * アップロード前の状態に戻す
   */
  remove () {
    this.clearPictureConfirm()
      .then(() => {
        this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.CLEAR}`)
        this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.PICTURE.CLEAR_ALL}`)
        this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.RESET_STATUS}`)
      })
  }

  @Watch('videoSrc')
  onChangeVideoSrc (src: string) {
    this.isSeeking = false

    if (src) {
      Vue.nextTick(() => {
        const $video = this.$el.querySelector('video')
        this.$video = $video

        if ($video) {
          this.loadedMetaData($video)
            .then((video) => {
              this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.INFO}`, {
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration,
              })
            })

          this.addVideoEvent()

          // プレビュー用の動画までスクロールする
          setTimeout(() => {
            const $scrollDoc = document.documentElement
            const clientRect = this.$el.getBoundingClientRect()
            const destY = Math.round(window.pageYOffset + clientRect.top)
            scroll.top($scrollDoc, destY, {
              duration: 500,
              ease: function (n) {
                return n === 1 ? n : 1 - Math.pow(2, -10 * n) // outExpo
              },
            })
          }, 500)
        }
      })

      this.removeVideoEvent()
    }
  }

  @Watch('currentTime')
  onChangeCurrentFrame (time: number) {
    // stateのcurrentTimeと差ができたら同期する（操作中でなければ）
    console.group('watch video.currentTime')
    console.log('video', this.$video)
    console.log('isPlaying', this.$store.state[captureModule.moduleName].video.isPlaying)
    console.log('isSeeking', this.$store.state[captureModule.moduleName].video.isSeeking)
    if (this.$video) {
      console.log(Decimal.sub(this.$video.currentTime, time).abs().toNumber(), this.$video.currentTime, time)
    }
    console.groupEnd()
    if (
      this.$video &&
      !this.$store.state[captureModule.moduleName].video.isPlaying &&
      !this.$store.state[captureModule.moduleName].video.isSeeking &&
      Decimal.sub(this.$video.currentTime, time).abs().toNumber() < 0.1
    ) {
      this.$video.currentTime = time
    }
  }
}
</script>

<style scoped lang="scss">
  @import "../assets/css/bulma/sass/utilities/initial-variables";

  video {
    width: 100%;
    max-width: 800px;
    vertical-align: top;  // 下の隙間を消す
    border: solid 1px $grey-lightest;
  }

  .video-filename {
    margin-bottom: 0.25rem;
  }

  .delete {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .video-control {
    display: inline-flex;
    align-items: center;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .video-control__item {
    &:not(:last-child) {
      margin-right: 1.5rem;
    }
  }

  .video-control__fps {
    display: inline-flex;
    align-items: center;

    label {
      margin-right: 0.5rem;
      margin-bottom: 0;
    }
  }
</style>
