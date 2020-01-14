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
                button.button.is-small(@click="changeImageFormat('jpeg')", :class="{ 'is-info': imageFormat === 'jpeg' }") JPEG

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
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import * as captureModule from '@/store/modules/capture/types'
import CaptureImage from '@/components/CaptureImage.vue'

@Component({
  components: {
    CaptureImage,
  },
})
export default class Images extends Vue {
  get videoSrc () {
    return this.$store.state[captureModule.moduleName].video.src
  }

  get sortType () {
    return this.$store.state[captureModule.moduleName].picture.sortType
  }

  get imageFormat () {
    return this.$store.state[captureModule.moduleName].picture.imageFormat
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
</style>
