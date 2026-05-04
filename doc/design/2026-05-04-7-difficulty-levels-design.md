# 词库 7 级难度重划设计文档

> 把现有 200 词从 difficulty=1/2/3 三级重新划分为 CEFR 7 级（Pre-A1 / A1 / A2 / B1 / B2 / C1 / C2），并把词海与详情面板的视觉/文案同步响应到 7 级。

- **基准日期**：2026-05-04
- **影响范围**：`src/types/word.ts`、`src/data/vocabulary.json`、`src/utils/color.ts`、`src/components/WordOcean.tsx`、`src/components/WordDetailPanel.tsx`
- **不影响**：`pages/detail/`、`pages/history/`、`AppContext`、`storage.ts`、`app.config.ts`、`WordTile`、`WordCard`、`WordOcean.scss`、`WordDetailPanel.scss`、`pages/index/index.{tsx,scss}`

---

## 1. 背景与目标

### 1.1 现状
- `vocabulary.json` 共 200 词，`difficulty` 三档分布 65 / 65 / 70
- `Word.difficulty` 类型为 `1 | 2 | 3` 字面量联合
- `WordOcean` 按 difficulty 升序排序、按 3 段（4 锚点 `#4ade80→#22d3ee→#6366f1→#ec4899`）做颜色插值；列优先填充 5 行 × 40 列网格
- `WordDetailPanel` 用 `Record<1|2|3, string>` 渲染 `难度 简单/中等/困难` 标签，底色取段起色

### 1.2 目标
- 在不动布局结构（5×40）的前提下，把 3 档替换为 7 档 CEFR 等级
- `WordOcean` 颜色渐变扩为 8 锚点 7 段，整片色带依旧连续过渡
- `WordDetailPanel` 难度标签由 3 个中文档替换为 7 个 CEFR 中文映射
- 类型层面把 `difficulty` 字面量联合从 `1|2|3` 拓宽为 `1|2|3|4|5|6|7`，最小化 type-check 影响面

### 1.3 设计准则
- **YAGNI**：不引入 `level` 新字段、不重命名、不拆分桶；`difficulty` 字段名保留
- **可回归**：除了上面 5 个改动文件，其他文件原封不动
- **确定性**：分级规则纯机械（按 vocabulary.json 数组顺序均分），任何工程师跑一遍都能得到相同分级表

---

## 2. 7 级体系

### 2.1 等级定义

| L | 中文名 | CEFR | 角色 |
|---|--------|------|------|
| 1 | 入门 | Pre-A1 | 字母 / 数字 / 颜色等基础名词 |
| 2 | 初级 | A1 | 日常物品、最常见动词形容词 |
| 3 | 基础 | A2 | 校园/工作常见名词 |
| 4 | 中级 | B1 | 抽象名词、跨场景动词 |
| 5 | 中高级 | B2 | 偏书面、稍学术 |
| 6 | 高级 | C1 | 学术 / 演讲常见高级词 |
| 7 | 精通 | C2 | 偏冷僻、高密度词义 |

### 2.2 分级规则（按 `vocabulary.json` 数组顺序均分）

| 原桶 | 词数 | 拆分（按数组顺序） | 新等级映射 |
|------|------|-------------------|-----------|
| difficulty=1 | 65 | 前 33 词 / 后 32 词 | L1 / L2 |
| difficulty=2 | 65 | 前 22 / 中 22 / 后 21 | L3 / L4 / L5 |
| difficulty=3 | 70 | 前 35 / 后 35 | L6 / L7 |

**结果分布**：33 / 32 / 22 / 22 / 21 / 35 / 35（合计 200）

### 2.3 重写算法（用于一次性生成新 vocabulary.json）

```typescript
// 离线脚本，仅在重写 vocabulary.json 时一次性使用
const groups = [1, 2, 3].map((d) =>
  vocabulary.filter((w) => w.difficulty === d) // 保持 JSON 内出现顺序
);

const splitPlan: Record<number, number[]> = {
  1: [33, 32],          // diff=1 → L1, L2
  2: [22, 22, 21],      // diff=2 → L3, L4, L5
  3: [35, 35],          // diff=3 → L6, L7
};

const startLevel: Record<number, number> = { 1: 1, 2: 3, 3: 6 };

for (const d of [1, 2, 3] as const) {
  let cursor = 0;
  splitPlan[d].forEach((cnt, idx) => {
    const newLevel = startLevel[d] + idx;
    for (let i = 0; i < cnt; i++) {
      groups[d - 1][cursor + i].difficulty = newLevel; // 直接覆盖
    }
    cursor += cnt;
  });
}
// 重新写回 vocabulary.json，保持 id 顺序不变
```

