<p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="https://i.imgur.com/6wj0hh6.jpg" alt="Project logo"></a>
</p>

<h3 align="center">Context GPT</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-complete-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center"> A markdown-based ChatGPT app inspired by the Supabase Clippy.
    <br> 
</p>

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Deployment](#deployment)
- [Usage](#usage)
- [Built Using](#built_using)
- [TODO](./TODO.md)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## 🧐 About <a name = "about"></a>

This is a learning project meant to help with my understanding and usage of OpenAi's API and embedding. Along the same lines, I chose to use sveltekit for this project as a way to learn a new framework.

## 🏁 Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Installing

A step by step series of examples that tell you how to get a development env running.

First, clone the repository using:

```
git clone git@github.com:aaronlee232/context-gpt.git
```

Navigate to the root directory of the project and install project dependencies using:

```
npm i
```

Run the app locally using

```
npm run dev
```

Once the command finishes, the terminal should prompt you with a localhost link to test the project locally with.

## 🎈 Usage <a name="usage"></a>

On the homepage of the app, you can enter in queries in the input field. After submitting the query using the button or 'enter', you should see your message appear above the input box.

It should appear like:

```
user: Can you explain what the function101 does in feature202?
```

The AI response might take a while to appear, but eventually it will show up as:

```
assistant: Yes, I would be glad to explain...
```

Feel free to continue chatting with your personal document AI for as long as you like!

## 🚀 Deployment <a name = "deployment"></a>

There are no instructions to deploy this on a live system as of yet.

## ⛏️ Built Using <a name = "built_using"></a>

- [Supabase](https://supabase.com/) - Database
- [Svektekit](https://kit.svelte.dev/) - Meta Framework

## ✨ Things I learned

### Providing Context with a User Query

Embeddings can be used to select the most relevant chunk of context. Performing a score functions operation (dot-product, cosine-similarity, or euclidean distance) between two embeddings gives a similarity score than can be used to determine relevance

<details><summary>More Context...</summary>

I knew coming into this project that I needed a way to provide additional context to the LLM model if I wanted it to respond to queries using the documents I provided it with.

After a bit of research, I realized that I had three options:

1. Fine-tune a model with my documents
2. Send all my documents before any user queries
3. Use embeddings to select the most relevant chunks of my document to send with my user queries

With this project being primarily a learning project, costly solutions were unfortunately not feasable, elimating fine-tuning. Between the last two options, I ended up choosing option 3 due to its elegance (and because sending many documents would likely rack of a hefty bill as well).

</details>
## Prompt Engineering

You can assign an identity to a LLM and give it a set of rules to abide by.

<details><summary>More Context...</summary>
Being able to restrict the scope of what the LLM could use as a resource to respond to a query was a blessing and a curse.
<br/>
<br/>
On one hand, it enabled me to restrict the LLM from straying from the contents of the documents and hallucinating answers, but on the other hand it was difficult to balance the restrictiveness of the prompt in a way that it could still reference conversation details without hallucinating.

</details>

## ✍️ Authors <a name = "authors"></a>

- [@aaronlee232](https://github.com/aaronlee232) - Idea & work

## 🎉 Acknowledgements <a name = "acknowledgement"></a>

- [@gregnr](https://github.com/supabase/supabase/commits?author=gregnr) - Supabase's Cippy tutorial was very helpful in understanding the implementation behind an AI assistant who could answer based on a set of provided documents

- [Vivek](https://towardsdatascience.com/when-should-you-fine-tune-llms-2dddc09a404a)'s article on whether or not to fine-tune a model is what led me to the idea of using embeddings
