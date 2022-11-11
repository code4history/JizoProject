 window.addEventListener('load', function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(function(registration) {
        console.log("sw registed.");
      }).catch(function(error) {
      console.warn("sw error.", error);
    });
  }
});
const accessToken =
  "pk.eyJ1IjoicmVraXNoaWtva3VkbyIsImEiOiJjazRoMmF3dncwODU2M2ttdzI2aDVqYXVwIn0.8Hb9sekgjfck6Setxk5uVg";
const style = "mapbox://styles/moritoru/ck4s6w8bd0sb51cpp9vn7ztty";
const latLng = [34.66472542913676, 135.83543371143801];
const zoom = 15;
const minZoom = 5;
const maxZoom = 21;
const hashTags = ['奈良地蔵'];
const geoJson = "jizo_project.geojson";
const mymap = L.map("mapid", {
  minZoom: minZoom,
  maxZoom
}).setView(latLng, zoom);
const roundDec = (val, level) => {
  const powVal = Math.pow(10, level);
  return Math.round(val * powVal) / powVal;
};
L.mapboxGL({
  accessToken,
  style,
  minZoom: minZoom - 1,
  maxZoom
}).addTo(mymap);
L.control
  .locate({
    icon: "fa fa-crosshairs",
  })
  .addTo(mymap);
L.control
  .attribution({
    prefix: `石造文化財アイコン: © 2022 T.N.K.Japan, Code for History, <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">CC BY-SA 4.0</a>`
  })
  .addTo(mymap);
// see here: https://github.com/Fallstop/OverlappingMarkerSpiderfier-Leaflet#construction
const oms = new OverlappingMarkerSpiderfier(mymap, L, {
  keepSpiderfied: true,
});
let lastClickedMarker = null;
let lastClickedMarkerOriginalLatlng = null;
let isEditingMarker = false;
let spiderfyStatus = false;
let editedTweet = false;
let layerControl;
let newEditMarker;
let currentTwitSubmitter;
let currentTwitCanceller;

fetch(geoJson)
  .then(async (data) => data.json())
  .then((geojson) => {
    return Quyuan.templateExtractor({
      geojson,
      templates: {
        pin: iconTemplate,
        html: popupHtmlTemplate,
      }
    });
  })
  .then((geojson) => {
    const confirmed = L.layerGroup([]);
    const nonconfirmed = L.layerGroup([]);
    const container = document.querySelector('#container');
    const pane = container.querySelector("#poipane");
    const close_button = pane.querySelector(".poipane-close-button");
    close_button.addEventListener("click", closePoiPane);
    geojson.features.forEach((feature) => {
      if (feature.geometry) {
        const icons = feature.result.pin.split(',');
        const iconUrl = icons[0];
        const width = parseInt(icons[1]);
        const height = parseInt(icons[2]);
        const iconOptions = {
          iconUrl,
          iconSize: [width, height],
          iconAnchor: [width / 2, height],
          popupAnchor: [0, -1 * height],
        };
        // source file coordinates are ordered by lnglat, but should be latlng.
        const marker = L.marker(feature.geometry.coordinates.reverse(), {
          icon: L.icon(iconOptions),
        });
        marker.html = feature.result.html;
        marker.name = feature.properties.name;
        marker.addTo(feature.properties.confirmed ? confirmed : nonconfirmed);
        oms.addMarker(marker);
      }
    });
    newEditMarker = L.marker(latLng, {
      icon: L.icon({
        iconUrl: './assets/new.png',
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44]
      })
    });

    newEditMarker.addEventListener('remove', () => {
      newEditMarker.setLatLng(mymap.getCenter());
    });
    newEditMarker.once("click", () => {
      preparePoiPane();
    });

    mymap.on('moveend',() => {
      if (!mymap.hasLayer(newEditMarker)) {
        newEditMarker.setLatLng(mymap.getCenter());
      }
    });
    oms.addListener("click", preparePoiPane);
    layerControl = L.control.layers(null, {
      "現況確認済み": confirmed,
      "未確認(情報募集中)": nonconfirmed,
      "新規報告ピン表示": newEditMarker
    }, {
      position: "bottomright"
    }).addTo(mymap);
    confirmed.addTo(mymap);
  });
