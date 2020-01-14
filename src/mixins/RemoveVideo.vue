<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import * as captureModule from '@/store/modules/capture/types'

@Component
export default class RemoveVideo extends Vue {
  /**
   * キャプチャをクリアするかの確認ダイアログ
   */
  clearPictureConfirm () {
    return new Promise((resolve, reject) => {
      if (this.$store.state[captureModule.moduleName].picture.items.length > 0) {
        // すでにキャプチャが存在している場合はアラートを表示
        if (window.confirm('ダウンロードしていないキャプチャは破棄されますがよろしいですか？')) {
          resolve()
        }
        else {
          reject(new Error('picture not clear.'))
        }
      }
      else {
        // キャプチャ履歴なしなら、そのまま処理
        resolve()
      }
    })
  }
}
</script>
