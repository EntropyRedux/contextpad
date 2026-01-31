# Code Block Parameters

This document lists the currently supported parameters for code blocks in ContextPad.

Syntax: ` ```language {key=value, boolean_flag} `

## AI Control
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `ai_ignore` | Boolean | Exclude from token counting and AI context. |
| `ai_only` | Boolean | Only include in AI context, hide from user view. |
| `role` | String | Semantic role for AI (`system`, `user`, `assistant`, `context`). |
| `importance` | String | Attention weight for AI blueprints (e.g., "high", "low", or numeric). |

* Remove FOR NOW, this needs planning as this is a custom design, I need to build the AI blueprint first and decide what I need


## HTML Export Control
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `echo` | Boolean | Show source code in HTML export. |
| `output` | Boolean | Show output/result in HTML export. |
| `eval` | Boolean | Execute/render code (for mermaid, katex). |
| `class` | String | CSS class to apply to block. |
| `id` | String | HTML id attribute. |

* this are standard parameters for HTML right? keep, if not we'll redesign it, remove for now until HTML download or Live Preview is added

## Rendering Hints
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `width` | String | Width for rendered output (e.g., "100%", "500px"). |
| `height` | String | Height for rendered output. |
| `caption` | String | Caption text for the block. |

* this are standard parameters for HTML right? keep, if not we'll redesign it, remove for now until HTML download or Live Preview is added

## Automation
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `action` | String | Action ID to associate with this block. |
| `trigger` | String | When to run action (`manual`, `save`, `export`). |

* I need explanation on this??

## Editor Behavior
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `lock` | Boolean | Lock block content. |
| `exclude` | String | Comma-separated exclusions. Use `exclude="variables"` to keep `{{variables}}` editable within a locked block. |

* yes, we worked hard for this, keep