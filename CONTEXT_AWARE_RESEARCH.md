# 🎯 Context-Aware Research - Perplexity Integration

## Overview

Your Perplexity research integration now **understands your story's context**, making research far more relevant and specific to what you're writing.

---

## ✨ What Changed

### Before (Generic Research):

```
Query: "What did people eat for breakfast?"
Answer: Generic overview of breakfast foods throughout history and cultures
```

### After (Context-Aware Research):

```
Story Context: Historical Fiction, Victorian London, 1850s
Query: "What did people eat for breakfast?"
Answer: Specific to middle-class Victorian families in 1850s London:
- Porridge with milk
- Bread and butter
- Kippers (smoked herring)
- Tea with sugar
Citations from Victorian cookbooks and historical sources
```

---

## 🧠 How It Works

### Story Context Passed to Perplexity:

When you enable **"Use story context"**, the research API receives:

1. **Genre** (e.g., "Historical Fiction", "Science Fiction", "Mystery")
2. **Setting** (e.g., "Victorian London", "Mars Colony 7", "Modern-day Tokyo")
3. **Time Period** (e.g., "1850s", "2185", "2024")
4. **Character Names** (e.g., ["Elizabeth Bennet", "Mr. Darcy"])
5. **Current Scene** (First 500 characters of what you're writing)

### System Prompt Enhancement:

The research AI receives a custom prompt:

```
You are a research assistant helping fiction writers.

STORY CONTEXT:
Genre: Historical Fiction
Setting: Victorian London
Time Period: 1850s
Characters: Elizabeth, William, Lady Catherine

CURRENT SCENE EXCERPT:
Elizabeth walked through the crowded market, her basket...

Tailor your research to be relevant to this story's setting,
genre, and time period. Provide research that helps the writer
develop this scene authentically.
```

---

## 🎯 Use Cases

### 1. Historical Accuracy

**Story:** Historical Fiction, American Civil War, 1863
**Query:** "What medical treatments were available?"
**Result:** Specific to 1863 battlefield medicine:

- Chloroform for anesthesia
- Minié ball extraction procedures
- Amputation techniques
- Field hospital conditions

### 2. Cultural Authenticity

**Story:** Contemporary Fiction, Tokyo, 2024
**Query:** "How do people greet each other?"
**Result:** Modern Japanese greeting etiquette:

- Bowing angles and formality levels
- Honorifics (san, sama, kun)
- Business card exchange protocol
- Contemporary casual vs. formal greetings

### 3. Technical Details

**Story:** Sci-Fi Thriller, Mars Colony, 2185
**Query:** "What would the atmosphere be like?"
**Result:** Tailored to Mars colonization:

- Current Mars atmospheric composition
- Terraforming proposals for 2185
- Pressurized habitat requirements
- Oxygen generation systems

### 4. Character-Specific Research

**Story:** Mystery, characters: Detective Sarah Chen, Dr. Marcus Webb
**Query:** "How would a forensic pathologist examine a body?"
**Result:** Knows you're writing about Dr. Marcus Webb, provides:

- Forensic pathology procedures
- Terminology Dr. Webb would use
- Crime scene protocols
- Autopsy report format

---

## 🛠️ Technical Implementation

### Files Modified:

1. **`app/api/ai/research/route.ts`**
   - Accepts `storyContext` parameter
   - Builds context-aware system prompt
   - Passes context to Perplexity

2. **`app/editor/[manuscriptId]/components/ResearchPanel.tsx`**
   - Accepts `storyContext` prop
   - Toggle checkbox for enabling/disabling context
   - Sends context with research queries

3. **`app/editor/[manuscriptId]/EditorWorkspace.tsx`**
   - Passes story metadata to ResearchPanel:
     - `manuscript.genre`
     - `manuscript.setting`
     - `manuscript.time_period`
     - `characters.map(c => c.name)`
     - `currentScene.content` (first 500 chars)

---

## 💡 Best Practices

### When to Use Context:

✅ Historical research (context provides time period)
✅ Cultural details (context provides setting)
✅ Character-specific queries (context knows names)
✅ Scene development (context sees current writing)

### When to Disable Context:

❌ General knowledge queries
❌ Researching multiple time periods
❌ Exploring alternative settings
❌ Brainstorming new story ideas

---

## 📊 Example Workflow

### Step 1: Writing a Scene

```
You're writing:
"Detective Sarah Chen examined the body, noting the unusual
pattern of bruises. She called Dr. Marcus Webb for his opinion..."
```

### Step 2: Need Research

Click **Research** button, context auto-populated:

- Genre: Crime Thriller
- Setting: Modern-day Chicago
- Characters: Sarah Chen, Marcus Webb
- Current Scene: "Detective Sarah Chen examined the body..."

### Step 3: Ask Context-Aware Question

```
Query: "How would a forensic pathologist determine time of death?"
```

### Step 4: Get Tailored Answer

Perplexity knows:

- You're writing crime thriller (provides detailed forensic info)
- Modern-day setting (uses current forensic techniques, not outdated methods)
- Character is Dr. Webb (answers from pathologist's perspective)
- Scene involves body examination (provides specific examination steps)

**Answer:**
"A forensic pathologist like Dr. Webb would use several methods to
determine time of death in a modern investigation:

1. **Body Temperature (Algor Mortis)**: Uses rectal temperature and
   Henssge nomogram for accuracy within 2-4 hours
2. **Rigor Mortis**: Muscle stiffening timeline (begins 2-6 hours)
3. **Livor Mortis**: Blood pooling patterns...

[Citations from current forensic pathology textbooks and journals]"

---

## 🎨 UI/UX

### Toggle Control:

```
┌─────────────────────────────────────┐
│ [✓] Use story context               │
│     (Crime Thriller)                 │
└─────────────────────────────────────┘
```

### When Enabled:

- Checkbox checked
- Shows genre in gray text
- All queries use story context

### When Disabled:

- Checkbox unchecked
- Generic research mode
- No story-specific tailoring

---

## 🚀 Benefits

1. **Saves Time**: No need to specify time period, setting in every query
2. **More Accurate**: Research tailored to your specific story
3. **Better Citations**: Sources relevant to your time period/setting
4. **Consistency**: Maintains story accuracy across all research
5. **Convenience**: One-click toggle to enable/disable

---

## 📈 Impact on Quality

### Without Context:

- Generic answers requiring manual filtering
- Need to specify setting/time in every query
- Risk of anachronisms
- Generic sources

### With Context:

- Answers specific to your story's world
- Automatic time period filtering
- Historically/culturally accurate
- Period-appropriate sources

---

## 🎯 Real-World Example

**Writing Historical Romance set in Regency England (1811-1820)**

### Generic Query (Context OFF):

```
Q: "What did women wear to balls?"
A: Overview of ball gowns from ancient Greece to modern proms
   - Too broad, not helpful
```

### Context-Aware Query (Context ON):

```
Story Context: Historical Romance, Regency England, 1811-1820

Q: "What did women wear to balls?"
A: Specific to Regency-era balls (1811-1820):
   - Empire waist gowns (high waistline just under bust)
   - Light muslins and silks
   - Short puffed sleeves
   - White kid gloves reaching above elbow
   - Reticules (small handbags)
   - Long curls framing face (not elaborate updos)

   Citations:
   - Jane Austen's letters (1811-1817)
   - Ackermann's Repository fashion plates
   - Regency fashion history textbooks
```

**Result:** Historically accurate, period-specific research ready to use in your scene!

---

## 💰 Cost Impact

**No additional cost!**

- Same Perplexity API pricing
- Context uses ~100-200 extra tokens (negligible)
- Saves money by reducing follow-up queries

---

## 🔧 Troubleshooting

### Context Not Working?

1. Check manuscript has genre/setting/time_period filled
2. Verify "Use story context" checkbox is enabled
3. Ensure characters are added to manuscript

### Too Specific?

- Disable "Use story context" for general queries
- Perfect for exploring alternatives

### Wrong Context?

- Update manuscript metadata (genre, setting, time period)
- Changes apply immediately to next query

---

## ✅ Summary

Your research is now **story-aware**:

- ✅ Understands genre, setting, time period
- ✅ Knows your characters
- ✅ Sees your current scene
- ✅ Tailors answers to your specific story
- ✅ One-click toggle on/off
- ✅ No extra cost

**This is a game-changer for historical fiction, sci-fi world-building,
and any genre requiring accurate, specific research!**

---

**Happy context-aware researching! 🎉📚**
