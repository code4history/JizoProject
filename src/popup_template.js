let popupHtmlTemplate = "";

popupHtmlTemplate += `<div class="poi">`;

popupHtmlTemplate += `<h2>{{ title }} (`;
popupHtmlTemplate += `{{ address }}`;
popupHtmlTemplate += `)</h2>`;

popupHtmlTemplate += `<a class="report-link" href="javascript:void(0)" onclick="prepareEditMarker({{ fid }}, '{{ title }}');">修正提案をする</a><br>`;
popupHtmlTemplate += `<div class="report-form"></div>`;

popupHtmlTemplate += `{% if type %} <b>種別:</b> {{ type }} <br> {% endif %}`;

popupHtmlTemplate += `{% if images.length > 0 %}
  <qy-swiper style='height: 300px'>
    {% for image in images %}
      <qy-swiper-slide imageUrl="{{ image.path | safe }}" thumbnailUrl="{{ image.mid_thumbs | safe }}" imageType="image" caption="{{ image.description }}"></qy-swiper-slide>
    {% endfor %}
  </qy-swiper>
{% endif %}`;

popupHtmlTemplate += `{% if era %}<b>年代:</b> {{ era }}<br>{% endif %}`;
popupHtmlTemplate += `{% if year %}<b>西暦:</b> {{ year }}<br>{% endif %}`;
popupHtmlTemplate += `{% if japan_calendar %}<b>和暦:</b> {{ japan_calendar }}<br>{% endif %}`;
popupHtmlTemplate += `{% if description %}         <b>記述:</b> {{ description | nl2br | safe }}<br> {% endif %}`;
popupHtmlTemplate += `{% if note %}        <b>メモ:</b> {{ note | nl2br | safe }}<br> {% endif %}`;
popupHtmlTemplate += `{% if inscription %}        <b>刻銘:</b> {{ inscription | nl2br | safe }}<br> {% endif %}`;
popupHtmlTemplate += `<b>最終現地調査日:</b> {%if brushup %} {{ surveyed }} {% else %} 未調査 {% endif %}<br>`;
popupHtmlTemplate += `{% if height %}<b>総高:</b> {{ height }}cm<br>{% endif %}`;
popupHtmlTemplate += `{% if partial_height %}<b>部分高:</b> {{ partial_height }}cm<br>{% endif %}`;
popupHtmlTemplate += `{% if width %}<b>総高:</b> {{ width }}cm<br>{% endif %}`;
popupHtmlTemplate += `{% if depth %}<b>総高:</b> {{ depth }}cm<br>{% endif %}`;
popupHtmlTemplate += `{% if lost %}        <b>現況:</b> 現存せず<br> {% endif %}`;
popupHtmlTemplate += `{% if need_action %}        <b>アクション要:</b> {{ need_action | nl2br | safe }}<br> {% endif %}`;

popupHtmlTemplate += `{% if books.length > 0 %}<b>言及資料:</b><br>`;
popupHtmlTemplate += `<ul class="parent">
  {% for book in books %}
    <li>
      {% if book.anchor and book.anchor.match("^http") %}
        <a href="{{ book.anchor }}">{{ book.title }}</a> ({{ book.editor }})
      {% else %}
        <b>{% if book.url %}<a href="{{ book.url }}">{% endif %}{{ book.title }}{% if book.url %}</a>{% endif %}</b> ({% if book.editor %}{{ book.editor }}{% else %}{{ book.publisher }}{% endif %}{% if book.published_at %}, {{ book.published_at }}{% endif %}){% if book.anchor %}: {{ book.anchor }}ページ{% endif %}
      {% endif %}
    </li>    
  {% endfor %}
</ul>{% endif %}`;


popupHtmlTemplate += `</div>`;
