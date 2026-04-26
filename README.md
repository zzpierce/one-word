# OneWord

一个简洁的微信小程序，每天背个单词。

## 功能

- **选词页面**：单词以浮动气泡形式展示，按难度分为三列（简单、中等、困难），已掌握的单词会显示为灰色
- **单词详情**：展示单词拼写、音标、释义和例句，可点击"已掌握"标记学习完成
- **学习历史**：查看已背过的单词及学习时间，支持删除记录
- **今日统计**：首页和历史页均显示当日已背单词数量

## 技术栈

- [Taro](https://taro.zone/) 4.2 — 跨端开发框架
- React 18 + TypeScript
- Sass
- Vite（编译工具）

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动微信小程序开发模式
pnpm dev:weapp
```

然后打开**微信开发者工具**，选择"导入项目"，路径指向本项目下的 `dist/` 目录。

## 项目结构

```
src/
├── app.tsx              # 应用入口
├── app.config.ts        # 全局页面与 TabBar 配置
├── pages/
│   ├── index/           # 选词页
│   ├── detail/          # 单词详情页
│   └── history/         # 学习历史页
├── components/          # 公共组件（FloatingWord、WordCard）
├── context/
│   └── AppContext.tsx   # 全局状态（词库、学习记录、当前选中单词）
├── data/
│   └── vocabulary.json  # 静态词库数据
├── utils/
│   └── storage.ts       # Taro 本地存储封装
└── types/
    └── word.ts          # TypeScript 类型定义
```

## 数据说明

- 词库为本地静态 JSON，无后端服务
- 学习记录通过 `Taro.setStorageSync` 持久化存储到本地
