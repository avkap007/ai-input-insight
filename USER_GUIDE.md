# AI Input Insight - User Guide

## What is this tool?

AI Input Insight is an **educational demonstration tool** that shows how documents influence AI-generated responses. It helps you understand:

- How AI outputs are shaped by the data they're given
- Why you shouldn't blindly trust AI responses
- Concepts like data leverage, AI transparency, and data quality

---

## Getting Started

### Step 1: Upload a Document

1. Click the **upload area** on the left panel, or drag & drop a file
2. Supported formats: `.txt` files
3. Try the sample files in the `/samples` folder:
   - `dystopian_fiction.txt` - Dark, bleak writing style
   - `cheerful_childrens.txt` - Happy, exclamatory style
   - `academic_paper.txt` - Formal, citation-heavy style
   - `news_article.txt` - Factual, journalistic style

### Step 2: Adjust the Influence Slider

The **Influence slider** controls how much the document affects the AI's writing style:

| Level | What happens |
|-------|--------------|
| **90-100%** | AI writes *exactly* like the document's author |
| **70-89%** | AI heavily mimics the style |
| **50-69%** | AI blends the style with neutral baseline |
| **30-49%** | AI slightly hints at the style |
| **0-29%** | AI almost ignores the document |

### Step 3: Ask the AI Something

Type a request in the chat, like:
- "Write a story about a child going shopping"
- "Explain why exercise is important"
- "Describe a sunset"

Watch how the response changes based on your document's influence!

---

## Experiments to Try

### Experiment 1: Style Transfer

1. Upload `dystopian_fiction.txt`
2. Set influence to **100%**
3. Ask: "Write a story about a birthday party"
4. Note the dark, bleak tone
5. Lower influence to **20%**
6. Ask the same question
7. Compare the two responses!

### Experiment 2: Multiple Documents

1. Upload `dystopian_fiction.txt` (set to 80%)
2. Upload `cheerful_childrens.txt` (set to 20%)
3. Ask: "Write about a rainy day"
4. The AI will blend both styles based on their influence weights

### Experiment 3: Data Strikes (Exclusion)

1. Upload a document and interact with it
2. Enable **Advanced Controls**
3. Check **"Exclude from context"**
4. Ask the same question
5. Notice the AI no longer uses that document's style
6. This simulates what happens when content creators withdraw their data from AI training

---

## Advanced Controls

Enable the **Advanced Controls** toggle to access:

### Data Poisoning

Simulates corrupted or unreliable training data. Shows how bad data quality affects AI outputs.

| Level | Effect |
|-------|--------|
| **0-30%** (Light) | Minor word substitutions (good→bad, happy→sad) |
| **30-60%** (Medium) | Contradictory statements inserted |
| **60-100%** (Severe) | Heavy corruption, shuffled content, reliability warnings |

**Try it:**
1. Set poisoning to 70%
2. Ask a question
3. Notice the AI's confusion and uncertainty in its response

### Document Exclusion

Completely removes a document from the AI's context. Demonstrates "data strikes" where content creators can withdraw their influence.

---

## Understanding the Results

### What to observe:

1. **Vocabulary changes** - Does the AI use words from your document?
2. **Tone shifts** - Is the response dark/light, formal/casual?
3. **Sentence structure** - Are sentences long/short, simple/complex?
4. **Emotional register** - Hopeful vs hopeless, excited vs neutral?

### Key takeaways:

- AI responses are **shaped by their input data**
- Higher influence = more noticeable style transfer
- Bad data (poisoning) = unreliable, confused outputs
- Data exclusion = content creators have leverage over AI systems

---

## Tips

1. **Be specific** in your requests - "Write a story about X" works better than just "Write something"
2. **Compare responses** at different influence levels with the SAME prompt
3. **Use contrasting documents** (dystopian vs children's) to see dramatic differences
4. **Try the advanced controls** to understand data quality and exclusion concepts

---

## Sample Prompts to Try

- "Write a story about a child going shopping"
- "Describe what it feels like to wake up in the morning"
- "Explain the importance of community"
- "Write a short paragraph about technology"
- "Describe a marketplace"

---

## Technical Notes

- Documents are processed client-side and sent to the AI with each request
- No documents are stored permanently - refresh the page to start fresh
- The AI model used is Claude (Anthropic)
- Influence and poisoning are applied at request time, not permanently

---

*Developed as part of CMPT 415 directed studies at Simon Fraser University*
