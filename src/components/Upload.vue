<template lang="pug">
  section.section(:class="{ 'is-compact': status.isUploaded }")
    .container.has-text-centered
      .header
        h1.title.is-1.has-text-grey-dark 簡単動画キャプチャ
        p.has-text-grey-dark.is-size-5 キャプチャしたい位置で動画を停止するだけ

      .upload.is-inline-block
        .upload-box
          .content
            form()
              label.select-file
                input.file.is-hidden(type="file", accept="video/*")
                .button.is-medium(:class="{ 'is-primary' : !status.isUploaded }")
                  span.icon: i.fas.fa-upload
                  span 動画をアップロード
            p.has-text-grey-dark または 動画をここにドラッグ＆ドロップ

          .content
            p.help.is-size-7.has-text-grey アップロード可: {{allowMediaFormat}}

    //- ドラッグ&ドロップでアップロードするときのオーバーレイ
    .drop-zone.is-overlay.has-text-centered(:class="{ 'is-active': isDragOver }")
      div
        p.icon.is-size-1.has-text-white-ter.animated.infinite.slideOutUp
          i.fas.fa-arrow-up
        p.is-size-3.has-text-white-bis ドロップするとアップロードできます
</template>

<script lang="ts">
import { Component, Vue, Watch, Mixins } from 'vue-property-decorator'
import * as _ from 'lodash'
import * as captureModule from '@/store/modules/capture/types'
import { settings } from '@/settings'
import RemoveVideo from '@/mixins/RemoveVideo.vue'

@Component
export default class Upload extends Mixins(RemoveVideo) {
  $fileInput: HTMLInputElement | null = null  // アップロード用のinput
  isDragOver: boolean = false // ドラッグでアップロードしようとしている

  mounted () {
    if (this.isSupportBrowser) {
      // input fileでファイルをアップロード
      this.$fileInput = this.$el.querySelector('.file') // アップロード用input

      if (this.$fileInput) {
        this.$fileInput.addEventListener('change', this.onUploadByInput)
      }

      // ドラッグ＆ドロップでファイルをアップロード
      const $dropZone = this.$el.querySelector('.drop-zone') // ドラッグでアップロード用

      window.addEventListener('dragenter', () => {
        this.isDragOver = true
      })

      if ($dropZone) {
        // ドラッグされたときの表示を処理
        $dropZone.addEventListener('dragenter', (e) => {
          this.allowDrag(e as DragEvent)
        })
        $dropZone.addEventListener('dragover', (e) => {
          this.allowDrag(e as DragEvent)
        })
        $dropZone.addEventListener('dragleave', () => {
          this.isDragOver = false
        })

        // ファイルを受け付ける
        $dropZone.addEventListener('drop', (e) => {
          this.onUploadByDrop(e as DragEvent)
        })
      }

      // // キャプチャ用の動画のイベントを検知したらキャプチャする
      // this.element.captureVideo.addEventListener('timeupdate', this.captureVideo);
      // this.element.captureVideo.addEventListener('loadeddata', () => {
      //   console.log('loadeddata');
      //
      //   // 動画が変わったときにキャプチャする
      //   setTimeout(() => {
      //     this.captureVideo();
      //   }, 1000);
      // });
    }
  }

  // methods

  /**
   * ファイルのドラッグを許可する
   * コレがないとドラッグでファイルを表示してしまう
   * @param e
   */
  allowDrag (e: DragEvent) {
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
    e.preventDefault()
  }

  /**
   * input fileでアップロードされた
   * @param e
   */
  onUploadByInput (e: Event) {
    this.isDragOver = false
    if (this.$fileInput && this.$fileInput.files) {
      this.onUploaded(this.$fileInput.files[0])
    }
  }

  /**
   * ドロップでアップロードされた
   * @param e
   */
  onUploadByDrop (e: DragEvent) {
    e.preventDefault()
    this.isDragOver = false

    if (e.dataTransfer) {
      const files = e.dataTransfer.files  // ファイル

      if (files.length > 0) {
        this.onUploaded(files[0])
      }
    }
  }

  /**
   * ファイルがアップロードされた
   * @param file
   */
  onUploaded (file: File) {
    // // ステータスをリセットする
    // this.resetStatus();
    // this.status.isUploaded = true;

    // // ダウンロードのリンクをリセットする
    // this.resetDownloadLink();
    // TODO キャプチャ履歴をクリアする

    // // canvasをクリアする
    // this.element.context2d.clearRect(0, 0, this.element.canvas.width, this.element.canvas.height);

    console.log('file', file)

    if (_.includes(_.map(settings.allowFileTypes, 'type'), file.type)) {
      // 許容するファイル形式なら保持
      this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.UPLOADED}`, {
        file,
      })
    }
    else {
      // 許可されたファイルフォーマットではない→クリア
      this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.CLEAR_UPLOADED}`)
      window.alert(`${this.allowMediaFormat} のみサポートしています`)
    }
  }

  /**
   * アップロードされた動画をBlobに変換
   * @param file
   */
  toBlobURL (file: File) {
    const blob = URL.createObjectURL(file)
    this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.VIDEO.SRC}`, {
      src: blob,
    })
  }

  // computed

  /**
   * アップロード可能なファイルフォーマットの文字列
   */
  get allowMediaFormat (): string {
    const ext = _.spread(_.union)((_.map(settings.allowFileTypes, 'label'))) // 許可するフォーマットのラベル
    return ext.join(', ')
  }

  get isSupportBrowser (): boolean {
    return this.$store.state[captureModule.moduleName].isSupportBrowser
  }

  get status (): captureModule.IStatus {
    return this.$store.state[captureModule.moduleName].status
  }

  get uploadedFile (): string {
    return this.$store.state[captureModule.moduleName].uploaded.file
  }

  @Watch('uploadedFile')
  onFileChanged (file: File | null) {
    if (file) {
      this.clearPictureConfirm()
        .then(() => {
          // キャプチャをクリアする
          this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.PICTURE.CLEAR_ALL}`)
          this.toBlobURL(file)
        })
      // if (this.$store.state[captureModule.moduleName].picture.items.length > 0) {
      //   // すでに存在している場合はアラートを表示
      //   if (window.confirm('生成したキャプチャがクリアされますがよろしいですか？')) {
      //     // キャプチャをクリア
      //     this.$store.commit(`${captureModule.moduleName}/${captureModule.Mutation.PICTURE.CLEAR_ALL}`)
      //     this.toBlobURL(file)
      //   }
      // }
      // else {
      //   this.toBlobURL(file)
      // }
    }
  }
}
</script>

<style scoped lang="scss">
  @import "src/assets/css/bulma/sass/utilities/initial-variables";

  // アップロード
  .upload {
    input[type="file"] {
      cursor: pointer;
    }

    form {
      margin-bottom: 1rem;
    }
  }

  .upload-box {
    @media (max-width: $tablet - 1px) {
      padding-top: 4rem;
      padding-bottom: 4rem;
    }

    @media (min-width: $tablet) {
      padding: 4rem;
    }
  }

  // ファイル選択のフォーム
  .select-file {
    overflow: hidden;
  }

  // ドラッグでアップロードするエリア
  .drop-zone {
    display: none;

    &.is-active {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      border: solid 5px rgba(#0097a7, 0.9);
      background-color: rgba(#0097a7, 0.6);
      box-sizing: border-box;
      z-index: 40;
    }

    > * {
      pointer-events: none;
    }
  }

  // コンパクト（動画アップロード後）表示
  section.is-compact {
    .header {
      display: none;
    }

    .upload-box {
      padding: 0;
    }
  }
</style>
