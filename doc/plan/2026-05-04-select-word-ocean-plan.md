# 选词页"词海"重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `pages/index/index` 选词页从绝对定位的漂浮气泡改为 5 行 × 40 列的横向滚动网格，按难度从易到难渐变着色，底部 1/4 增加"选中词详情面板"，点击后两步进入背诵页。

**Architecture:** 新增 `WordOcean`、`WordDetailPanel`、`utils/color` 三个独立单元；将原 `FloatingWord` 改名为 `WordTile` 并拓展 props（移除漂浮动画、新增 selected / 渐变色 props）。`pages/index/index.tsx` 收紧为顶部标题 + WordOcean + WordDetailPanel 的组合容器。`AppContext`、`vocabulary.json`、`detail/history` 页与全局类型不动。

**Tech Stack:** Taro 4.2.0 + React 18 + TypeScript + Sass + pnpm

**Spec:** `doc/design/2026-05-04-select-word-ocean-design.md`

---

## File Structure

```
src/
├── utils/
│   └── color.ts                          ➕ 新增：渐变色插值（hexToRgb / lerpColor / getColorAt）
├── components/
│   ├── FloatingWord.tsx                  ❌ Task 5 中删除
│   ├── FloatingWord.scss                 ❌ Task 5 中删除
│   ├── WordTile.tsx                      ➕ 新增：替代 FloatingWord，新增 selected/渐变色 props
│   ├── WordTile.scss                     ➕ 新增
│   ├── WordOcean.tsx                     ➕ 新增：ScrollView + 嵌套 flex 实现 5×40 列优先布局
│   ├── WordOcean.scss                    ➕ 新增
│   ├── WordDetailPanel.tsx               ➕ 新增：底部 1/4 详情面板
│   └── WordDetailPanel.scss              ➕ 新增
└── pages/index/
    ├── index.tsx                         ✏️ 重构：组装新组件
    └── index.scss                        ✏️ 重构：纵向 flex 布局，移除漂浮动画
```

每个文件单一职责：
- `utils/color.ts`：纯函数，无 React/Taro 依赖，便于将来加单测
- `WordTile`：表示单个单词胶囊，无业务逻辑
- `WordOcean`：负责排序与列优先布局，把渐变色算好后传给 WordTile
- `WordDetailPanel`：负责面板的 hint / 信息两态切换
- `pages/index/index`：仅做组件组装与页面级状态管理

---

## Task 1: 新增渐变色工具函数

**Files:**
- Create: `src/utils/color.ts`

- [ ] **Step 1: 创建 `src/utils/color.ts`，写入完整工具函数**

```typescript
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return { r, g, b };
}

export function lerpColor(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * clamped);
  const g = Math.round(a.g + (b.g - a.g) * clamped);
  const bl = Math.round(a.b + (b.b - a.b) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}

/**
 * 在三段渐变色卡上根据全局排序索引取色。
 * 段一（i ∈ [0, cnt1)）：#4ade80 → #22d3ee
 * 段二（i ∈ [cnt1, cnt1+cnt2)）：#22d3ee → #6366f1
 * 段三（剩余）：#6366f1 → #ec4899
 */
export function getColorAt(
  sortedIndex: number,
  cnt1: number,
  cnt2: number,
  cnt3: number
): string {
  if (sortedIndex < cnt1) {
    const denom = cnt1 - 1;
    const t = denom <= 0 ? 0 : sortedIndex / denom;
    return lerpColor('#4ade80', '#22d3ee', t);
  }
  if (sortedIndex < cnt1 + cnt2) {
    const k = sortedIndex - cnt1;
    const denom = cnt2 - 1;
    const t = denom <= 0 ? 0 : k / denom;
    return lerpColor('#22d3ee', '#6366f1', t);
  }
  const k = sortedIndex - cnt1 - cnt2;
  const denom = cnt3 - 1;
  const t = denom <= 0 ? 0 : k / denom;
  return lerpColor('#6366f1', '#ec4899', t);
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit --skipLibCheck src/utils/color.ts`
Expected: 无输出（无错误）

- [ ] **Step 3: 提交**

