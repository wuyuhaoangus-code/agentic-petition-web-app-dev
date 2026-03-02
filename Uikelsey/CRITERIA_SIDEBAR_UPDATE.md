# EB-1A Criteria Mapping 右侧边栏更新说明

## 更新内容

已成功为 Criteria Mapping 右侧边栏添加了详细的介绍，包括：

### 1. **10 个 EB-1A 官方评判标准**

每个标准现在包含：
- ✅ **完整的官方描述** - 详细说明标准要求
- ✅ **5 个具体示例** - 帮助理解什么类型的证据符合该标准
- ✅ **可展开/折叠** - 点击卡片可查看详细示例

#### 更新的标准：

1. **Awards (奖项)**
   - 描述：Receipt of nationally or internationally recognized prizes or awards for excellence in your field of endeavor...
   - 示例：Nobel Prize, National Medal of Science, Best Paper Awards 等

2. **Membership (会员资格)**
   - 描述：Membership in associations that require outstanding achievements... (只需要付费的普通会员资格不符合)
   - 示例：IEEE Fellow, National Academy of Sciences 等

3. **Published Material (媒体报道)**
   - 描述：Published material **about you** in professional or major trade publications... (必须是关于你的报道，不是你撰写的文章)
   - 示例：NYT 专题报道、Forbes 采访、TechCrunch 报道等

4. **Judging (评审工作)**
   - 描述：Participation as a judge of the work of others...
   - 示例：期刊审稿人、会议程序委员会、NSF 评审专家等

5. **Original Contributions (原创贡献)**
   - 描述：Evidence of your original scientific, scholarly, artistic... contributions of major significance
   - 示例：高引用专利、突破性研究、广泛采用的开源项目等

6. **Scholarly Articles (学术文章)**
   - 描述：Authorship of scholarly articles... (质量比数量重要 - 包含引用指标)
   - 示例：Nature/Science 论文、顶级会议论文、高引用论文等

7. **Artistic Exhibitions (艺术展览)**
   - 描述：Display of your work at artistic exhibitions... (主要针对艺术家、设计师)
   - 示例：重要画廊个展、Cannes/Sundance 电影节、建筑双年展等

8. **Leading Role (领导角色)**
   - 描述：Performance of a leading or critical role for organizations with a distinguished reputation
   - 示例：C-level 高管、VP/总监、首席研究员、创始人等

9. **High Salary (高薪)**
   - 描述：Evidence that you command a high salary... (必须提供比较数据证明你在顶尖水平)
   - 示例：W-2 表格、雇佣合同、薪资调查数据等

10. **Commercial Success (商业成功)**
    - 描述：Evidence of commercial success in the performing arts (主要针对艺人、运动员)
    - 示例：票房记录、专辑销量、演出收入等

### 2. **Recommendation Letters (推荐信) - 强烈推荐但不计入 10 个标准**

- ✅ **特殊标识**：带有 "HIGHLY RECOMMENDED" 金色标签
- ✅ **琥珀色高亮**：使用独特的琥珀色背景区分
- ✅ **详细说明**：
  - "Letters of recommendation from experts in your field attesting to your extraordinary ability (ideally 5-8 recommenders). While not one of the 10 official criteria, these letters are HIGHLY RECOMMENDED and often critical for approval."
- ✅ **5 个推荐信来源示例**：
  - 教授或学术导师
  - 行业领袖或高管
  - 政府官员或政策制定者
  - 会议组织者或期刊编辑
  - 客户、合作者或投资者

## 用户体验改进

### 视觉设计：
- **已满足的标准**：绿色背景 + 绿色对勾 ✓
- **未满足的标准**：灰色背景
- **推荐信（已有）**：琥珀色背景 + "HIGHLY RECOMMENDED" 标签
- **推荐信（未有）**：浅琥珀色背景

### 交互设计：
1. **可点击展开**：点击任何标准卡片查看详细示例
2. **展开指示器**：右侧的 ↓/↑ 图标
3. **平滑动画**：展开/折叠时的流畅过渡

### 底部提示：
```
Quick Tips
• Click items above to see evidence examples.
• Recommendation letters not counted, but highly recommended.
```

## 技术实现

### 数据结构：
```typescript
export interface Criterion {
  id: string;
  name: string;
  description: string;  // ✅ 现在包含完整的官方描述
  icon: React.ComponentType<{ className?: string }>;
  examples?: string[];  // ✅ 5 个具体示例
  isRecommended?: boolean;  // ✅ 标记推荐信
}
```

### 文件位置：
- `/src/app/components/CriteriaSidebar.tsx` - 完整更新的组件

### 展示顺序：
在 EB-1A 模式下，边栏显示的是 `ALL_MAPPING_ITEMS`，其中包含：
1. **所有 10 个官方标准** (CRITERIA 数组)
2. **推荐信** (RECOMMENDATION_LETTER) - 显示在列表最后

## 使用效果

用户在 Criteria Mapping 页面右侧边栏可以：

1. ✅ **快速浏览**所有 10 个标准的名称和图标
2. ✅ **阅读详细描述**了解每个标准的具体要求
3. ✅ **点击展开**查看 5 个具体示例
4. ✅ **一眼识别**哪些标准已经满足（绿色对勾）
5. ✅ **注意到**推荐信的重要性（琥珀色高亮）
6. ✅ **统计进度**：顶部显示 "X of 10 criteria met • Y files uploaded"

## 示例截图说明

右侧边栏从上到下包含：

### 顶部统计区域：
```
EB-1A Criteria Overview
3 of 10 criteria met • 15 files uploaded
```

### 标准卡片区域（可滚动）：
每个卡片显示：
- 图标（左侧）
- 标准名称 + "HIGHLY RECOMMENDED" 标签（如果是推荐信）
- 完整描述
- ✓ 对勾（如果已满足）
- ↓ 展开按钮

### 底部提示区域：
```
Quick Tips
• Click items above to see evidence examples.
• Recommendation letters not counted, but highly recommended.
```

## 重要说明

⚠️ **推荐信不计入 10 个标准**
- 推荐信在右侧边栏中会特别标注 "HIGHLY RECOMMENDED"
- 使用琥珀色背景区分于其他标准
- 在统计时不计入 "X of 10 criteria met"
- 但强烈建议准备 5-8 封推荐信

✅ **所有描述均来自官方 USCIS 要求**
- 描述清晰说明了每个标准的具体要求
- 示例都是实际案例中常见的证据类型
- 帮助用户准确理解并准备相应材料

🎯 **用户友好的设计**
- 可折叠设计避免信息过载
- 颜色编码帮助快速识别状态
- 详细示例提供具体指导
