let popupHtmlTemplate = "";

popupHtmlTemplate += `<div class="poi">`;

popupHtmlTemplate += `<h2>{{ title }} (`;
popupHtmlTemplate += `{{ address }}`;
popupHtmlTemplate += `)</h2>`;

popupHtmlTemplate += `<a class="report-link" href="javascript:void(0)" onclick="prepareEditMarker({{ fid }}, '{{ title }}');">修正提案をする</a><br>`;
popupHtmlTemplate += `<div class="report-form"></div>`;

popupHtmlTemplate += `{% if type %} <b>種別:</b> {{ type }} <br> {% endif %}`;

popupHtmlTemplate += `{% if images.length > 0 %}
  <div class="swiper swiper-images">
    <div class="swiper-wrapper">
      {%- for image in images %}
          <div class="swiper-slide">
            <img src="{{ image.path | safe }}" onclick="Quyuan.openViewer('{{ image.path | safe }}');" class="viewer">
          </div>
      {% endfor %}
      </div>
      <div class="swiper-button-next"></div>
      <div class="swiper-button-prev"></div>
      <div class="swiper-pagination"></div>
    </div>
{% endif %}`;

popupHtmlTemplate += `{% if description %}         <b>記述:</b> {{ description | nl2br | safe }}<br> {% endif %}`;
popupHtmlTemplate += `{% if note %}        <b>メモ:</b> {{ note | nl2br | safe }}<br> {% endif %}`;
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
