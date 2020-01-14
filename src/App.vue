<template lang="pug">
  #app
    nav.navbar.has-shadow(role="navigation" aria-label="main navigation")
      .navbar-brand
        a.navbar-item(href="/")
          img(src="./assets/logo.png")
          p.navbar-brand-name 簡単動画キャプチャ

    Upload
    PreviewVideo
    CaptureImages
    Capture
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Upload from './components/Upload.vue'
import PreviewVideo from './components/PreviewVideo.vue'
import Capture from './components/Capture.vue'
import CaptureImages from '@/components/CaptureImages.vue'

@Component({
  components: {
    Upload,
    PreviewVideo,
    Capture,
    CaptureImages,
  },
})
export default class App extends Vue {}
</script>

<style lang="scss">
  @import "./assets/css/bulma/bulma";
  @import "./assets/css/buefy/buefy";

  #app {
    min-height: 100vh;
    background-color: #fafafa;
    font-family: 'メイリオ', Meiryo, 'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3', 'ＭＳ Ｐゴシック', 'MS PGothic', 'MS UI Gothic', 'Helvetica', 'Arial', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .navbar-brand-name {
    margin-left: 0.4rem;
  }
</style>