oms.addListener("spiderfy", (markers) => {
  spiderfyStatus = true;
  mymap.closePopup();
});
oms.addListener("unspiderfy", (markers) => {
  setTimeout(() => {
    spiderfyStatus = false;
  }, 100)
});
const hiddenMarkers = () => {
  mymap.eachLayer((layer) => {
    if (layer.options.icon instanceof L.Icon) {
      layer._hiddenForApplyPoi = true;
      layer.getElement().style.visibility = "hidden";
    }
  });
};
const visibleMarkers = () => {
  mymap.eachLayer((layer) => {
    if (layer._hiddenForApplyPoi) {
      layer._hiddenForApplyPoi = false;
      layer.getElement().style.visibility = "visible";
    }
  });
};

const prepareEditMarker = (poiId, name) => {
  const poi_div = document.querySelector("#poipane");
  const report_link = poi_div.querySelector(".report-link");
  const report_form = poi_div.querySelector(".report-form") || poi_div.querySelector(".poipane-content");
  if (report_link) {
    report_link.classList.add("hide");
  }
  const title_part = poiId ? "修正提案" : "新規報告";
  let latlng;
  if (!poiId) {
    latlng = newEditMarker.getLatLng();
  }
  report_form.innerHTML = `<h3>${title_part}フォーム</h3>
    <ul>
    <li>${title_part}フォームはTwitterを通じて報告されます。</li>
    <li>${title_part}の詳細をテキストエリアに入力し、報告ボタンを押してTwitterを起動して報告してください。Twitter起動後は、万一の文字数オーバーなどがない限り、内容を修正しないでください。</li>
    <li>位置の修正を行う場合はピンをドラッグして位置を修正してください。自動でTwitter投稿に新しい経緯度が付与されます。</li>
    <li>画像の添付はTwitter起動後、Twitter投稿に添付してください。添付した画像は、Creative Commons 4.0 BY-SAの条件で誰でも使えるオープンデータになることを了承されたものとみなします。</li>
    </ul>
    <span class="span-report">${poiId ? `POI ID: ${poiId}<br>${name}` : "新規報告"} #${hashTags[0]}${
      poiId ? "" : `<br>緯度:${roundDec(latlng.lat,7)}, 経度:${roundDec(latlng.lng,7)}`
    }</span><br>
    <textarea class="text-report"></textarea><br>
    <span class="report-number"></span><br>
    <a href="#" class="button twit-submit" onclick="currentTwitSubmitter();">投稿</a> <a href="#" class="button twit-cancel" onclick="currentTwitCanceller();">キャンセル</a><br><br>`;
  const textReport = poi_div.querySelector(".text-report");
  currentTwitSubmitter = () => {
    const tweet = getWillTweetText();
    const href = createTwitterIntentUrl({
      text: tweet,
    });
    window.open(href, "_blank", "noreferrer");
    editedTweet = false;
    closeTweetForm(poiId);
  };
  currentTwitCanceller = () => {
    closeTweetForm(poiId);
  };
  textReport.addEventListener("keyup", updateReportNumber);
  textReport.addEventListener("change", updateReportNumber);
  textReport.addEventListener("compositionupdate", updateReportNumber);
  updateReportNumber();
  editedTweet = false;

  oms.unspiderfy();
  hiddenMarkers();
  lastClickedMarker.getElement().style.visibility = "visible";
  oms.removeMarker(lastClickedMarker);
  lastClickedMarker.dragging.enable();
  mymap.removeControl(layerControl);

  lastClickedMarker.on("dragend", () => {
    updateMarkerMove(poiId, name, lastClickedMarker);
  });
  isEditingMarker = true;
};

