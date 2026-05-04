# 选词页"词海"重构设计文档

> 重构 `pages/index/index` 选词页：从绝对定位漂浮气泡改为 5 行 × 40 列横向滚动网格，按难度渐变着色，底部 1/4 区域为选中词详情面板。

- **基准日期**：2026-05-04
- **影响范围**：`src/pages/index/`、`src/components/FloatingWord.{tsx,scss}`、新增 `WordOcean`、`WordDetailPanel` 组件
- **不影响**：`pages/detail`、`pages/history`、`AppContext`、`vocabulary.json`、`storage.ts`、`types/word.ts`、`app.config.ts`

---

## 1. 背景与目标

### 1.1 现状
当前选词页 `src/pages/index/index.tsx` 把 200 个单词按难度分到屏幕左 / 中 / 右三个垂直区域，每个气泡通过 `position: absolute` + 哈希算出 `left/top` + CSS keyframes 上下漂浮动画呈现。

存在的问题：
- 气泡随机位置容易重叠、视觉信息密度低
- 整页能看到的词数量有限（受屏幕高度限制）
- 难度分区是离散的"三柱"，难度之间没有视觉过渡

### 1.2 目标
- 在一个**横向可滚动**的多行网格里展示全部 200 词
- 通过**色彩沿水平轴渐变**（绿 → 青 → 紫 → 粉）直观传达难度从易到难的过渡
- 顶部 3/4 是词海，底部 1/4 是"选中词详情面板"，做成两步交互（先选词、再点"去背诵"）

---

## 2. 整体布局

```
┌──────────────────────────────────────┐
│ 选一个单词开始背诵                    │  顶部标题区（固定 80px）
│ 今日已背 N 个                         │
├──────────────────────────────────────┤
│ ←─ ScrollView（scrollX）─────────→   │
│ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ...        │
│ ├─┤ ├─┤ ├─┤ ├─┤ ├─┤ ├─┤             │
│ ├─┤ ├─┤ ├─┤ ├─┤ ├─┤ ├─┤             │  词海容器（flex: 3）
│ ├─┤ ├─┤ ├─┤ ├─┤ ├─┤ ├─┤             │  5 行 × 40 列
│ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘             │
├──────────────────────────────────────┤
│  apple   /ˈæp.əl/    难度 1          │
│  苹果                                 │  详情面板（flex: 1）
│                       [去背诵]        │
└──────────────────────────────────────┘
```

| 区域 | 高度策略 | 内容 |
|------|----------|------|
| 顶部标题 | 固定 80 px | "选一个单词开始背诵" + "今日已背 N 个" |
| 词海容器 | `flex: 3` 占据剩余高度的 3/4 | `<ScrollView scrollX>` + 5 行 × 40 列 grid |
| 详情面板 | `flex: 1` 占据剩余高度的 1/4 | 选中单词的拼写、音标、难度、含义 + "去背诵"主按钮 |

页面根容器使用纵向 flex（`min-height: 100vh; display: flex; flex-direction: column`）。标题区固定 80 px，剩余空间由词海（flex 3）与面板（flex 1）按 3:1 瓜分，严格符合"词海上方 3/4、面板下方 1/4"的诉求。

---

## 3. 数据排布

### 3.1 全局排序
对 `vocabulary` 做按 `difficulty` 升序的稳定排序：

```
sortedWords = [...vocabulary].sort((a, b) => a.difficulty - b.difficulty)
```

排序后索引 `i ∈ [0, 199]`：
- `i ∈ [0, 64]`：65 个难度 1 词
- `i ∈ [65, 129]`：65 个难度 2 词
- `i ∈ [130, 199]`：70 个难度 3 词

> 数量来自当前 `vocabulary.json`：difficulty=1/2/3 计数为 65/65/70。如词库后续变更，渐变色公式见 §4 用区间动态计算，无需改 UI。

### 3.2 列优先填充网格
- **行数**：5（固定）
- **列数**：`⌈200 / 5⌉ = 40`
- **位置公式**：词 `sortedWords[i]` 渲染到 `row = i % 5`, `col = floor(i / 5)`
- 每列 5 个连续序号的词 → 一列内难度相近，横向滚动看到难度从易到难的自然过渡

