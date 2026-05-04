# 词库 7 级难度重划实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 200 词从 difficulty=1/2/3 三级重划为 7 级（CEFR Pre-A1 到 C2），词海色彩从 4 锚点 3 段渐变扩为 8 锚点 7 段渐变，详情面板难度标签同步扩展。

**Architecture:** 三步原子推进。第 1 步独立变更类型与详情面板映射（不影响视觉）；第 2 步把数据、色板、`WordOcean` 三处一并升级到 7 段（避免出现"色板换了但数据还是 3 档"或反之的中间态视觉回归）；第 3 步编译 + DevTools 手验。

**Tech Stack:** Taro 4.2.0 + React 18 + TypeScript + Sass + pnpm

**Spec:** `doc/design/2026-05-04-7-difficulty-levels-design.md`

---

## File Structure

```
src/
├── types/
│   └── word.ts                              ✏️ Task 1：difficulty 字面量 1|2|3 → 1|2|3|4|5|6|7
├── data/
│   └── vocabulary.json                      ✏️ Task 2：200 条 difficulty 字段全量重写
├── utils/
│   └── color.ts                             ✏️ Task 2：新增 PALETTE_ANCHORS、getColorAt 签名换为 (idx, counts)
└── components/
    ├── WordOcean.tsx                        ✏️ Task 2：counts: number[] 取代 cnt1/cnt2/cnt3
    └── WordDetailPanel.tsx                  ✏️ Task 1：DIFFICULTY_LABELS / DIFFICULTY_COLORS 扩为 7 项
```

每个文件单一职责：
- `types/word.ts`：唯一一处类型源
- `data/vocabulary.json`：纯静态数据
- `utils/color.ts`：纯函数色板，无 React/Taro 依赖
- `components/WordOcean.tsx`：负责排序 + 列优先布局 + 调用色板生成 startColor / endColor
- `components/WordDetailPanel.tsx`：负责底部面板 + 难度文案 / 底色映射

---

## Task 1：拓宽 difficulty 类型 + 扩展详情面板映射

> 目的：先把"接收 7 级"的能力放进类型层和面板映射，不动数据、不动色板。完成后视觉、运行时表现完全不变。

**Files:**
- Modify: `src/types/word.ts`
- Modify: `src/components/WordDetailPanel.tsx`

- [ ] **Step 1：拓宽 `Word.difficulty` 字面量类型**

打开 `src/types/word.ts`，把 difficulty 从 3 项改为 7 项：

```typescript
export interface Word {
  id: string;
  spell: string;
  phonetic: string;
  meaning: string;
  example: {
    en: string;
    cn: string;
  };
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export interface LearnRecord {
  wordId: string;
  wordSpell: string;
  learnedAt: number;
}
```

- [ ] **Step 2：扩展 `WordDetailPanel.tsx` 的两张映射表**

定位 `src/components/WordDetailPanel.tsx` 顶部的 `DIFFICULTY_LABELS` 与 `DIFFICULTY_COLORS`，两张表都从 3 项扩为 7 项。完整替换文件中两个常量的定义部分：

```typescript
const DIFFICULTY_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: '入门',
  2: '初级',
  3: '基础',
  4: '中级',
  5: '中高级',
  6: '高级',
  7: '精通',
};

const DIFFICULTY_COLORS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: '#4ade80',
  2: '#34d399',
  3: '#22d3ee',
  4: '#38bdf8',
  5: '#6366f1',
  6: '#a855f7',
  7: '#d946ef',
};
```

文件其余部分（imports / 组件函数主体）保持不变。

- [ ] **Step 3：类型检查**

Run:

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: 退出码 0，无任何输出。如果出现 `Type '4' is not assignable to type '1 | 2 | 3'` 之类报错，说明上一步的两张表没有改完。

- [ ] **Step 4：本地启动验证（可选）**

如果想直观确认无运行时回归：

```bash
pnpm dev:weapp
```