> 注意：本设计**不要求**在运行时跑这个脚本。脚本仅作为生成新 `vocabulary.json` 的"配方"，落实在 plan 中作为一个一次性 task。最终代码库里只保留**已重写过的**静态 JSON。

---

## 3. 类型与数据变更

### 3.1 `Word.difficulty` 类型拓宽

```typescript
// src/types/word.ts
export interface Word {
  id: string;
  spell: string;
  phonetic: string;
  meaning: string;
  example: { en: string; cn: string };
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7;   // ← 拓宽
}
```

字段名保留为 `difficulty`，避免引发 detail/history/storage 等下游连锁改名。

### 3.2 `vocabulary.json` 重写

- 200 条记录的 `id` / `spell` / `phonetic` / `meaning` / `example` 完全不变
- 仅 `difficulty` 字段按 §2.2 的规则重写为 1–7
- 文件结构、记录顺序保持不动

---

## 4. 视觉设计

### 4.1 8 锚点色板

复用现有"绿 → 青 → 蓝 → 紫 → 粉"主色相轴，沿轴细分为 8 个锚点 / 7 段：

| 段 | 起色 | 终色 | 视觉 |
|----|------|------|------|
| L1 | `#4ade80` 草绿 | `#34d399` 翠绿 | 嫩绿 |
| L2 | `#34d399` 翠绿 | `#22d3ee` 浅青 | 青绿 |
| L3 | `#22d3ee` 浅青 | `#38bdf8` 天蓝 | 清浅 |
| L4 | `#38bdf8` 天蓝 | `#6366f1` 紫蓝 | 沉静 |
| L5 | `#6366f1` 紫蓝 | `#a855f7` 紫罗兰 | 浓厚 |
| L6 | `#a855f7` 紫罗兰 | `#d946ef` 紫红 | 暖紫 |
| L7 | `#d946ef` 紫红 | `#ec4899` 粉红 | 终焰 |

相邻段共享端点（`#34d399`、`#22d3ee`、`#38bdf8`、`#6366f1`、`#a855f7`、`#d946ef`），整片色带连续无跳跃。

### 4.2 通用化的 `getColorAt`

```typescript
// src/utils/color.ts
export const PALETTE_ANCHORS = [
  '#4ade80', '#34d399', '#22d3ee', '#38bdf8',
  '#6366f1', '#a855f7', '#d946ef', '#ec4899',
] as const;

export function getColorAt(sortedIndex: number, counts: number[]): string {
  let acc = 0;
  for (let seg = 0; seg < counts.length; seg++) {
    const segLen = counts[seg];
    if (segLen === 0) continue;
    if (sortedIndex < acc + segLen) {
      const denom = segLen - 1;
      const t = denom <= 0 ? 0 : (sortedIndex - acc) / denom;
      return lerpColor(PALETTE_ANCHORS[seg], PALETTE_ANCHORS[seg + 1], t);
    }
    acc += segLen;
  }
  // 越界保护：返回末锚点
  return PALETTE_ANCHORS[PALETTE_ANCHORS.length - 1];
}
```

设计要点：
- **段数与计数解耦**：段数由 `counts.length` 决定。今天 7 段、明天 N 段，函数本体不需改
- **锚点约束**：`PALETTE_ANCHORS.length` 必须等于 `counts.length + 1`；这里用常量 8 锚点配 7 段
- **空段安全**：某级 0 词时跳过，不影响相邻段渐变
- **`hexToRgb` / `lerpColor` 保留**，无需改动

### 4.3 `WordOcean` 计数生成

```typescript
const sorted = [...words].sort((a, b) => a.difficulty - b.difficulty);
const counts: number[] = Array(7).fill(0);
for (const w of sorted) counts[w.difficulty - 1]++;

const entries = sorted.map((word, i) => {
  const startColor = getColorAt(i, counts);
  const endColor = getColorAt(Math.min(i + 1, sorted.length - 1), counts);
  return { word, startColor, endColor };
});
```

