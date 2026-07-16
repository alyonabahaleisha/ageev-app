import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_CLOSE} from '../assets/icons';
import {Club, useClubs} from '../services/clubs';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

// Solid header bar content height below the status bar (Figma 382-5633).
const HEADER_CONTENT = 56;

// Builds the self-contained MapLibre GL map document. Clubs are injected as
// GeoJSON; CARTO's free dark vector style needs no API key, and all labels are
// forced to Russian (name:ru). GeoJSON clustering reproduces the Figma
// cluster-count pins. Tapping a pin's Telegram/VK link posts the URL back to
// RN (window.ReactNativeWebView.postMessage) to open natively.
function buildMapHtml(clubs: Club[], tgLabel: string, vkLabel: string): string {
  const points = clubs
    .filter(c => typeof c.latitude === 'number' && typeof c.longitude === 'number')
    .map(c => ({
      id: c.id,
      city: c.city,
      leader: c.leader || '',
      tg: c.telegramUrl || '',
      vk: c.vkUrl || '',
      lat: c.latitude,
      lng: c.longitude,
    }));

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet"/>
<style>
  html,body,#map{height:100%;margin:0;background:#0D2233;}
  .maplibregl-popup-content{background:#0D2233;color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:12px 14px;}
  .maplibregl-popup-anchor-top .maplibregl-popup-tip{border-bottom-color:#0D2233;}
  .maplibregl-popup-anchor-bottom .maplibregl-popup-tip{border-top-color:#0D2233;}
  .maplibregl-popup-close-button{color:rgba(255,255,255,0.6);font-size:16px;}
  .city{font:600 15px/1.2 Manrope,system-ui,sans-serif;}
  .leader{opacity:.65;font:400 13px/1.3 Manrope,system-ui,sans-serif;margin-top:3px;}
  .tg{display:block;margin-top:6px;padding:8px 0;color:#7BC4F3;font:600 14px/1 Manrope,system-ui,sans-serif;text-decoration:none;}
</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
  var clubs = ${JSON.stringify(points)};
  var tgLabel = ${JSON.stringify(tgLabel)};
  var vkLabel = ${JSON.stringify(vkLabel)};
  var byId = {};
  clubs.forEach(function(c){ byId[c.id] = c; });
  function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  var map = new maplibregl.Map({
    container:'map',
    style:'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center:[45,50], zoom:3.2, attributionControl:false
  });

  // Force every label layer to Russian, falling back to the local name.
  function ruLabels(){
    var layers = (map.getStyle() && map.getStyle().layers) || [];
    layers.forEach(function(l){
      if(l.type==='symbol' && l.layout && 'text-field' in l.layout){
        try{ map.setLayoutProperty(l.id,'text-field',['coalesce',['get','name:ru'],['get','name']]); }catch(e){}
      }
    });
  }

  var geojson = {type:'FeatureCollection',features:clubs.map(function(c){
    return {type:'Feature',geometry:{type:'Point',coordinates:[c.lng,c.lat]},properties:{id:c.id}};
  })};

  function popupFor(id, lngLat){
    var c = byId[id]; if(!c) return;
    var html = '<div class="city">'+esc(c.city)+'</div>'
      + (c.leader ? '<div class="leader">'+esc(c.leader)+'</div>' : '')
      + (c.tg ? '<a class="tg" href="#" onclick="openLink(\\''+c.id+'\\',\\'tg\\');return false;">'+esc(tgLabel)+'</a>' : '')
      + (c.vk ? '<a class="tg" href="#" onclick="openLink(\\''+c.id+'\\',\\'vk\\');return false;">'+esc(vkLabel)+'</a>' : '');
    new maplibregl.Popup({offset:14}).setLngLat(lngLat).setHTML(html).addTo(map);
  }

  map.on('load', function(){
    ruLabels();
    map.addSource('clubs',{type:'geojson',data:geojson,cluster:true,clusterRadius:45,clusterMaxZoom:14});
    map.addLayer({id:'clusters',type:'circle',source:'clubs',filter:['has','point_count'],
      paint:{'circle-color':'#7BC4F3','circle-radius':17,'circle-stroke-width':1.5,'circle-stroke-color':'#fff'}});
    map.addLayer({id:'cluster-count',type:'symbol',source:'clubs',filter:['has','point_count'],
      layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Open Sans Bold'],'text-size':13},
      paint:{'text-color':'#fff'}});
    map.addLayer({id:'points',type:'circle',source:'clubs',filter:['!',['has','point_count']],
      paint:{'circle-color':'#7BC4F3','circle-radius':7,'circle-stroke-width':1.5,'circle-stroke-color':'#fff'}});

    map.on('click','clusters',function(e){
      var f = map.queryRenderedFeatures(e.point,{layers:['clusters']});
      var cid = f[0].properties.cluster_id;
      map.getSource('clubs').getClusterExpansionZoom(cid).then(function(z){
        map.easeTo({center:f[0].geometry.coordinates, zoom:z});
      }).catch(function(){});
    });
    map.on('click','points',function(e){
      popupFor(e.features[0].properties.id, e.features[0].geometry.coordinates);
    });
    map.on('mouseenter','clusters',function(){ map.getCanvas().style.cursor='pointer'; });
    map.on('mouseenter','points',function(){ map.getCanvas().style.cursor='pointer'; });
  });

  function openLink(id, kind){
    var c = byId[id];
    var url = c && (kind === 'vk' ? c.vk : c.tg);
    if (url && window.ReactNativeWebView) window.ReactNativeWebView.postMessage(url);
  }

  // Called from RN search box: fly to the first matching city and open its pin.
  window.__search = function(q){
    q = (q||'').trim().toLowerCase();
    if(!q) return;
    var hit = clubs.find(function(c){ return c.city.toLowerCase().indexOf(q) >= 0; });
    if(!hit) return;
    map.flyTo({center:[hit.lng,hit.lat], zoom:9, speed:1.4});
    map.once('moveend', function(){ popupFor(hit.id, [hit.lng,hit.lat]); });
  };
</script></body></html>`;
}

type Props = {onClose: () => void};

export function ClubMapScreen({onClose}: Props) {
  const {top} = useSafeAreaInsets();
  const {clubs, loading} = useClubs();
  const t = useUIStrings();
  const tgLabel = t('clubs_map_telegram_link', 'Перейти в Telegram');
  const vkLabel = t('clubs_map_vk_link', 'Перейти во ВКонтакте');

  // Rebuild the document only when the club set changes (rare, realtime).
  const html = useMemo(
    () => buildMapHtml(clubs, tgLabel, vkLabel),
    [clubs, tgLabel, vkLabel],
  );

  function onMessage(e: WebViewMessageEvent) {
    const url = e.nativeEvent.data;
    if (url && url.startsWith('http')) {
      Linking.openURL(url).catch(() => {});
    }
  }

  return (
    <View style={styles.root}>
      {clubs.length > 0 && (
        <WebView
          originWhitelist={['*']}
          source={{html}}
          onMessage={onMessage}
          style={styles.web}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          androidLayerType="hardware"
        />
      )}

      {loading && clubs.length === 0 && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      )}

      {/* Solid blue header bar (Figma 382-5633): close left, title centered. */}
      <View style={[styles.header, {paddingTop: top, height: top + HEADER_CONTENT}]}>
        <Text style={styles.title}>{t('clubs_map_title', 'Наши клубы')}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClose}
          style={styles.closeBtn}>
          <SvgXml xml={ICON_CLOSE} width={24} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Light tone matching the Voyager map so the pre-tile load isn't a dark flash.
    backgroundColor: '#e6ebed',
  },
  web: {
    flex: 1,
    backgroundColor: '#e6ebed',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.brand.primary, // #22618D
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  title: {
    ...typography.bodyLarge, // H3 ≈ 18px medium
    color: colors.white,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    left: 24,
    bottom: 9,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