```bash
git add src/utils/color.ts
git commit -m "feat: add color gradient utilities for word ocean"
```

---

## Task 2: 新增 WordTile 组件（替代 FloatingWord）

**Files:**
- Create: `src/components/WordTile.tsx`
- Create: `src/components/WordTile.scss`

> 旧的 `FloatingWord.{tsx,scss}` 暂时保留，避免本任务结束后 `pages/index/index.tsx` 编译失败。FloatingWord 将在 Task 5 重构 index 页时一并删除。

- [ ] **Step 1: 创建 `src/components/WordTile.tsx`**

```typescript
import { View, Text } from '@tarojs/components';
import type { Word } from '../types/word';
import './WordTile.scss';

interface WordTileProps {
  word: Word;
  isLearned: boolean;
  selected: boolean;
  startColor: string;
  endColor: string;
  onClick: (word: Word) => void;
}

export default function WordTile({
  word,
  isLearned,
  selected,
  startColor,
  endColor,
  onClick,
}: WordTileProps) {
  const className = [
    'word-tile',
    isLearned ? 'word-tile--learned' : '',
    selected ? 'word-tile--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`,
  };

  return (
    <View className={className} style={style} onClick={() => onClick(word)}>
      <Text className='word-tile__text'>{word.spell}</Text>
    </View>
  );
}
```

- [ ] **Step 2: 创建 `src/components/WordTile.scss`**

```scss
.word-tile {
  width: 100%;
  height: 100%;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;

  &__text {
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
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
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.18),
      inset 0 0 0 2px #ffffff;
  }

  &:active {
    transform: scale(0.96);
  }
}
```

- [ ] **Step 3: 完整构建校验（旧 FloatingWord 仍在，本次构建应成功）**

Run: `pnpm build:weapp 2>&1 | tail -30`
Expected: 构建成功，无 TypeScript / 样式报错。

- [ ] **Step 4: 提交**

```bash
git add src/components/WordTile.tsx src/components/WordTile.scss
git commit -m "feat: add WordTile component with selected and gradient props"
```

---

## Task 3: 新增 WordOcean 组件（横向滚动 5×40 网格）

**Files:**
- Create: `src/components/WordOcean.tsx`
- Create: `src/components/WordOcean.scss`

- [ ] **Step 1: 创建 `src/components/WordOcean.tsx`**

```typescript
import { ScrollView, View } from '@tarojs/components';
import { useMemo } from 'react';
import type { Word } from '../types/word';
import { getColorAt } from '../utils/color';
import WordTile from './WordTile';
import './WordOcean.scss';

const ROWS = 5;

interface WordOceanProps {
  words: Word[];
  isLearned: (id: string) => boolean;
  selectedId: string | null;
  onSelect: (word: Word) => void;
}

interface TileEntry {
  word: Word;
  startColor: string;
  endColor: string;
}

