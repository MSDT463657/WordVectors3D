# 🧠 Word Vector Demo with OpenAI Embeddings

This project shows how natural language words like **"cat"**, **"dog"**, and **"banana"** are converted into **vectors** (lists of floating-point numbers) using OpenAI's embedding models. It also demonstrates how to measure **semantic similarity** between words using **cosine similarity**.

## 🔍 What Are Word Vectors?

Word vectors are a way for AI to understand what words *mean*. Each word is turned into a long list of numbers (called a **vector**) that places the word in a huge multi-dimensional space. Words that are similar (like "cat" and "dog") end up close together. Words that are different (like "cat" and "banana") are farther apart.

## 🧪 Features

- 🔑 Uses OpenAI’s `text-embedding-3-small` model (768-dimensional embeddings)
- 🧮 Calculates cosine similarity between word pairs
- 🐾 Shows that `"cat"` and `"dog"` are semantically close
- 🍌 Shows that `"banana"` is not close to `"cat"` or `"dog"`

## 📦 Requirements

Install dependencies:

```bash
pip install openai numpy
```

You’ll also need an OpenAI API key.

## 🔐 Setting the API Key

You can set your OpenAI API key in your terminal like this:

**Mac/Linux:**
```bash
export OPENAI_API_KEY="your-api-key-here"
```

**Windows (PowerShell):**
```powershell
setx OPENAI_API_KEY "your-api-key-here"
```

Alternatively, you can hard-code it inside the script using:
```python
client = OpenAI(api_key="your-api-key-here")
```

## 🧠 Code Overview

```python
from openai import OpenAI
import numpy as np

# Initialize OpenAI client
client = OpenAI()

# Words to compare
words = ["cat", "dog", "banana"]

# Get embeddings
embeddings = {}
for word in words:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=word
    )
    embeddings[word] = np.array(response.data[0].embedding)

# Cosine similarity
def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# Show results
print("cat vs dog:", cosine_similarity(embeddings["cat"], embeddings["dog"]))
print("cat vs banana:", cosine_similarity(embeddings["cat"], embeddings["banana"]))
print("dog vs banana:", cosine_similarity(embeddings["dog"], embeddings["banana"]))
```

## 📊 Sample Output

```
cat vs dog: 0.937
cat vs banana: 0.118
dog vs banana: 0.103
```

Higher numbers mean the words are closer in meaning!

## 👶 For Beginners

If you’re new to vectors and embeddings:

- A **vector** is just a list of decimal numbers (floats).
- A **float** is a number like `0.35`, not just a whole number like `2`.
- **Cosine similarity** checks how close two vectors are by comparing their direction.

## 📁 Files in This Repo

- `main.py` — script to generate and compare vectors
- `README.md` — this file

## 📘 Learn More

- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)
- [Cosine Similarity - Wikipedia](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Vectors and AI Explained (ChatGPT)](https://chat.openai.com)

## ✅ License

MIT License

---

Built with ❤️ to help you *see* how AI thinks about words.
