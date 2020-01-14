<template lang="pug">
  section.section.has-text-centered.has-background-white.is-relative(v-show="hasVideo")
    h2.title.is-5 停止した位置がキャプチャされます
    video(:src="videoSrc" v-if="videoSrc" controls)

    .delete.is-medium(@click.prevent="remove")

    //- TODO フレームで移動できるといいな
    //- TODO アップロードした直後、5秒くらい？でfpsを計測したい
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch, Mixins } from 'vue-property-decorator'
import * as scroll from 'scroll'
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
   * videoがアップされているか
   */
  get hasVideo () {
    return this.videoSrc !== null
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
    console.log('src', src)
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

  .delete {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }
</style>
