import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

interface WeatherData {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windDirection: number | null;
}

interface LocationInfo {
  lat: number;
  lng: number;
  elevation: number | null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function GeoLocationTab() {
  const { t } = useTranslation();
  const { setOutsideFromWeather, setAirPressure } = useAppStore();

  const [location, setLocation] = useState<LocationInfo>({
    lat: DEFAULT_CENTER[0],
    lng: DEFAULT_CENTER[1],
    elevation: null,
  });
  const [weather, setWeather] = useState<WeatherData>({
    temperature: null,
    humidity: null,
    pressure: null,
    windSpeed: null,
    windDirection: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`
      );
      const data = await res.json();
      const c = data.current;
      setWeather({
        temperature: c?.temperature_2m ?? null,
        humidity: c?.relative_humidity_2m ?? null,
        pressure: c?.surface_pressure ? Math.round(c.surface_pressure) : null,
        windSpeed: c?.wind_speed_10m ?? null,
        windDirection: c?.wind_direction_10m ?? null,
      });

      const elRes = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`
      );
      const elData = await elRes.json();
      setLocation((prev) => ({
        ...prev,
        lat,
        lng,
        elevation: elData.elevation?.[0] ?? null,
      }));
    } catch {
      /* network error */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
  }, [fetchWeather]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setLocation((prev) => ({ ...prev, lat, lng }));
      fetchWeather(lat, lng);
    },
    [fetchWeather]
  );

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        fetchWeather(latitude, longitude);
      },
      () => {}
    );
  }, [fetchWeather]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setLocation((prev) => ({ ...prev, lat, lng }));
        fetchWeather(lat, lng);
      }
    } catch {
      /* search failed */
    }
  }, [searchQuery, fetchWeather]);

  const handleLoadToPsychro = useCallback(() => {
    if (weather.temperature !== null && weather.humidity !== null) {
      setOutsideFromWeather(weather.temperature, weather.humidity);
      if (weather.pressure !== null) {
        setAirPressure(weather.pressure);
      }
    }
  }, [weather, setOutsideFromWeather, setAirPressure]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-brand-teal">{t('geo.title')}</h2>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('geo.searchPlaceholder')}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-brand-teal text-white text-sm rounded-md hover:bg-brand-teal-light transition-colors"
        >
          {t('geo.search')}
        </button>
        <button
          onClick={handleGPS}
          className="px-4 py-2 border border-brand-teal/30 text-brand-teal text-sm rounded-md hover:bg-brand-blue/30 transition-colors"
        >
          {t('geo.gpsLocation')}
        </button>
      </div>

      <div className="rounded-lg overflow-hidden border border-brand-blue" style={{ height: 400 }}>
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          key={`${location.lat}-${location.lng}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[location.lat, location.lng]} />
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-brand-blue rounded-lg p-4">
          <h3 className="font-semibold text-brand-teal mb-3">{t('geo.currentLocation')}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('geo.coordinates')}</span>
              <span className="font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('geo.elevation')}</span>
              <span className="font-mono">
                {location.elevation !== null ? `${location.elevation} m` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-brand-blue rounded-lg p-4">
          <h3 className="font-semibold text-brand-teal mb-3">{t('geo.nearbyStation')}</h3>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('inputs.temperature')}</span>
                <span className="font-mono">
                  {weather.temperature !== null ? `${weather.temperature} °C` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('geo.humidity')}</span>
                <span className="font-mono">
                  {weather.humidity !== null ? `${weather.humidity} %` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('geo.pressure')}</span>
                <span className="font-mono">
                  {weather.pressure !== null ? `${weather.pressure} hPa` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('geo.windSpeed')}</span>
                <span className="font-mono">
                  {weather.windSpeed !== null ? `${weather.windSpeed} m/s` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('geo.windDirection')}</span>
                <span className="font-mono">
                  {weather.windDirection !== null ? `${weather.windDirection}°` : '—'}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLoadToPsychro}
            disabled={weather.temperature === null}
            className="mt-3 w-full px-3 py-2 bg-brand-green text-white text-sm rounded-md hover:bg-brand-green-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('geo.loadToPsychro')}
          </button>
        </div>
      </div>
    </div>
  );
}
