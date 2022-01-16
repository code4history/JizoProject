let iconTemplate = "";

iconTemplate = `
{%- set iconUrl = "hotoke" -%}
{%- set width = 29 -%}
{%- set height = 44 -%}

{%- if type.match("地蔵") -%}
  {%- set iconUrl = "jizo" -%}
  {%- set width = 23 -%}
{%- elif type.match("小祠") -%}
  {%- set iconUrl = "jinja" -%}
  {%- set width = 35 -%}
{%- endif -%}

{%- if lost -%}
  {%- set iconUrl = iconUrl + "_sepia" -%}
  {%- set height = 36 -%}
  {%- set width = (width * 24) / 32 -%}
{%- elif need_action -%}
  {%- set iconUrl = iconUrl + "_surprise" -%}
  {%- set height = 36 -%}
  {%- set width = (width * 24) / 32 -%}
{%- endif -%}

./assets/{{- iconUrl -}}.png,{{- width -}},{{- height -}}
`;