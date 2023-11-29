let popupHtmlTemplate = "";

popupHtmlTemplate += `<div class="poi">`;

popupHtmlTemplate += `<h2>{{ title }} (`;
popupHtmlTemplate += `{{ area }}`;
popupHtmlTemplate += "{% if oaza %} / {{ oaza }} {% endif %}";
popupHtmlTemplate += "{% if koaza %} / {{ koaza }} {% endif %}";
popupHtmlTemplate += "{% if detail_place %} / {{ detail_place }} {% endif %}";
popupHtmlTemplate += `)</h2>`;

popupHtmlTemplate += `<a class="report-link" href="javascript:void(0)" onclick="prepareEditMarker({{ fid }}, '{{ name }}');">修正提案をする</a><br>`;
popupHtmlTemplate += `<div class="report-form"></div>`;

popupHtmlTemplate += `{% if type %} <b>種別:</b> {{ type }} <br> {% endif %}`;

popupHtmlTemplate += `{% if images.length > 0 %}
  <qy-swiper style='height: 300px'>
    {% for image in images %}
      <qy-swiper-slide imageUrl="{{ image.path | replace("./", "https://raw.githubusercontent.com/code4history/JizoProject/master/") |safe }}" thumbnailUrl="{{ image.mid_thumbs | replace("./", "https://raw.githubusercontent.com/code4history/JizoProject/master/") | safe }}" imageType="image" caption="{{ image.description }}"></qy-swiper-slide>
    {% endfor %}
  </qy-swiper>
{% endif %}`;

popupHtmlTemplate += `<b>年代:</b> {{ era }} {% if year %} ({{ year }}) {% endif %}<br>`;

popupHtmlTemplate += `{% if shape %}         <b>形状:</b> {{ shape }}<br> {% endif %}`;
popupHtmlTemplate += `{% if reference_memo %}        <b>付帯情報:</b> {{ reference_memo | nl2br | safe }}<br> {% endif %}`;
popupHtmlTemplate += `{% if history %}        <b>来歴等:</b> {{ history | nl2br | safe }}<br> {% endif %}`;
popupHtmlTemplate += `{% if folklore %}        <b>伝承等:</b> {{ folklore | nl2br | safe }}<br> {% endif %}`;
popupHtmlTemplate += `{% if survey_memo %}        <b>調査時メモ:</b> {{ survey_memo | nl2br | safe }}<br> {% endif %}`;
popupHtmlTemplate += `{% if material %}      <b>材質:</b> {{ material }}<br> {% endif %}`;
popupHtmlTemplate += `{% if height %}        <b>総高:</b> {{ height }}cm<br> {% endif %}`;
popupHtmlTemplate += `{% if partial_height %} <b>部分高:</b> {{ partial_height }}cm<br> {% endif %}`;
popupHtmlTemplate += `{% if width %}         <b>幅:</b> {{ width }}cm<br> {% endif %}`;
popupHtmlTemplate += `{% if depth %}         <b>奥行:</b> {{ depth }}cm<br> {% endif %}`;
popupHtmlTemplate += `{% if inscription %}   <b>刻銘:</b> {{ inscription | nl2br | safe }}<br> {% endif %}`;

popupHtmlTemplate += `<b>最終現地調査日:</b> {%if confirmed %} {{ surveyed }} {% else %} 未調査 {% endif %}<br>`;

popupHtmlTemplate += `<b>現況:</b>
  {% if status == "消失" %} 喪失
  {% elif status == "消失?" %} 喪失疑い
  {% elif status == "新規発見" %} 新規追加(資料にない)
  {% elif confirmed %} 現存
  {% else %} 不明(未調査) {% endif %}<br>`;

popupHtmlTemplate += `{% if need_action %}   <b>アクション要:</b> {{ need_action }} <br> {% endif %}`;
popupHtmlTemplate += `{% if contradiction %} <b>資料の矛盾:</b> {{ contradiction }} <br> {% endif %}`;

popupHtmlTemplate += `{% if books.length > 0 %}<b>言及資料:</b><br>`;
popupHtmlTemplate += `<ul class="parent">
  {% for book in books %}
    <li>
      {% if book.anchor and book.anchor.match("^http") %}
        <a href="{{ book.anchor }}">{{ book.title }}</a> ({{ book.editor }})
      {% else %}
        <b>{% if book.url %}<a href="{{ book.url }}">{% endif %}{{ book.title }}{% if book.url %}</a>{% endif %}</b> 
        ({% if book.editor %}{{ book.editor }}{% else %}{{ book.publisher }}{% endif %}{% if book.published_at %}, {{ book.published_at }}{% endif %})
        {% if book.anchor %}: {{ book.anchor }}{% if book.type == "book" %}ページ{% elif book.type == "journal" %}号{% endif %}{% endif %}
      {% endif %}
    </li>    
  {% endfor %}
</ul>{% endif %}`;

popupHtmlTemplate += `</div>`;
