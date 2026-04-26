export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/detail/detail',
    'pages/history/history',
  ],
  tabBar: {
    list: [
      { pagePath: 'pages/index/index', text: '选词' },
      { pagePath: 'pages/history/history', text: '历史' },
    ],
    color: '#999999',
    selectedColor: '#07c160',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'one-word',
    navigationBarTextStyle: 'black',
  },
})
