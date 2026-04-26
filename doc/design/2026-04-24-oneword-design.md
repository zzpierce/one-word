# one-word 小程序设计文档

> 一个每天背一个单词的微信小程序

## 1. 项目概述

- **名称**：one-word（每天背一个单词）
- **平台**：微信小程序（Taro 4.2 + React + TypeScript + Sass）
- **核心功能**：选词 → 背诵 → 记录历史

## 2. 整体架构

```
src/
├── app.config.ts              # TabBar 配置（选词/历史）
├── app.tsx                    # 全局入口，包裹 AppContextProvider
├── pages/
│   ├── index/index.tsx        # 选词页（漂浮单词气泡）
│   ├── detail/detail.tsx      # 背诵页（单词详情 + 确认掌握）
│   └── history/history.tsx    # 历史记录页（按时间倒序）
├── components/
│   ├── FloatingWord.tsx       # 漂浮单词气泡组件
│   └── WordCard.tsx           # 背诵页单词信息卡片
├── context/
│   └── AppContext.tsx         # 全局状态管理（Context）
├── data/
│   └── vocabulary.json        # 本地词库（约 500 词）
├── utils/
│   └── storage.ts             # Taro Storage 封装
└── types/
    └── word.ts                # TypeScript 类型定义
```

## 3. 导航结构

底部 TabBar：

| Tab | 页面 | 图标 |
|-----|------|------|
| 选词 | `pages/index/index` | 书本图标 |
| 历史 | `pages/history/history` | 时钟图标 |

背诵页 `pages/detail/detail` 为二级页面，从选词页 navigateTo 进入。

## 4. 数据模型

### 4.1 单词（Word）

```typescript
interface Word {
  id: string;                    // 唯一标识
  spell: string;                 // 英文拼写
  phonetic: string;              // 音标
  meaning: string;               // 中文含义
  example: {                     // 例句
    en: string;                  // 英文例句
    cn: string;                  // 中文翻译
  };
  difficulty: 1 | 2 | 3;         // 难度：1=简单 2=中等 3=困难
}
```

### 4.2 学习记录（LearnRecord）

```typescript
interface LearnRecord {
  wordId: string;                // 关联单词 ID
  wordSpell: string;             // 单词拼写（冗余，方便展示）
  learnedAt: number;             // 掌握时间戳
}
```

## 5. 页面设计

### 5.1 选词页（pages/index/index）

**布局**：全屏背景，无滚动

**核心元素**：
- 漂浮单词气泡：以 CSS keyframes 动画实现上下左右随机漂移
- 难度分区：
  - 左侧区域（x: 0%~33%）：difficulty=1 的简单单词
  - 中间区域（x: 33%~66%）：difficulty=2 的中等单词
  - 右侧区域（x: 66%~100%）：difficulty=3 的困难单词
- 视觉区分：已背会的单词显示为灰色半透明，未背会的正常彩色
- 顶部显示「今日已背 N 个」

**交互**：
- 点击单词气泡 → 设置 currentWord → navigateTo 背诵页

### 5.2 背诵页（pages/detail/detail）

**布局**：垂直居中卡片 + 底部操作区

**核心元素**：
- 顶部：单词拼写（大号字体）+ 音标
- 中部：中文含义
- 底部：例句（英文 + 中文对照）
- 底部按钮区：
  - 「已掌握」主按钮：点击后记录学习历史
  - 辅助文字：今日已背进度

**交互**：
- 点击「已掌握」→ 调用 markAsLearned → navigateBack 返回选词页
- 同一单词多次掌握时更新原有记录时间（去重）

### 5.3 历史页（pages/history/history）

**布局**：标准列表页

**核心元素**：
- 顶部：累计掌握单词数统计
- 列表：按 learnedAt 时间戳倒序排列
- 每条记录：单词拼写 + 掌握日期 + 删除按钮
- 空状态：「还没有背过单词，去选词页开始吧」

**交互**：
- 左滑或点击删除按钮 → 确认删除 → 更新本地存储

## 6. 数据流

```
启动时
  └── AppContextProvider 初始化
      ├── 加载 vocabulary.json（词库）
      └── 读取 Taro Storage 中的 learn_history

选词页
  └── 渲染漂浮单词气泡
      ├── 已背会单词：灰色半透明
      └── 未背会单词：正常彩色
      └── 点击 → setCurrentWord(word) → navigateTo('/pages/detail/detail')

背诵页
  └── 从 Context 读取 currentWord 展示
      └── 点击「已掌握」→ markAsLearned(wordId)
          ├── 更新 learnHistory（去重：更新已有记录时间）
          ├── 写入 Taro Storage
          └── navigateBack()

历史页
  └── 从 Context 读取 learnHistory
      └── 按 learnedAt 倒序渲染列表
      └── 删除 → removeRecord(wordId) → 更新 Storage
```

## 7. 状态管理（AppContext）

```typescript
interface AppContextValue {
  // 数据
  vocabulary: Word[];                    // 词库（只读）
  currentWord: Word | null;              // 当前选中的单词
  learnHistory: LearnRecord[];           // 学习历史

  // 操作
  setCurrentWord: (word: Word) => void;  // 设置当前单词
  markAsLearned: (wordId: string) => void;  // 标记为已掌握
  removeRecord: (wordId: string) => void;   // 删除记录
  isLearned: (wordId: string) => boolean;   // 判断是否已背会
}
```

## 8. 数据持久化

- **词库**：`src/data/vocabulary.json` 内置打包，启动时同步加载
- **学习历史**：`Taro.setStorageSync('learn_history', records)`
- **Storage Key**：`learn_history`

## 9. 错误处理

| 场景 | 处理策略 |
|------|----------|
| 词库加载失败 | 启动检测，失败显示「词库加载失败，请重启小程序」 |
| Storage 读写异常 | try/catch 包裹，异常时降级到内存状态（本次会话有效，不持久化） |
| 空状态（无历史） | 历史页显示引导文案 + 跳转按钮 |
| 重复掌握 | 更新原有记录时间戳，不重复添加 |

## 10. 技术选型

| 技术点 | 选型 | 理由 |
|--------|------|------|
| 状态管理 | React Context | 状态简单，无需 Redux |
| 持久化 | Taro Storage | 小程序原生存储，轻量 |
| 动画 | CSS keyframes | 漂浮效果简单，性能优 |
| 样式 | Sass | 项目已配置，支持嵌套 |

## 11. 实现优先级

1. 词库数据 + 类型定义 + Storage 工具
2. AppContext 全局状态管理
3. 选词页（漂浮单词效果）
4. 背诵页（单词详情展示）
5. 历史页（列表 + 删除）
6. TabBar 配置 + 页面跳转
