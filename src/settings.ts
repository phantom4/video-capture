export const settings = {
  // アップロード可能な動画フォーマット
  allowFileTypes: [
    { type: 'video/mp4', ext: ['mp4'], label: ['MP4'] },
    { type: 'video/webm', ext: ['webm'], label: ['WebM'] },
    // TODO safariのみmovを許可する？
  ],
}