const updateMarkerMove = (poiId, name, marker) => {
  const latlng = marker.getLatLng();
  const text = `${poiId ? `POI ID: ${poiId}\n${name}` : "新規報告"} #${hashTags[0]}\n緯度:${roundDec(latlng.lat,7)}, 経度:${roundDec(latlng.lng,7)}`;
  const spanReport = document.querySelector("#poipane .span-report");
  spanReport.innerText = text;
  updateReportNumber();
};

const updateReportNumber = () => {
  editedTweet = true;
  const reportNumber = document.querySelector("#poipane .report-number");
  const twitSubmit = document.querySelector("#poipane .twit-submit");
  const reportAll = getWillTweetText();
  const parseResult = twttr.txt.parseTweet(reportAll);
  reportNumber.innerText = `残り ${280 - parseResult.weightedLength} 文字`;
  if (parseResult.valid) {
    reportNumber.classList.remove("red");
    twitSubmit.disabled = false;
  } else {
    reportNumber.classList.add("red");
    twitSubmit.disabled = true;
  }
};

const getWillTweetText = () => {
  const spanReport = document.querySelector("#poipane .span-report");
  const textReport = document.querySelector("#poipane .text-report");
  const spanText = spanReport.innerText;
  const textText = textReport.value;
  return `${spanText}\n${textText}`;
};

const proposeEditedMarker = () => {
  lastClickedMarker.dragging.disable();
  if (lastClickedMarkerOriginalLatlng) {
    lastClickedMarker.setLatLng(lastClickedMarkerOriginalLatlng);
  }
  isEditingMarker = false;
  editedTweet = false;
  if (lastClickedMarker !== newEditMarker) {
    oms.addMarker(lastClickedMarker);
  } else {
    newEditMarker.once("click", () => {
      preparePoiPane();
    });
  }
  visibleMarkers();
  mymap.addControl(layerControl);
};

const closePoiPane = () => {
  if (isEditingMarker && editedTweet && !window.confirm("投稿内容が更新されています。キャンセルしてよいですか？")) return;

  const container = document.querySelector('#container');
  const pane = container.querySelector("#poipane");
  const poi_content = pane.querySelector(".poipane-content");
  container.classList.toggle('open');
  container.classList.toggle('close');
  container.classList.add('transition');
  setTimeout(() => {
    container.classList.remove('transition');
    mymap.invalidateSize();
  }, 100);
  poi_content.innerHTML = "";
  if (isEditingMarker) proposeEditedMarker();
}

const closeTweetForm = (poiId) => {
  if (editedTweet && !window.confirm("投稿内容が更新されています。キャンセルしてよいですか？")) return;

  if (poiId) {
    const poi_div = document.querySelector(".poi");
    const report_link = poi_div.querySelector(".report-link");
    const report_form = poi_div.querySelector(".report-form");
    report_link.classList.remove("hide");
    report_form.innerHTML = "";
  }
  proposeEditedMarker();
  if (!poiId) {
    closePoiPane();
  }
}

const preparePoiPane = (marker) => {
  const container = document.querySelector('#container');
  const pane = container.querySelector("#poipane");
  const poi_content = pane.querySelector(".poipane-content");

  poi_content.innerHTML = marker ? marker.html : "";
  container.classList.add('open');
  container.classList.remove('close');
  container.classList.add('transition');
  setTimeout(() => {
    container.classList.remove('transition');
    mymap.invalidateSize();
    if (marker) {
      mymap.panTo(marker.getLatLng());
    }
  }, 100);

  if (!isEditingMarker) {
    lastClickedMarker = marker || newEditMarker;
    lastClickedMarkerOriginalLatlng = marker ? marker.getLatLng() : null;
  }
  if (!marker) {
    prepareEditMarker();
  }
};