打开 WeChat DevTools 看选词页：词海应与之前完全一致（数据仍是 1-3，色板仍是 4 锚点 3 段）。详情面板点 difficulty=1/2/3 三个词应分别显示 `难度 入门 / 难度 基础 / 难度 高级`（注：标签变了，但视觉无错位）。

> 注意：Step 4 只是 sanity check，不是必经步骤。Task 3 会做完整的 build + 手验。

- [ ] **Step 5：提交**

```bash
git add src/types/word.ts src/components/WordDetailPanel.tsx
git commit -m "feat(types): widen Word.difficulty to 7 levels and extend detail panel labels"
```

---

## Task 2：原子化升级数据 + 色板 + WordOcean

> 目的：一次性把 vocabulary.json、color.ts、WordOcean.tsx 三处升级到 7 段。三者必须同时上，否则会出现"色板与数据档位不匹配"的视觉回归。

**Files:**
- Modify: `src/data/vocabulary.json`
- Modify: `src/utils/color.ts`
- Modify: `src/components/WordOcean.tsx`

- [ ] **Step 1：用脚本生成新的 vocabulary.json**

在仓库根执行下面的命令。脚本读取当前 vocabulary.json，按设计文档 §2.2 的规则把 difficulty 重写为 1-7（保留每条记录的其他字段、保留数组顺序、**保留原文件的逐行单行 JSON 排版**），最后落盘。

```bash
python3 - <<'PY'
import json
import re
from pathlib import Path

path = Path('src/data/vocabulary.json')
text = path.read_text()
data = json.loads(text)

split_plan = {1: [33, 32], 2: [22, 22, 21], 3: [35, 35]}
start_level = {1: 1, 2: 3, 3: 6}

# 按 difficulty 收集词条原数组下标，保持出现顺序
groups = {1: [], 2: [], 3: []}
for idx, w in enumerate(data):
    groups[w['difficulty']].append(idx)

# 计算每个原始 idx 的新 difficulty
new_diff = {}
for d in (1, 2, 3):
    cursor = 0
    for offset, cnt in enumerate(split_plan[d]):
        level = start_level[d] + offset
        for k in range(cnt):
            new_diff[groups[d][cursor + k]] = level
        cursor += cnt
    assert cursor == len(groups[d]), f'split_plan[{d}] sum mismatch'

# 通过逐行 id-定位 + 正则替换的方式，仅改 difficulty 字段，
# 不动其余字符（最大程度保留原 JSON 排版与转义）
lines = text.splitlines(keepends=True)
id_to_level = {data[idx]['id']: lvl for idx, lvl in new_diff.items()}
id_pat = re.compile(r'"id"\s*:\s*"(w\d+)"')
diff_pat = re.compile(r'("difficulty"\s*:\s*)\d+')

new_lines = []
for line in lines:
    m = id_pat.search(line)
    if m and m.group(1) in id_to_level:
        new_level = id_to_level[m.group(1)]
        line = diff_pat.sub(rf'\g<1>{new_level}', line, count=1)
    new_lines.append(line)
path.write_text(''.join(new_lines))

# 校验：解析新文件，统计分布
data2 = json.loads(path.read_text())
assert len(data2) == 200, f'len={len(data2)}'
counts = [0] * 8
for w in data2:
    counts[w['difficulty']] += 1
print('counts L1..L7 =', counts[1:])
assert counts[1:] == [33, 32, 22, 22, 21, 35, 35], 'distribution mismatch'
print('OK')
PY
```

Expected 输出：

```
counts L1..L7 = [33, 32, 22, 22, 21, 35, 35]
OK
```

如果输出不是这两行，停止并检查 `src/data/vocabulary.json` 是否被外部脚本意外改动过、原始 65/65/70 分布是否依然成立。

- [ ] **Step 2：抽查几个词条验证规则**

