<template lang="pug">
  section.section.has-background-white(v-if="videoSrc !== null")
    .capture-header
      //- メニュー
      .capture-menu
        .capture-menu__left
          .capture-menu__item
            h2.title.is-4 キャプチャ（{{ pictures.length }}）

        .capture-menu__right
          .capture-menu__item
            label.label.is-small 並び順
            .field.has-addons
              p.control
                button.button.is-small(@click="changeSortType('created')", :class="{ 'is-info': sortType === 'created' }") 生成順
              p.control
                button.button.is-small(@click="changeSortType('videoTime')", :class="{ 'is-info': sortType === 'videoTime' }") 再生順

          .capture-menu__item
            label.label.is-small 画像形式
            .field.has-addons
              p.control
                button.button.is-small(@click="changeImageFormat('png')", :class="{ 'is-info': imageFormat === 'png' }") PNG
              p.control
                button.button.is-small(@click="changeImageFormat('jpeg')", :class="{ 'is-info': imageFormat === 'jpeg' }") JPG

    .capture-body
      .columns.is-multiline
        CaptureImage(
          v-for="picture in pictures"
          :key="picture.id"
          :id="picture.id"
          :blobURL="picture.blobURL"
          :videoTime="picture.videoTime"
          :createdAt="picture.createdAt"
        )

    .capture-footer(v-show="pictures.length > 0")
      a(@click.prevent="downloadAll" :class="{ 'is-loading': status.downloadAll.isPlaying }").button
        span.icon: i.fas.fa-download
        span すべてダウンロード（{{ imageFormatLabel }}）
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import JSZip from 'jszip'
import * as dateFns from 'date-fns'
import { saveAs } from 'file-saver'
import * as captureModule from '@/store/modules/capture/types'
import * as blobUtil from '../utility/blob'
import * as contentType from '../constants/content_type'
import CaptureImage from '@/components/CaptureImage.vue'
import * as videoUtil from '@/utility/video'

interface IStatus {
  downloadAll: {
    isPlaying: boolean;
  }
}

@Component({
  components: {
    CaptureImage,
  },
})
export default class Images extends Vue {
  status: IStatus = {
    downloadAll: {
      isPlaying: false,
    },
  }

  get videoSrc () {
    return this.$store.state[captureModule.moduleName].video.src
  }

  get uploadedFile () {
    return this.$store.state[captureModule.moduleName].uploaded.file
  }

  get sortType () {
    return this.$store.state[captureModule.moduleName].picture.sortType
  }

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
   * キャプチャ画像
   */
  get pictures () {
    const items = this.$store.state[captureModule.moduleName].picture.items

    // 並び順を反映する
    let comparison
    switch (this.sortType) {
      case 'created':
        /**
         * 新しく再生した順
         * @param a
         * @param b
         */
        comparison = function (a: captureModule.IPicture, b: captureModule.IPicture) {
          return b.createdAt.getTime() - a.createdAt.getTime()
        }
        break

      case 'videoTime':
        /**
         * 動画の時間順
         * @param a
         * @param b
         */
        comparison = function (a: captureModule.IPicture, b: captureModule.IPicture) {
          return a.videoTime - b.videoTime
        }
        break

      default:
        break
    }

    return items.sort(comparison)
  }

  /**
   * 並び順を変更する
   */
  changeSortType (sortType: captureModule.Picture.SortType) {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.PICTURE.SORT_TYPE}`, {
      sortType,
    })
  }

  /**
   * 画像形式を変更する
   */
  changeImageFormat (imageFormat: captureModule.Picture.ImageFormat) {
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.PICTURE.IMAGE_FORMAT}`, {
      imageFormat,
    })
  }

  /**
   * キャプチャ画像を一括ダウンロード
   */
  downloadAll () {
    this.status.downloadAll.isPlaying = true

    const items: { blobURL: string; blob: Blob | null; videoTime: number; }[] = this.pictures.map((picture: captureModule.IPicture) => {
      const blobURL = this.imageFormat === 'jpeg' ? picture.blobURL.jpeg : picture.blobURL.png
      return {
        blobURL,
        blob: null,
        videoTime: picture.videoTime,
      }
    })

    // Blob URLからBlobに変換するPromise
    const tasks = items.map((item: { blobURL: string; videoTime: number; }) => {
      return blobUtil.blobUrlToBlob(item.blobURL)
    })

    Promise.all(tasks)
      .then((blobs) => {
        // blobをzipファイルにしてダウンロード

        // 変換したBlobをitemsにマージする
        for (let i = 0, l = items.length; i < l; i++) {
          items[i].blob = blobs[i]
        }

        const fileName = videoUtil.parsedFileName(this.uploadedFile.name)  // ファイル名
        const lastEditAt = this.$store.state[captureModule.moduleName].picture.lastEditAt || new Date() // 最後に編集された日時。編集内容ごとにファイル名を変えるため
        const date = dateFns.format(lastEditAt || new Date(), 'yyyy-MM-dd HH.mm.ss')
        const zip = new JSZip()
        const images = zip.folder(`${fileName.name}_${date}`) // フォルダーを作成

        // ファイルを追加していく
        items.forEach((item, index) => {
          let ext: string = ''  // 拡張子
          if (item.blob) {
            const type = contentType.map.get(item.blob.type) // content type
            ext = type ? `.${type.ext[0]}` : '' // 拡張子。不明の場合はなし
          }
          const videoTime = videoUtil.timeToFileName(item.videoTime) // 動画の秒数をファイル名用に変換

          if (item.blob) {
            images.file<'blob'>(`${videoTime}${ext}`, item.blob)
          }
        })

        // zipを生成
        zip
          .generateAsync({
            type: 'blob',
          })
          .then((content) => {
            saveAs(content, `${fileName.name}_${date}.zip`)
            this.status.downloadAll.isPlaying = false
          })
      })
      .catch((error) => {
        console.error(error)
        // TODO エラー処理
      })

    // TODO Blob URLをBlobに変換
    // TODO zipに圧縮
  }
}
</script>

<style scoped lang="scss">
  @import "../assets/css/bulma/sass/utilities/initial-variables";

  section {
    min-height: 100vh;
  }

  .capture-menu {
    margin-bottom: 1.5rem;

    @media (min-width: $tablet) {
      display: flex;
      align-items: center;
    }
  }

  .capture-menu__left {
    @media (max-width: $tablet - 1px) {
      margin-bottom: 1.25rem;
    }
  }

  .capture-menu__right {
    @media (min-width: $tablet) {
      margin-left: auto;
    }
  }

  .capture-menu__item {

    @media (max-width: $tablet - 1px) {
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    @media (min-width: $tablet) {
      display: inline-flex;
      align-items: center;
    }

    &:not(:last-child) {
      margin-right: 1.5rem;
    }

    .label {
      @media (min-width: $tablet) {
        margin-right: 0.5rem;
        margin-bottom: 0;
      }
    }
  }

  .capture-footer {
    margin-top: 2.5rem;
    text-align: center;
  }
</style>
