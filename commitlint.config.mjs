/**
 * 提交信息规范 —— 只有写成 conventional commits，CHANGELOG 才生成得出来。
 * 用法：<type>(<scope>): <subject>，例如 feat(search): 搜索无结果时图标变红
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 描述用中文，不适用英文的 case 规则
    'subject-case': [0],
    // 中文一个字符算一个长度，标题放宽到 100
    'header-max-length': [2, 'always', 100],
    // 正文里常贴长 diff / 链接，不做行长限制
    'body-max-line-length': [0]
  }
}
