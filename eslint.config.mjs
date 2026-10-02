// eslint.config.mjs
// 基础规则来自 Nuxt 生成的 .nuxt/eslint.config.mjs（含 vue + typescript-eslint）
// 注意：TS 支持是 @nuxt/eslint-config 启动时探测「typescript 包是否存在」决定的，
// 所以 typescript 必须留在 devDependencies 里，删掉会让 .vue 的 lang="ts" 直接解析失败。
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // 组件名就是文件名（Search / Alert / Counter），单词名在本项目是刻意的：
    // 它们不与任何原生 HTML 标签重名。这条规则只会制造噪音，关掉。
    'vue/multi-word-component-names': 'off'
  }
})