export default function WordOcean({
  words,
  isLearned,
  selectedId,
  onSelect,
}: WordOceanProps) {
  const columns = useMemo<TileEntry[][]>(() => {
    const sorted = [...words].sort((a, b) => a.difficulty - b.difficulty);
    const cnt1 = sorted.filter((w) => w.difficulty === 1).length;
    const cnt2 = sorted.filter((w) => w.difficulty === 2).length;
    const cnt3 = sorted.length - cnt1 - cnt2;

    const entries: TileEntry[] = sorted.map((word, i) => {
      const startColor = getColorAt(i, cnt1, cnt2, cnt3);
      const endIndex = Math.min(i + 1, sorted.length - 1);
      const endColor = getColorAt(endIndex, cnt1, cnt2, cnt3);
      return { word, startColor, endColor };
    });

    // 列优先切分：每 ROWS 个一列
    const cols: TileEntry[][] = [];
    for (let c = 0; c < entries.length; c += ROWS) {
      cols.push(entries.slice(c, c + ROWS));
    }
    return cols;
  }, [words]);

  return (
    <View className='word-ocean'>
      <ScrollView className='word-ocean__scroll' scrollX enableFlex>
        <View className='word-ocean__row'>
          {columns.map((col, ci) => (
            <View className='word-ocean__col' key={ci}>
              {col.map(({ word, startColor, endColor }) => (
                <View className='word-ocean__cell' key={word.id}>
                  <WordTile
                    word={word}
                    isLearned={isLearned(word.id)}
                    selected={selectedId === word.id}
                    startColor={startColor}
                    endColor={endColor}
                    onClick={onSelect}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
```

> **关于列优先填充**：手动把排序后的词数组按 ROWS=5 切成多组，每组对应一列。CSS 用 `display: flex; flex-direction: row` 横向排列列，每列内 `flex-direction: column` 纵向排列 5 个 cell。这样不依赖 CSS Grid，兼容性比 `grid-auto-flow: column` 更稳，符合 §3.2 "row = i % 5, col = ⌊i/5⌋" 的位置公式。

- [ ] **Step 2: 创建 `src/components/WordOcean.scss`**

```scss
.word-ocean {
  flex: 3;
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
  box-sizing: border-box;

  &__scroll {
    width: 100%;
    height: 344px;
    white-space: nowrap;
  }

  &__row {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    height: 100%;
    padding: 0 20px;
    box-sizing: border-box;
  }

  &__col {
    display: flex;
    flex-direction: column;
    margin-right: 70px;       /* 列间距 = 半个单元格宽 */
    flex-shrink: 0;

    &:last-child {
      margin-right: 0;
    }
  }

  &__cell {
    width: 140px;
    height: 56px;
    margin-bottom: 16px;      /* 行间距 */
    flex-shrink: 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit --skipLibCheck src/components/WordOcean.tsx`
Expected: 无输出（无错误）

- [ ] **Step 4: 提交**

```bash
git add src/components/WordOcean.tsx src/components/WordOcean.scss
git commit -m "feat: add WordOcean with horizontal-scroll 5x40 column-major grid"
```

---

## Task 4: 新增 WordDetailPanel 组件（底部 1/4 详情面板）

**Files:**
- Create: `src/components/WordDetailPanel.tsx`
- Create: `src/components/WordDetailPanel.scss`

- [ ] **Step 1: 创建 `src/components/WordDetailPanel.tsx`**

```typescript
import { View, Text, Button } from '@tarojs/components';
import type { Word } from '../types/word';
import './WordDetailPanel.scss';

interface WordDetailPanelProps {
  word: Word | null;
  onGoRecite: () => void;
}

const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: '简单',
  2: '中等',
  3: '困难',
};

const DIFFICULTY_COLORS: Record<1 | 2 | 3, string> = {
  1: '#4ade80',
  2: '#22d3ee',
  3: '#6366f1',
};

export default function WordDetailPanel({
  word,
  onGoRecite,
}: WordDetailPanelProps) {
  if (!word) {
    return (
      <View className='word-detail-panel'>
        <View className='word-detail-panel__hint'>
          <Text>点选词海中的单词查看详情</Text>
        </View>
        <Button
          className='word-detail-panel__button word-detail-panel__button--disabled'
          disabled
        >
          去背诵
        </Button>
      </View>
    );
  }

  return (
    <View className='word-detail-panel'>
      <View className='word-detail-panel__main'>
        <View className='word-detail-panel__top-row'>
          <Text className='word-detail-panel__spell'>{word.spell}</Text>
          <Text className='word-detail-panel__phonetic'>{word.phonetic}</Text>
          <View
            className='word-detail-panel__difficulty-tag'
            style={{ background: DIFFICULTY_COLORS[word.difficulty] }}
          >
            <Text>难度 {DIFFICULTY_LABELS[word.difficulty]}</Text>
          </View>
        </View>
        <Text className='word-detail-panel__meaning'>{word.meaning}</Text>
      </View>
      <Button
        className='word-detail-panel__button'
        onClick={onGoRecite}
      >
        去背诵
      </Button>
    </View>
  );
}
```

- [ ] **Step 2: 创建 `src/components/WordDetailPanel.scss`**

```scss
.word-detail-panel {
  flex: 1;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;

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
    margin-bottom: 12px;
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
    align-self: center;
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

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit --skipLibCheck src/components/WordDetailPanel.tsx`
Expected: 无输出（无错误）

- [ ] **Step 4: 提交**

```bash
git add src/components/WordDetailPanel.tsx src/components/WordDetailPanel.scss
git commit -m "feat: add WordDetailPanel with hint state and difficulty tag"
```

---

## Task 5: 重构 `pages/index/index.tsx`，组装新组件

**Files:**
- Modify: `src/pages/index/index.tsx`
- Modify: `src/pages/index/index.scss`
- Delete: `src/components/FloatingWord.tsx`
- Delete: `src/components/FloatingWord.scss`

- [ ] **Step 1: 重写 `src/pages/index/index.tsx`**

```typescript
import { View, Text } from '@tarojs/components';
import { useCallback, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { useAppContext } from '../../context/AppContext';
import WordOcean from '../../components/WordOcean';
import WordDetailPanel from '../../components/WordDetailPanel';
import type { Word } from '../../types/word';
import './index.scss';

export default function Index() {
  const { vocabulary, learnHistory, isLearned, setCurrentWord } = useAppContext();
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return learnHistory.filter((r) => r.learnedAt >= today.getTime()).length;
  }, [learnHistory]);

  const handleSelect = useCallback((word: Word) => {
    setSelectedWord(word);
  }, []);

  const handleGoRecite = useCallback(() => {
    if (selectedWord) {
      setCurrentWord(selectedWord);
      Taro.navigateTo({ url: '/pages/detail/detail' });
    }
  }, [selectedWord, setCurrentWord]);

  return (
    <View className='index'>
      <View className='index__header'>
        <Text className='index__title'>选一个单词开始背诵</Text>
        <Text className='index__subtitle'>今日已背 {todayCount} 个</Text>
      </View>

      <WordOcean
        words={vocabulary}
        isLearned={isLearned}
        selectedId={selectedWord?.id ?? null}
        onSelect={handleSelect}
      />

      <WordDetailPanel word={selectedWord} onGoRecite={handleGoRecite} />
    </View>
  );
}
```

- [ ] **Step 2: 重写 `src/pages/index/index.scss`**

```scss
.index {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #e4e8f0 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    height: 80px;
    padding: 16px 20px;
    text-align: center;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  &__title {
    display: block;
    font-size: 20px;
    font-weight: 600;
    color: #333333;
    margin-bottom: 6px;
  }

  &__subtitle {
    display: block;
    font-size: 14px;
    color: #07c160;
    font-weight: 500;
  }
}
```

> 已删除所有原来的 `&__words`、`&__word-wrapper`、`@keyframes float-y` 漂浮动画样式。

- [ ] **Step 3: 删除旧 `FloatingWord` 文件**

```bash
rm src/components/FloatingWord.tsx src/components/FloatingWord.scss
```

> index.tsx 已不再 import FloatingWord，可以安全删除。

- [ ] **Step 4: 完整构建校验**

Run: `pnpm build:weapp 2>&1 | tail -30`
Expected: 看到 `Compiled successfully` 或类似成功输出，无 TypeScript 报错、无未解析模块。如果出现 `Cannot find module './FloatingWord'` 类报错，说明仍有残留 import 需要清理。

- [ ] **Step 5: 提交**

```bash
git add src/pages/index/index.tsx src/pages/index/index.scss src/components/FloatingWord.tsx src/components/FloatingWord.scss
git commit -m "feat: redesign select page with word ocean grid and detail panel"
```

---

## Task 6: 真机/开发者工具回归验证

**Files:**
- 不修改文件，仅人工验证

- [ ] **Step 1: 启动开发模式**

Run: `pnpm dev:weapp`
Expected: 终端打印 `Compiled successfully`，进入 watch 模式。

- [ ] **Step 2: 在微信开发者工具加载 `dist/`，逐项核对**

| 验证项 | 预期 |
|--------|------|
| 页面打开后顶部展示「选一个单词开始背诵」「今日已背 0 个」 | ✅ |
| 词海占据屏幕约 3/4，底部面板占 1/4 | ✅ |
| 词海中能看到 5 行单词 | ✅ |
| 词海可左右滑动，能滚动到末端看到难度 3 的紫红色词（如 "ubiquitous"） | ✅ |
| 颜色从左侧浅绿、中部青蓝、右侧紫粉，整体连续渐变 | ✅ |
| 点击某词，该词上抬并加白色描边，底部面板显示拼写/音标/难度/含义 | ✅ |
| 底部"去背诵"按钮在未选中时灰色 disabled，选中后变绿 | ✅ |
| 点击"去背诵"成功跳转背诵页 | ✅ |
| 在背诵页点击"已掌握"返回选词页，被掌握的词显示为半透明灰色但仍可点击 | ✅ |
| 切换到历史 tab 查看记录 | ✅ |

- [ ] **Step 3: 异常情况核查**

| 场景 | 预期 |
|------|------|
| 已掌握所有词后再次点击 | 仍可正常选中、再次进入背诵页（允许复习） |
| 长词（如 "kaleidoscope"）的胶囊 | 文字 `text-overflow: ellipsis` 截断，不撑破单元格 |
| 右滑到末尾 | 不会反弹回开头，停在末位 |
| 无网络 | 不影响（本应用纯本地）|

- [ ] **Step 4: 停止 dev**

按 Ctrl+C 终止终端 watch 进程。

> 本任务无文件改动、无提交。如发现问题，回到对应 Task 修复并补提交。

---

## Self-Review Checklist

### Spec Coverage（对照 `doc/design/2026-05-04-select-word-ocean-design.md`）

| 设计文档章节 | 对应任务 |
|------|------|
| §2 整体布局（80px header + flex 3:1） | Task 5（index.scss）|
| §3.1 全局排序 | Task 3（WordOcean useMemo）|
| §3.2 列优先填充 | Task 3（嵌套 flex：行内 flex-row 包 N 列 flex-column，每列 5 个 cell）|
| §4.1 渐变色卡 | Task 1（getColorAt）|
| §4.2 颜色插值 | Task 1（lerpColor / getColorAt）|
| §4.3 单元格背景 linear-gradient | Task 2（WordTile.tsx style）|
| §4.4 已掌握/选中视觉 | Task 2（WordTile.scss --learned/--selected）|
| §5 交互流程 | Task 5（index.tsx state + handlers）|
| §6.1 WordTile 替代 FloatingWord | Task 2 |
| §6.2 WordOcean | Task 3 |
| §6.3 WordDetailPanel | Task 4 |
| §6.4 index 重构 | Task 5 |
| §7.1–§7.4 样式细节 | Task 2/3/4/5 各 .scss |
| §8 兼容回归（detail/history 不动） | Task 5 完整构建 + Task 6 验证 |
| §9 边界（空数组、不足 5 行、空难度档） | Task 1 守卫 + Task 3 useMemo + Task 4 hint 状态 |

### Placeholder Scan
- 无 TBD / TODO / "implement later"
- 所有 SCSS 都填了具体声明
- 所有命令都给了 Expected 行为

### Type Consistency
- `Word` 接口字段：`id`, `spell`, `phonetic`, `meaning`, `example`, `difficulty` —— 沿用已有 `src/types/word.ts`
- `WordTileProps`：在 Task 2 定义，Task 3 调用时字段名一一对应（`word/isLearned/selected/startColor/endColor/onClick`）
- `WordOceanProps`：在 Task 3 定义，Task 5 调用时字段名一一对应（`words/isLearned/selectedId/onSelect`）
- `WordDetailPanelProps`：在 Task 4 定义，Task 5 调用时字段名一一对应（`word/onGoRecite`）
- `getColorAt(sortedIndex, cnt1, cnt2, cnt3)` 签名：Task 1 定义，Task 3 调用一致

### 范围与可执行性
- 每个 Task 自包含、可独立运行类型检查
- Task 5 是唯一同时新增与删除模块的任务；因 index.tsx、index.scss、FloatingWord.{tsx,scss} 在同一 commit 内一起更改，commit 后 `pnpm build:weapp` 仍可成功
- Task 2 选择保留旧 `FloatingWord` 文件，使该任务对应的 commit 也能完整构建（Step 3 已嵌入 `pnpm build:weapp` 校验）
- Task 6 不写代码，纯人工回归
