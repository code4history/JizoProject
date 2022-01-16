let iconTemplate = "";

iconTemplate = `
{%- set iconUrl = "hotoke" -%}
{%- set width = 43 -%}
{%- set height = 48 -%}

{%- if type.match("地蔵") -%}
  {%- set iconUrl = "jizo" -%}
  {%- set width = 35 -%}
{%- elif type.match("小祠") -%}
  {%- set iconUrl = "jinja" -%}
  {%- set width = 52 -%}
{%- endif -%}

{%- if lost -%}
  {%- set iconUrl = iconUrl + "_sepia" -%}
{%- elif need_action -%}
  {%- set iconUrl = iconUrl + "_surprise" -%}
{%- endif -%}

./assets/{{- iconUrl -}}.png,{{- width -}},{{- height -}}
`;