实现策略（嵌套 flex，兼容性优于 CSS Grid）：把 sorted 数组按每 5 个一组切成 40 列；外层 flex-row 横排各列，每列内部 flex-column 纵排 5 个 cell。

```scss
.word-ocean__row { display: flex; flex-direction: row; }
.word-ocean__col { display: flex; flex-direction: column; margin-right: 70px; }
.word-ocean__cell { width: 140px; height: 56px; margin-bottom: 16px; }
```

---

## 4. 视觉设计

### 4.1 渐变色卡（清新型：绿 → 青 → 紫 → 粉）
| 区间 | 起色 | 终色 |
|------|------|------|
| 难度 1 | `#4ade80`（草绿） | `#22d3ee`（浅青） |
| 难度 2 | `#22d3ee`（浅青） | `#6366f1`（紫蓝） |
| 难度 3 | `#6366f1`（紫蓝） | `#ec4899`（粉红） |

相邻区间共享色点（`#22d3ee`、`#6366f1`），保证整段渐变连续无跳跃。

### 4.2 颜色插值函数
```typescript
function getColorAt(sortedIndex: number, total: number): string {
  // 根据 vocabulary 真实分布拆三段
  const cnt1 = countByDifficulty(1);
  const cnt2 = countByDifficulty(2);
  // const cnt3 = total - cnt1 - cnt2;  // 不直接用

  if (sortedIndex < cnt1) {
    const t = cnt1 === 1 ? 0 : sortedIndex / (cnt1 - 1);
    return lerpColor('#4ade80', '#22d3ee', t);
  }
  if (sortedIndex < cnt1 + cnt2) {
    const k = sortedIndex - cnt1;
    const t = cnt2 === 1 ? 0 : k / (cnt2 - 1);
    return lerpColor('#22d3ee', '#6366f1', t);
  }
  const k = sortedIndex - cnt1 - cnt2;
  const denom = total - cnt1 - cnt2 - 1;
  const t = denom <= 0 ? 0 : k / denom;
  return lerpColor('#6366f1', '#ec4899', t);
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
```

### 4.3 单元格背景
每个 pill 用两段渐变（135deg），起点为该词颜色，终点为下一索引颜色：
```typescript
const startColor = getColorAt(i, 200);
const endColor   = getColorAt(Math.min(i + 1, 199), 200);
const bg = `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`;
```

效果：相邻 pill 在色卡上**共享一个端点**，整片词海呈现"河流式"流动渐变。

### 4.4 状态视觉
| 状态 | 表现 |
|------|------|
| 默认（未掌握） | 该词颜色 + 文字 #fff + 阴影 `0 4px 12px rgba(0,0,0,0.08)` |
| 已掌握（陈化） | `opacity: 0.4` + `filter: grayscale(0.6)`，仍可点击 |
| 选中 | 加 2px 白色描边 + 阴影增强 `0 6px 20px rgba(0,0,0,0.18)` + `transform: translateY(-2px)` |

---

## 5. 交互流程

```
进入页面
  └─ 词海加载（200 词全部渲染，ScrollView 默认 scrollLeft = 0）
     └─ 默认 selectedWord = null
        └─ 面板显示 hint「点选词海中的单词查看详情」
           "去背诵"按钮 disabled

用户左右滑动词海
  └─ 原生 ScrollView 滚动惯性，无业务逻辑

用户点击某个 pill
  └─ setSelectedWord(word)
     └─ 该 pill 加 selected 描边
        └─ 面板淡入显示该词的拼写、音标、难度标签、中文含义
           "去背诵"按钮启用

用户点击"去背诵"
  └─ setCurrentWord(selectedWord)         // 已有 Context 方法
     └─ Taro.navigateTo('/pages/detail/detail')
        └─ 落地 detail 页（背诵流程不变）

返回选词页
  └─ selectedWord 重置为 null（不在 Context，仅页面 state）
     └─ 重新出现 hint
```

---

## 6. 组件结构

### 6.1 重命名 `FloatingWord` → `WordTile`
原 `FloatingWord` 语义是"漂浮气泡"，新设计不再漂浮。改名 + props 拓展：

```typescript
// src/components/WordTile.tsx
interface WordTileProps {
  word: Word;
  isLearned: boolean;
  selected: boolean;
  startColor: string;
  endColor: string;
  onClick: (word: Word) => void;
}
```

