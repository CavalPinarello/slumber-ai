# Slumber AI

Slumber AI is a pre-operative education chatbot for patients preparing for sleep surgery (tonsillectomy, adenoidectomy, septoplasty, turbinoplasty, nasal valve surgery, maxillomandibular advancement, upper airway stimulation implant, drug-induced sleep endoscopy, UPPP). It was built at Stanford and presented at AAO-HNSF 2025.

Research software, not a medical device. No patient data is included.

## How it works

The patient fills in a short intake form (name, age, surgery type, profession), asks questions in a chat, gets a written summary of the conversation at the end, and then answers a 13-question feedback survey.

- **Front end:** Next.js chat app in this repo, built on Dify's open-source web app template (MIT licence, see `LICENSE`). It talks to a Dify app through the Dify API; keys go in `.env.local` (see `.env.local.example`).
- **Workflow:** `dify/slumber-ai-workflow.yml` is the Dify "advanced chat" workflow (version 2.21) that runs behind the front end. Import it into Dify to see the graph.

Workflow nodes, in order:

1. **Persona selector** (code node). A deterministic hash of the participant's email assigns one of two personas for an A/B comparison: a casual "buddy doctor" or a formal "professional academic". The persona changes tone only.
2. **Main LLM** (Claude Opus 4.1) answers the patient.
3. **Detection LLM** (Claude 3 Haiku) decides whether the patient has finished asking questions.
4. **Summary generator** (Claude 3 Haiku) writes the end-of-session summary, rendered to PDF by a Markdown-to-PDF plugin.
5. **Survey completion detector** (Claude 3 Haiku) watches for the end of the survey and triggers the export node, which posts the session record to a webhook (left as a placeholder here).

## Safety guardrails in the prompts

These are the constraints that are actually in the workflow prompts:

- **Topic restriction.** The main model may only answer questions about the patient's selected surgery and sleep-related medical topics, and is told to refuse everything else.
- **Same facts for both personas.** Both personas must give identical medical content; only the delivery differs.
- **Surgical team knowledge first.** The prompt tells the model to use a set of 213 question and answer pairs written by the surgical team before anything else, to quote it exactly where it applies, never to contradict it, and to let entries marked "MEDICAL NOTE" override all other information. The Q&A text itself is not in this repo (the prompt keeps a placeholder where it was pasted). An earlier version of the workflow retrieved the same material through a Dify knowledge base instead of pasting it into the prompt.
- **Fixed clinical rules.** A short list of protocol facts the model must always follow, for example: acetaminophen only and no NSAIDs after surgery, mandatory overnight stay after tonsillectomy for bleeding monitoring, continue CPAP until cleared by a follow-up sleep study, sleep study 3 to 6 months after surgery, and that UPPP reduces severity but rarely cures OSA.
- **Summary grounded in the conversation.** The summary model is told to use only the conversation that happened and not to add questions that were never asked. Every summary ends by telling the patient to follow their surgeon's specific instructions and to contact the surgical team with further questions.
- **Narrow classifier outputs.** The helper models must answer with a single fixed token (`PDF` / `CONTINUE`, `EXPORT_NOW` / `CONTINUE`), so routing does not depend on free text.

There is no separate moderation layer or automated emergency triage in this version; the scope limits, the surgical team's knowledge and the surgeon-instructions line are the safety mechanisms.

## Running it

```bash
npm install
cp .env.local.example .env.local   # add your Dify app ID, key and API URL
npm run dev
```

Then import `dify/slumber-ai-workflow.yml` into your Dify workspace, add the surgical team's Q&A where the prompt says so, and set your own webhook URL in the export node if you want to collect survey responses.

## Not included

Participant data, survey responses, the surgical team's Q&A content, earlier workflow versions, the email notification service and all deployment keys.
