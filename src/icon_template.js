let iconTemplate = "";

iconTemplate = `
{%- set iconUrl = "stone" -%}
{%- set width = 28 -%}
{%- set height = 40 -%}

{%- if type.match("地蔵") -%}
  {%- set iconUrl = "jizo" -%}
{%- elif type.match("菩薩") or type.match("その他石仏") or type.match("石仏群") -%}
  {%- set iconUrl = "bosatsu" -%}
{%- elif type.match("如来") -%}
  {%- set iconUrl = "nyorai" -%}
{%- elif type.match("明王") -%}
  {%- set iconUrl = "myooh" -%}
{%- elif type.match("天部") -%}
  {%- set iconUrl = "ten_male" -%}
{%- elif type.match("小神社") -%}
  {%- set iconUrl = "shrine" -%}
{%- elif type.match("小祠") -%}
  {%- set iconUrl = "hokora" -%}
{%- elif type.match("石祠") -%}
  {%- set iconUrl = "sekishi" -%}
{%- elif type.match("小祠") -%}
  {%- set iconUrl = "hokora" -%}
{%- elif type.match("石神") or type.match("石塚") -%}
  {%- set iconUrl = "sekijin" -%}
{%- elif type.match("野神") or type.match("神木") -%}
  {%- set iconUrl = "tree" -%}
{%- elif type.match("庚申") -%}
  {%- set iconUrl = "koshin" -%}
{%- elif type.match("青面金剛") -%}
  {%- set iconUrl = "shomen" -%}
{%- elif type.match("馬頭観音") -%}
  {%- set iconUrl = "bato" -%}
{%- elif type.match("月待塔") -%}
  {%- set iconUrl = "tsukimachi" -%}
{%- elif type.match("如意輪観音") -%}
  {%- set iconUrl = "nyoirin" -%}
{%- elif type.match("道標") or type.match("標石") -%}
  {%- set iconUrl = "dohyo" -%}
{%- elif type.match("道祖神") -%}
  {%- set iconUrl = "dosojin" -%}
{%- elif type.match("記念碑") -%}
  {%- set iconUrl = "chukonhi" -%}
{%- elif type.match("句碑") or type.match("歌碑") -%}
  {%- set iconUrl = "kinenhi" -%}
{%- elif type.match("供養") -%}
  {%- set iconUrl = "kuyohi" -%}
{%- elif type.match("名号") or type.match("題目") -%}
  {%- set iconUrl = "myogo" -%}
{%- elif type.match("浮彫五輪塔") -%}
  {%- set iconUrl = "ukibori_gorin" -%}
{%- elif type.match("富士講") -%}
  {%- set iconUrl = "fujiko" -%}
{%- elif type.match("湯殿山") or type.match("大峰講") -%}
  {%- set iconUrl = "mount" -%}
{%- elif type.match("宝篋印塔") -%}
  {%- set iconUrl = "hokyoin" -%}
{%- elif type.match("五輪塔") -%}
  {%- set iconUrl = "gorinto" -%}
{%- elif type.match("板碑") -%}
  {%- set iconUrl = "itahi" -%}
{%- elif type.match("碑") -%}
  {%- set iconUrl = "kinenhi" -%}  
{%- endif -%}

{%- if status and status.match("消失") -%}
  {%- set iconUrl = iconUrl + "_missing" -%}
{%- elif need_action or (not confirmed) or contradiction -%}
  {%- set iconUrl = iconUrl + "_action" -%}
{%- endif -%}

./assets/{{- iconUrl -}}.png,{{- width -}},{{- height -}}
`;