`WordTile.scss`：
- 移除原 `floating-word` 漂浮相关 CSS（`@keyframes float-y` 由父级 .index 移除）
- 新增 `.word-tile--selected`、保留 `.word-tile--learned`
- 背景色由内联 `style` 设置（基于 props 动态计算）

### 6.2 新增 `WordOcean.tsx`
封装词海容器：
```typescript
// src/components/WordOcean.tsx
interface WordOceanProps {
  words: Word[];
  isLearned: (id: string) => boolean;
  selectedId: string | null;
  onSelect: (word: Word) => void;
}
```
内部职责：
- 对 `words` 排序得 sorted 序列
- 按列优先布局生成 grid 单元格
- 每个 cell 调用 `getColorAt` 获取起止色 → 传给 `WordTile`
- 外层 `<ScrollView scrollX>` 控制横向滚动

### 6.3 新增 `WordDetailPanel.tsx`
封装底部详情面板：
```typescript
// src/components/WordDetailPanel.tsx
interface WordDetailPanelProps {
  word: Word | null;        // null 时显示 hint 状态
  onGoRecite: () => void;   // 点击"去背诵"时调用
}
```
内部：
- `word === null`：渲染 hint 文案、"去背诵"按钮 disabled
- `word !== null`：渲染拼写、音标、难度标签、中文含义、"去背诵"按钮启用

### 6.4 重构 `pages/index/index.tsx`
保留：顶部标题区、`todayCount` 计算、`isLearned` 调用。
新增：`selectedWord` 页面状态。
布局：标题区 + `<WordOcean>` + `<WordDetailPanel>`。

```typescript
const [selectedWord, setSelectedWord] = useState<Word | null>(null);
const handleGoRecite = useCallback(() => {
  if (selectedWord) {
    setCurrentWord(selectedWord);
    Taro.navigateTo({ url: '/pages/detail/detail' });
  }
}, [selectedWord, setCurrentWord]);

return (
  <View className='index'>
    <View className='index__header'>...</View>
    <WordOcean
      words={vocabulary}
      isLearned={isLearned}
      selectedId={selectedWord?.id ?? null}
      onSelect={setSelectedWord}
    />
    <WordDetailPanel word={selectedWord} onGoRecite={handleGoRecite} />
  </View>
);
```

---

## 7. 样式细节

### 7.1 关键尺寸
| 名称 | 值 | 备注 |
|------|----|------|
| 单元格宽 | 140 px | 容纳到 12 字符（最长 "kaleidoscope" = 12 字符） |
| 单元格高 | 56 px | 单行文字垂直居中 |
| 列间距 | 70 px | "半个单元格宽" = "半个单词长度" |
| 行间距 | 16 px | 视觉松紧适中 |
| 网格总宽 | 40 × 140 + 39 × 70 = **8330 px** | 足够横向滚动距离 |
| 网格总高 | 5 × 56 + 4 × 16 = **344 px** | flex:3 容器中垂直居中 |

> Taro `pxtransform` 启用、`designWidth: 750`，以上像素值会自动转换为 `rpx`。

### 7.2 词海容器
```scss
.word-ocean {
  flex: 3;                      /* 占剩余高度 3/4 */
  display: flex;
  align-items: center;          /* 垂直居中网格 */
  padding: 0 20px;              /* 左右安全间距 */
  overflow: hidden;             /* 防止外部滚动溢出 */

  &__scroll {
    width: 100%;
    height: 344px;
    white-space: nowrap;        /* ScrollView 横向必备 */
  }

  &__row {
    display: flex;
    flex-direction: row;        /* 40 列横排 */
    align-items: stretch;
    height: 100%;
    padding: 0 20px;            /* 首尾词与边缘有间距 */
    box-sizing: border-box;
  }

  &__col {
    display: flex;
    flex-direction: column;     /* 每列 5 个 cell 纵排 */
    margin-right: 70px;         /* 列间距 = 半个单元格宽 */
    flex-shrink: 0;

    &:last-child { margin-right: 0; }
  }

  &__cell {
    width: 140px;
    height: 56px;
    margin-bottom: 16px;        /* 行间距 */
    flex-shrink: 0;

    &:last-child { margin-bottom: 0; }
  }
}
```