```bash
python3 - <<'PY'
import json
data = json.loads(open('src/data/vocabulary.json').read())
def find(idx):
    w = data[idx]
    return f"{w['id']}:{w['spell']} → L{w['difficulty']}"
print(find(0))    # w001 apple
print(find(67))   # w068 fruit
print(find(68))   # w069 vegetable
print(find(99))   # w100 sad
print(find(15))   # w016 office
print(find(106))  # w107 circumstance
print(find(149))  # w150 expand
print(find(30))   # w031 ambiguous
print(find(199))  # w200 futile
PY
```

Expected:

```
w001:apple → L1
w068:fruit → L1
w069:vegetable → L2
w100:sad → L2
w016:office → L3
w107:circumstance → L3
w150:expand → L5
w031:ambiguous → L6
w200:futile → L7
```

- [ ] **Step 3：重写 `src/utils/color.ts`**

完整替换 `src/utils/color.ts` 的内容为：

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
 * 颜色锚点：N 段渐变需要 N+1 个锚点。
 * 当前 7 段（L1..L7）配 8 锚点：草绿 → 翠绿 → 浅青 → 天蓝 → 紫蓝 → 紫罗兰 → 紫红 → 粉红。
 */
export const PALETTE_ANCHORS = [
  '#4ade80',
  '#34d399',
  '#22d3ee',
  '#38bdf8',
  '#6366f1',
  '#a855f7',
  '#d946ef',
  '#ec4899',
] as const;

/**
 * 在 N 段渐变色卡上根据全局排序索引取色。
 * - counts[i] 表示第 i 段的词数（i 从 0 开始）
 * - 段数 = counts.length；要求 PALETTE_ANCHORS.length === counts.length + 1
 * - 空段（counts[i] === 0）自动跳过
 */
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
  // sortedIndex 越界保护：返回末锚点
  return PALETTE_ANCHORS[PALETTE_ANCHORS.length - 1];
}
```

要点：
- `getColorAt` 旧签名 `(sortedIndex, cnt1, cnt2, cnt3)` 被替换为 `(sortedIndex, counts)`。**所有调用点必须同步更新**（只有 `WordOcean.tsx` 一个调用点，下一步处理）
- 段数与锚点数解耦：未来如要变 N，只需改 `PALETTE_ANCHORS` 与传入的 counts，函数本体不动

- [ ] **Step 4：更新 `src/components/WordOcean.tsx`**

打开 `src/components/WordOcean.tsx`，定位 `useMemo` 内部的排序与计数逻辑。把现有的 `cnt1` / `cnt2` / `cnt3` 三段计数改为长度 7 的 `counts: number[]`，并相应调整 `getColorAt` 调用：

```typescript
import { ScrollView, View } from '@tarojs/components';
import { useMemo } from 'react';
import type { Word } from '../types/word';
import { getColorAt } from '../utils/color';
import WordTile from './WordTile';
import './WordOcean.scss';

const ROWS = 5;
const LEVEL_COUNT = 7;

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

    const counts: number[] = Array(LEVEL_COUNT).fill(0);
    for (const w of sorted) counts[w.difficulty - 1]++;

    const entries: TileEntry[] = sorted.map((word, i) => {
      const startColor = getColorAt(i, counts);
      const endIndex = Math.min(i + 1, sorted.length - 1);
      const endColor = getColorAt(endIndex, counts);
      return { word, startColor, endColor };
    });

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

变更点对照（与现有版本相比）：
- 新增 `const LEVEL_COUNT = 7;`
- 移除 `const cnt1 = ...; const cnt2 = ...; const cnt3 = ...;`
- 新增 `const counts: number[] = Array(LEVEL_COUNT).fill(0); for (const w of sorted) counts[w.difficulty - 1]++;`
- `getColorAt(i, cnt1, cnt2, cnt3)` → `getColorAt(i, counts)`
- `getColorAt(endIndex, cnt1, cnt2, cnt3)` → `getColorAt(endIndex, counts)`
- 其他代码（imports / 排序 / 列优先填充 / JSX）保持不变

- [ ] **Step 5：类型检查**

Run:

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: 退出码 0，无任何输出。

- [ ] **Step 6：提交**

