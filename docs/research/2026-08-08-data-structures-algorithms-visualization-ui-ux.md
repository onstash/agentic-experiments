# UI/UX research: learning data structures and algorithms through visualization

Date: 2026-08-08

## Executive summary

The strongest pattern across established algorithm-visualization tools and education research is an active, inspectable learning loop:

1. Show a small, concrete state.
2. Let the learner provide or edit the input.
3. Let the learner run one meaningful operation at a time.
4. Ask the learner to predict the next state or outcome.
5. Reveal the transition, the pseudocode/code line, and the invariant being preserved.
6. Let the learner inspect, replay, modify, and implement the operation.

Animation should explain a state transition, not decorate it. A continuously moving demo is easy to watch but weak as a learning interface unless it gives the learner control and a way to reason about the next step.

## What existing tools reveal

### VisuAlgo: breadth, input control, training, and scale

[VisuAlgo](https://visualgo.net/en) supports user-provided inputs rather than only fixed examples, includes graph drawing in multiple graph visualizations, provides zoom scales for larger test cases, and offers focused training modules for structures such as linked lists, heaps, hash tables, trees, graphs, and segment trees. These are useful product patterns:

- an input editor is a first-class learning surface;
- visualization and exercises should be connected;
- scale controls help preserve the mental model as examples grow;
- topics should be discoverable by concept and structure, not only by algorithm name.

### Algorithm Visualizer: code-linked execution

[Algorithm Visualizer](https://algorithm-visualizer.org/) presents algorithms as executable visualizations and exposes visualization libraries for supported languages. The key UX implication is to keep implementation and visual state close together: learners should be able to move from an abstract operation to the corresponding code, inspect the data passed to it, and eventually author or modify the algorithm.

### D3: encode data through explicit visual primitives

[D3’s shape documentation](https://d3js.org/d3-shape) describes marks such as symbols, arcs, lines, areas, links, and stacks as data-driven generators with explicit accessors. For a learning tool, this supports a stable visual vocabulary: use consistent marks and encode values, references, comparisons, and relationships deliberately. Avoid changing a node’s meaning merely to create visual variety.

## Learning and interaction evidence

[Avancena and Nishihara’s case study](https://doi.org/10.28945/2184) reports increased post-test scores after use of an algorithm-learning tool and found that learners using a visualization with more input and control options scored higher than learners using a limited-control version. This supports exposing meaningful controls such as input size, values, starting node, operation, and speed—but controls should be tied to a learning objective rather than added as a settings menu.

[Hundhausen, Douglas, and Stasko’s meta-study](https://users.cs.duke.edu/~rodger/jflappapers/Hundhausen2002.pdf) examines learner involvement, including passive viewing versus actively constructing input data and predicting the next algorithm step. The practical design direction is to make prediction, manipulation, and explanation part of the default flow.

[Catrambone and Seay’s study](https://doi.org/10.1518/0018720024497637) compares graphical aids and animation for algorithm learning. The broader lesson is that animation is not automatically effective: explanatory content and the learner’s task determine whether motion helps. Give each animation a clear semantic event—comparison, swap, enqueue, relax, rotate, split, merge, or return—and pair it with a short explanation.

## Recommended information architecture

Use a three-layer layout that keeps the learner’s attention on one operation:

| Layer        | Purpose                        | Typical content                                                             |
| ------------ | ------------------------------ | --------------------------------------------------------------------------- |
| Orientation  | Build the mental model         | concept definition, operation goal, complexity, invariant                   |
| Execution    | Explain the current transition | visualization, current values, active pointers, step controls               |
| Verification | Turn seeing into knowing       | prediction prompt, trace table, code/pseudocode, tests, learner explanation |

Recommended persistent regions:

- Topic and operation selector: “Binary search → inspect midpoint” rather than a generic algorithm list.
- Main canvas: the structure, with active elements highlighted by role (current, candidate, visited, removed, destination).
- Playback rail: play, pause, previous, next, restart, speed, and a visible step count.
- State inspector: selected node/element, indexes, pointers, parent/child links, queue/stack contents, and relevant variables.
- Code/trace panel: highlight the exact line and show the state change caused by it.
- Learning panel: prompt, answer, explanation, and “try this input” controls.

On small screens, stack these regions in that order and preserve the step controls and state summary above the fold.

## Interaction patterns that should be default

### Step, scrub, and replay

Treat execution as a timeline of discrete states. Support previous/next and a scrubber, not only autoplay. A learner must be able to stop before a consequential operation, inspect the state, and replay it.

### Predict-then-reveal

Before a comparison, swap, rotation, or recursive return, ask one constrained question: “Which index is inspected next?” or “Which node becomes the parent?” Reveal the transition after submission. Store the prediction so the learner can compare reasoning with the result.

### Direct manipulation with guardrails

Allow dragging nodes, editing array values, adding/removing edges, and choosing a start node. Validate impossible states immediately and explain the rule. Provide reset and undo so experimentation is safe.

### Multiple representations, synchronized

Show the same state as a diagram plus a compact trace/table. For example, a graph view can be paired with a queue, visited set, distance map, and predecessor map. Selecting an item in one representation should focus it everywhere.

### Complexity as an observed claim

Show a short “why” beside Big-O. Let learners increase input size and compare operation counts, comparisons, depth, or memory. Do not imply that one animation run proves asymptotic complexity; label measured values as an example trace.

### Implementation bridge

Offer pseudocode first, then language-specific code, with line highlighting synchronized to the trace. Let learners change a line or implement a missing operation and run tests against the visualization.

## Visual language

- Use shape, labels, line style, and position in addition to color; color must never be the only distinction.
- Keep semantic colors stable across topics: active/current, comparison, mutation, success, warning, and inactive.
- Use motion to show continuity of identity. A node that moves should remain recognizable as the same node.
- Animate only the affected elements. Freeze unrelated structure to reduce visual noise.
- Make transitions reversible or replayable. A mutation should have a clear before and after state.
- Prefer small multiples or split views when comparing two algorithms; synchronize inputs and step positions.
- Provide a “show values/indices/pointers” density control for novices and advanced learners.

## Accessibility and inclusive UX requirements

[WCAG 2.2](https://www.w3.org/TR/WCAG22/) requires text alternatives for non-text content, keyboard access, visible and usable focus, information not conveyed by color alone, and content that remains adaptable. It also includes requirements relevant to algorithm animation: motion triggered by interaction must be disableable unless essential, and dragging functionality must have a non-drag alternative.

Apply those requirements directly:

- expose the current state as text, including ordered nodes, edges, indexes, variables, and the event description;
- provide keyboard equivalents for every playback and editing action;
- support reduced motion and instant transitions;
- use labels, patterns, outlines, and icons in addition to color;
- provide click/select alternatives for drag interactions;
- keep focus visible and never let the canvas trap focus;
- announce meaningful step changes to assistive technology without announcing every frame;
- ensure the exercise can be completed without timing pressure.

## Suggested MVP

Start with one operation each for an array, linked list, binary search tree, and graph traversal. For every operation, implement the same learning loop:

1. editable input;
2. initial state and invariant;
3. next-step prediction;
4. previous/next/play/pause/restart;
5. synchronized visualization, trace, and pseudocode;
6. operation count and complexity explanation;
7. text state output and keyboard/reduced-motion support;
8. a short practice task with generated and custom test cases.

This shared loop is more valuable than a large catalog of algorithms with inconsistent interaction models.

## Measures of success

Track learning and usability separately:

- Learning: next-step prediction accuracy, delayed recall, ability to explain the invariant, ability to implement or repair the operation, and transfer to a novel input.
- Usability: time to first successful run, number of unnecessary resets, playback-control errors, comprehension of the state inspector, and keyboard completion rate.
- Product: return to practice, completion of custom-input tasks, and which representations learners open when confused.

Avoid using “time watched” or animation completion as a proxy for understanding.

## Source notes

The product observations above are based on first-party project pages and documentation. The learning claims are deliberately qualified: the cited studies support active control and structured learning tasks, but they do not imply that every animation or every visualization improves learning.