### 7.3 详情面板
```scss
.word-detail-panel {
  flex: 1;                      /* 占剩余高度 1/4 */
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &__hint {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 14px;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__top-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  &__spell {
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }

  &__phonetic {
    color: #888;
    font-size: 14px;
  }

  &__difficulty-tag {
    margin-left: auto;
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 12px;
    color: #fff;
    /* 背景色用内联 style 注入（依据难度 1/2/3 取自 §4.1 起色） */
  }

  &__meaning {
    font-size: 16px;
    color: #555;
    line-height: 1.4;
  }

  &__button {
    width: 100% !important;
    height: 44px;
    line-height: 44px;
    font-size: 16px;
    font-weight: 600;
    background: #07c160 !important;
    color: #fff !important;
    border-radius: 22px !important;

    &--disabled {
      background: #cccccc !important;
      opacity: 0.6;
    }
  }
}
```

### 7.4 单元格（word-tile）
```scss
.word-tile {
  width: 100%;
  height: 100%;
  border-radius: 28px;          /* 56 / 2 = 28，胶囊形 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &__text {
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    /* 长词截断 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }

  &--learned {
    opacity: 0.4;
    filter: grayscale(0.6);
  }

  &--selected {
    transform: translateY(-2px);
    /* 用一条 box-shadow 同时实现外发光与白色描边 */
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.18),
      inset 0 0 0 2px #ffffff;
  }
}
```

---

## 8. 兼容与回归

| 文件 | 状态 |
|------|------|
| `src/pages/detail/` | ❎ 不变 |
| `src/pages/history/` | ❎ 不变 |
| `src/context/AppContext.tsx` | ❎ 不变 |
| `src/data/vocabulary.json` | ❎ 不变 |
| `src/utils/storage.ts` | ❎ 不变 |
| `src/types/word.ts` | ❎ 不变 |
| `src/app.config.ts` | ❎ 不变 |
| `src/components/FloatingWord.{tsx,scss}` | ✏️ 改名为 `WordTile.{tsx,scss}` 并扩展 |
| `src/pages/index/index.{tsx,scss,config.ts}` | ✏️ 重构 |
| `src/components/WordOcean.{tsx,scss}` | ➕ 新增 |
| `src/components/WordDetailPanel.{tsx,scss}` | ➕ 新增 |

回归点：
- `Taro.navigateTo('/pages/detail/detail')` 跳转和参数协议（通过 Context 传递 `currentWord`）保持不变
- `markAsLearned` / `isLearned` API 不变；选词页只读 `isLearned`
- 旧的"漂浮"动画样式将被删除，无残留全局副作用

---

## 9. 错误处理与边界

| 场景 | 处理 |
|------|------|
| `vocabulary` 为空数组 | WordOcean 渲染空容器，不报错；面板始终 hint 状态 |
| 单词数量非 5 的整数倍 | 最后一列填充不满 5 行 → grid 留空，无视觉突兀 |
| 难度某档为空（如未来词库变更） | `lerpColor` 公式会跳过该段，仍能产生连续渐变（见 §4.2 的 `denom <= 0` 守卫） |
| 用户点击已掌握词 | 允许选中（用于复习），交互流程同未掌握词 |
| 选中后未点"去背诵"返回页面 | `selectedWord` 在页面 state 中，离开页面后被销毁，下次回来恢复 hint 状态 |

---

## 10. 实现优先级

1. 新增 `getColorAt` / `lerpColor` 工具（独立纯函数，便于单测）
2. `WordTile` 组件（基于 FloatingWord 改名扩展）
3. `WordOcean` 组件（ScrollView + Grid + 列优先填充）
4. `WordDetailPanel` 组件
5. 重构 `pages/index/index.tsx`，组装新组件
6. 更新 `pages/index/index.scss`，移除漂浮动画相关 CSS
7. 真机/开发者工具验证横向滚动、惯性、点击精度

---

## 11. 后续可选扩展（不在本次范围）
- 滚动到当前难度起点的快速跳转按钮（"跳到中等"/"跳到困难"）
- 已掌握词折叠/隐藏的 Toggle
- 词海分组小标题（行间穿插难度分隔标识）
- ScrollView 滚动位置持久化（返回页面时记住浏览位置）
