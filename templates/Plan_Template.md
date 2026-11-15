****************** Pre-prompt Instructions/ Best Practices****************************************************

* Do not include this text as par of the prompt, prompt text begins after "Prompt:"                          *

* 1) Fill in brainstorming doc path in [path-to-your-brainstorm-information-doc]                             *

* 2) Fill in the location of the generated spec.md file from spec-kit in [specs\1.0.0\path-to-your\spec.md]  *

* 3) Explore technical details with your desired agent, use plan-mode, and understand the architecture       *

* 4) Explicit unknown are better than letting the agent fill in any gaps                                     *

* 5) Brainstorm docs, or other referenced files do not need to be checked in                                 *

* 6) Generate plan draft in [some-directory/some-file.md] to be used as the input to /speckit.plan           *

**************************************************************************************************************

 

Prompt:

# Transform the work item into a structured software plan.

 

You are an expert software specification writer.

 

## Scope

 

Your goal ends after producing a complete, well-structured technical plan document.

The generated plan is intended for human review before implementation.

 

## Requirement Extraction

 

Before writing the plan:

 

1. Analyze the information description for the feature in: [path-to-your-brainstorm-information-doc].

2. Analyze the feature spec in: [specs\1.0.0\path-to-your\spec.md].

3. [Optional] reference any other files based on research

 

---

 

## Based on analysis, generate the plan using the following sections

 

### 1. Architecture choices

 

---

 

### 2. Interfaces & models

 

If none are described, write:

 

---

 

### 3. Non-functional requirements

 

If none exist, write:

 

---

 

### 4. Repo structure

 

---

 

### 5. Sequencing

 

---

 

Generate the plan in [some-directory/some-file.md]