```bash
git add src/data/vocabulary.json src/utils/color.ts src/components/WordOcean.tsx
git commit -m "feat: redistribute vocabulary into 7 CEFR levels with extended gradient"
```

---

## Task 3：Build & 手动验证

> 目的：完整的 production build 和 DevTools 视觉验收。

**Files:** 无文件改动，仅运行构建与人工验证。

- [ ] **Step 1：production build**

Run:

```bash
pnpm build:weapp
```

Expected: 构建成功，`dist/` 输出更新。如果出现 TS 报错，回到 Task 1 / Task 2 排查；常见问题：
- `Type '4' is not assignable to type '1 | 2 | 3'` → Task 1 Step 2 的两张表没改完整
- `Argument of type 'number[]' is not assignable to parameter of type 'number'` → Task 2 Step 4 的 WordOcean 调用还在用旧签名

- [ ] **Step 2：dev 模式启动**

Run:

```bash
pnpm dev:weapp
```

并打开 WeChat DevTools，导入 `dist/` 项目。

- [ ] **Step 3：词海视觉验收**

在 DevTools 模拟器里：

1. **首屏**：词海最左侧一列首词背景应为 `#4ade80`（草绿）。例如 `apple`。
2. **横滑到末端**：最右侧最后一列尾词背景应趋近 `#ec4899`（粉红）。
3. **中段**：向右滑动观察，颜色应连续过渡：草绿 → 翠绿 → 浅青 → 天蓝 → 紫蓝 → 紫罗兰 → 紫红 → 粉红，**无突兀断层**。
4. **L→L 边界**：因不加显式分隔，难度过渡应在某些列的中间发生（视觉应仍是平滑渐变，没有色块跳变）。

- [ ] **Step 4：详情面板验收**

依次点击下列词，确认面板的难度标签与底色：

| 点击词 | 期望标签 | 期望底色 |
|--------|---------|---------|
| `apple` (w001) | 难度 入门 | `#4ade80` |
| `vegetable` (w069) | 难度 初级 | `#34d399` |
| `office` (w016) | 难度 基础 | `#22d3ee` |
| `commitment` (w108) | 难度 中级 | `#38bdf8` |
| `discuss` (w130) | 难度 中高级 | `#6366f1` |
| `ambiguous` (w031) | 难度 高级 | `#a855f7` |
| `catalyst` (w166) | 难度 精通 | `#d946ef` |

如果上面任何一行不符，回到 Task 1 Step 2（标签 / 颜色映射）或 Task 2 Step 1（vocabulary 重写脚本）排查。

- [ ] **Step 5：导航与历史回归**

1. 在选词页选中 `apple`，点击 **去背诵** → 跳转 detail 页，渲染 `apple` 词卡。
2. detail 页点 **已掌握** → 回到选词页；选中状态被重置为 hint。
3. 切到 **历史** TabBar → 列表中显示 `apple`，可点 X 删除。
4. 回到选词页，`apple` 词海格变灰（learned 态），点击仍可选中（用于复习）。

- [ ] **Step 6：本计划无新增 commit**

Task 3 不产生代码改动，无需 commit。如发现回归并修复，按修复内容自行决定提交粒度（单独 commit 或 amend 上一步）。

---

## 完工标志

- [ ] `pnpm build:weapp` 成功
- [ ] 词海呈现 8 锚点连续渐变
- [ ] 7 个等级标签在详情面板均能正确触发
- [ ] detail / history 页功能与 difficulty 拓宽前完全一致
- [ ] git log 中可见 Task 1、Task 2 两个 commit

---

## 回滚方案

如发现严重视觉回归且无法即时修复：

```bash
git revert <Task 2 commit>
git revert <Task 1 commit>
```

两个 commit 互相不依赖（Task 1 不依赖 Task 2，Task 2 不依赖 Task 1 的运行时行为）。但回滚顺序应**先 Task 2 后 Task 1**，否则 Task 2 落地后类型层会再次缩窄、面板映射变冗余但不报错。
