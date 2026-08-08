# Python Learning Note: `dataclass`, `dataclasses`, and `pydantic`

## `dataclass`

`@dataclass` is a decorator used on a class to automatically generate common boilerplate for data containers.

It usually helps with:

- `__init__`
- `__repr__`
- `__eq__`

Example:

```python
from dataclasses import dataclass

@dataclass
class Profile:
    skills: list[str]
    experience_level: str
```

This means Python will create a useful initializer and a few other methods for you.

## `dataclasses`

`dataclasses` is the standard library module that provides `@dataclass`.

So:

- `dataclasses` = the module
- `dataclass` = the decorator you import from that module

You usually write:

```python
from dataclasses import dataclass
```

## When `dataclass` was introduced

`dataclass` and the `dataclasses` module were introduced in **Python 3.7**.

That makes them a relatively modern and very common way to model structured data in Python.

## `pydantic`

`pydantic` is a third-party library for defining data models with validation.

It is especially useful when you want:

- input validation
- type coercion
- helpful error messages
- easy parsing of JSON-like data
- structured models for APIs, fixtures, and agent inputs/outputs

Example:

```python
from pydantic import BaseModel

class Profile(BaseModel):
    skills: list[str]
    experience_level: str
```

## `pydantic` vs `dataclass`

Both can represent structured data, but they are optimized for slightly different jobs.

### `dataclass`

Use `dataclass` when:

- you want a lightweight Python standard-library solution
- your data is already trusted or already well-formed
- you want simple, readable classes with very little magic

### `pydantic`

Use `pydantic` when:

- you want to validate incoming data
- you expect messy or external input
- you want rich errors when data is wrong
- you are working with JSON, API responses, or tool outputs

## Practical difference

In this project:

- `dataclass` is the simpler standard-library option
- `pydantic` is the safer and more structured option

For an agent project, `pydantic` is often a better fit because the agent will constantly handle structured but imperfect data from fixtures, tools, and eventually GitHub-like sources.

For learning Python basics, `dataclass` is often easier to understand first.

## Short rule of thumb

- Choose `dataclass` for simple internal data containers.
- Choose `pydantic` for validated models at the edges of your system.
