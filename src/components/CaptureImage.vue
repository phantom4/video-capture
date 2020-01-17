<template lang="pug">
  .column.is-12-mobile.is-4-tablet.is-3-desktop
    .card
      //- モードによって表示する画像を変える
      //- TODO ダウンロードのファル名を設定する（アップロードしたファイル名_秒数？）
      .card-image
        a.is-block(@click.prevent="isModalActive = true")
          template(v-if="imageFormat === 'png'")
            img(:src="blobURL.png").capture-image
          template(v-else-if="imageFormat === 'jpeg'")
            img(:src="blobURL.jpeg").capture-image
        .videoTime.has-text-white-bis {{ videoTime | videoTimeFormat }}

        button.button.is-danger.is-small.is-outlined.remove-capture(title="削除", @click.prevent="remove")
          span.icon
            i.fas.fa-minus

      .card-footer
        a(:href="downloadFile" :download="downloadFileName").card-footer-item.picture-download
          span.icon: i.fas.fa-download
          | ダウンロード（{{ imageFormatLabel }}）

    b-modal(:active.sync="isModalActive" :width="videoWidth").expand-image
      p.image
        template(v-if="imageFormat === 'png'")
          img(:src="blobURL.png")
        template(v-else-if="imageFormat === 'jpeg'")
          img(:src="blobURL.jpeg")
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import Buefy from 'buefy'
import * as _ from 'lodash'
import { Decimal } from 'decimal.js'
import anime from 'animejs'
import * as captureModule from '@/store/modules/capture/types'
import * as videoUtil from '../utility/video'

Vue.use(Buefy)

@Component({
  filters: {
    /**
     * 秒数
     * @param time 秒
     */
    videoTimeFormat (time: number): string {
      // 0:00.000のフォーマットにする
      const values = {
        minutes: Decimal.div(time, 60).floor(), // 分
        sec: Decimal.mod(time, 60).floor(),  // 秒
        msec: Decimal.sub(time, Math.floor(time)),  // ミリ秒（0.xxx...）
      }

      const minutes = values.minutes.toString()
      const sec = _.padStart(values.sec.toString(), 2, '0')
      const msec = _.padEnd(values.msec.toString().replace(/^0\./, '').slice(0, 3), 3, '0')

      return `${minutes}:${sec}.${msec}`
    },
  },
})
export default class CaptureImage extends Vue {
  @Prop() id!: number
  @Prop() blobURL!: { png: string, jpeg: string }
  @Prop() videoTime!: number
  @Prop() createdAt!: Date

  isModalActive: boolean = false

  /**
   * キャプチャ画像のフォーマット
   */
  get imageFormat () {
    return this.$store.state[captureModule.moduleName].picture.imageFormat
  }

  /**
   * 出力画像のフォーマットラベル
   */
  get imageFormatLabel () {
    return this.$store.getters[`${captureModule.moduleName}/${captureModule.Getter.PICTURE.IMAGE_FORMAT_LABEL}`]
  }

  /**
   * ダウンロードするファイル
   */
  get downloadFile () {
    return (this.imageFormat === 'jpeg') ? this.blobURL.jpeg : this.blobURL.png
  }

  /**
   * ダウンロードするファイル名
   */
  get downloadFileName () {
    const uploadedFile = this.$store.state[captureModule.moduleName].uploaded.file
    let result = '' // ファイル名

    if (uploadedFile) {
      const parsedFileName = videoUtil.parsedFileName(uploadedFile.name)  // ファイル名と拡張子を分割
      const videoTime = videoUtil.timeToFileName(this.videoTime) // 動画の秒数をファイル名用に変換
      const ext = (this.imageFormat === 'jpeg') ? '.jpg' : '.png' // 拡張子

      result = `${parsedFileName.name}_screenshot-${videoTime}${ext}`
    }

    return result
  }

  /**
   * 動画の幅
   */
  get videoWidth () {
    return this.$store.state[captureModule.moduleName].video.width
  }

  mounted () {
    const $captureImage = this.$el.querySelector('.capture-image')
    if ($captureImage) {
      anime({
        targets: $captureImage,
        opacity: 1,
        easing: 'easeOutQuad',
        duration: 600,
      })
    }
  }

  /**
   * キャプチャ画像を削除
   */
  remove () {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.PICTURE.REMOVE}`, {
      id: this.id,
    })
  }
}
</script>

<style scoped lang="scss">
  @import "../assets/css/bulma/sass/utilities/initial-variables";
  @import "../assets/css/bulma/sass/utilities/functions";
  @import "../assets/css/bulma/sass/utilities/derived-variables";

  .capture-image {
    opacity: 0; // jsで表示
    vertical-align: top;  // 画像下の隙間を消す
  }

  // 削除ボタン
  .remove-capture {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    border-radius: 290486px !important;
    opacity: 0.8;

    &:hover,
    &:active,
    &:focus {
      opacity: 1;
    }
  }

  .format,
  .videoTime {
    position: absolute;
    bottom: 0.4rem;
    font-size: 0.625rem;
    padding: 0.05rem 0.25rem;
  }

  // 動画の時間
  .videoTime {
    right: 0.4rem;
    background-color: rgba(#212121, 0.8);
  }

  .picture-download {
    font-size: 0.875rem;
    color: $grey;

    .icon {
      color: $grey-light;
    }

    &:hover,
    &:active,
    &:focus {
      color: $grey-dark;

      .icon {
        color: $grey-darker;
      }
    }
  }

  // 拡大イメージ
  .expand-image {
    .image {
      img {
        width: 100%;
      }
    }
  }
</style>