排序仍按 `difficulty` 升序、列优先填充 5 行 × 40 列的逻辑保持不变。

### 4.4 难度标签

```typescript
// src/components/WordDetailPanel.tsx
const DIFFICULTY_LABELS: Record<1|2|3|4|5|6|7, string> = {
  1: '入门', 2: '初级', 3: '基础',
  4: '中级', 5: '中高级', 6: '高级', 7: '精通',
};

const DIFFICULTY_COLORS: Record<1|2|3|4|5|6|7, string> = {
  1: '#4ade80', 2: '#34d399', 3: '#22d3ee',
  4: '#38bdf8', 5: '#6366f1', 6: '#a855f7', 7: '#d946ef',
};
```

每级标签底色取该级"起色"，与词海中该级首词色相同，让面板小色块和词海首位形成视觉锚定。文案沿用 `难度 ${LABEL}` 模板。

---

## 5. 文件影响清单

| 文件 | 状态 | 改动 |
|------|------|------|
| `src/types/word.ts` | ✏️ 改 | `difficulty` 字面量从 3 项拓为 7 项 |
| `src/data/vocabulary.json` | ✏️ 改 | 200 条记录全量重写 difficulty 字段 |
| `src/utils/color.ts` | ✏️ 改 | 引入 `PALETTE_ANCHORS`；`getColorAt` 改签名 `(idx, counts)` |
| `src/components/WordOcean.tsx` | ✏️ 改 | 用 `Array(7)` counts 调用新 `getColorAt` |
| `src/components/WordDetailPanel.tsx` | ✏️ 改 | 两张映射表扩为 7 项 |
| `src/components/WordDetailPanel.scss` | ❎ 不变 | 样式来自 inline style，无改动 |
| `src/components/WordTile.{tsx,scss}` | ❎ 不变 | |
| `src/components/WordOcean.scss` | ❎ 不变 | 5×40 列优先布局保持 |
| `src/components/WordCard.{tsx,scss}` | ❎ 不变 | detail 页不读 difficulty |
| `src/pages/index/index.{tsx,scss}` | ❎ 不变 | |
| `src/pages/detail/`、`src/pages/history/` | ❎ 不变 | |
| `src/context/AppContext.tsx`、`src/utils/storage.ts` | ❎ 不变 | |

---

## 6. 边界与回归

| 场景 | 处理 |
|------|------|
| 某等级 0 词 | `getColorAt` 跳过空段，色带依旧连续 |
| 词总数非 5 的整数倍 | 末列留空（沿用现行为） |
| 旧 `learn_history`（含 difficulty=1/2/3 时存的记录） | 不受影响：`LearnRecord` 只存 `wordId` 和 `wordSpell`，不存 difficulty |
| `Record<1\|2\|3, …>` 旧映射 | 必须扩到 7 项，否则 TS 编译报错；正是本次修改的一部分 |
| 网络 / 接口 | 无后端、无外部依赖 |
| 既有快照 / 截图 | UI 改色但布局不动；视觉变更预期内 |

---

## 7. 验证清单

1. `pnpm install`（如新增依赖；本设计无新增依赖，跳过）
2. `pnpm dev:weapp` → WeChat DevTools：
   - 词海横向滚动应看到 7 段连续渐变（绿 → 青 → 蓝 → 紫 → 粉），无突兀色跳
   - 第 1 列首词颜色 = `#4ade80`；最末列尾词颜色趋近 `#ec4899`
   - 点击 L1 词（如 "apple"），面板显示 `难度 入门`，底色 `#4ade80`
   - 点击 L4 词（如 "commitment"），显示 `难度 中级`，底色 `#38bdf8`
   - 点击 L7 词（如 "catalyst"），显示 `难度 精通`，底色 `#d946ef`
3. "去背诵"按钮跳转 detail 页正常；返回 index 页选中状态被正确重置（行为不变）
4. history 页正常显示已学单词；删除按钮正常
5. `pnpm build:weapp` 编译通过（TS、Sass 均无报错）

---

## 8. 不在本次范围

- 等级筛选 / 跳转按钮（"跳到 B1" 等）
- 等级在词海里的显式分隔标记
- 已掌握词按等级分组统计
- vocabulary.json 数据扩充或词条质量优化（不增不减）
