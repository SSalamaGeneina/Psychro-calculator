import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

type GeoErrorKey =
  | 'geo.errors.weatherFetch'
  | 'geo.errors.searchFailed'
  | 'geo.errors.searchNoResults'
  | 'geo.errors.gpsUnavailable'
  | 'geo.errors.gpsDenied'
  | 'geo.errors.gpsTimeout'
  | 'geo.errors.gpsUnknown';

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapViewUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
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
  const [searchLoading, setSearchLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<GeoErrorKey | null>(null);
  const [searchError, setSearchError] = useState<GeoErrorKey | null>(null);
  const [gpsError, setGpsError] = useState<GeoErrorKey | null>(null);

  const weatherAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const weatherRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const gpsRequestIdRef = useRef(0);

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    weatherRequestIdRef.current += 1;
    const requestId = weatherRequestIdRef.current;
    weatherAbortRef.current?.abort();
    const controller = new AbortController();
    weatherAbortRef.current = controller;

    setLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`weather-http-${res.status}`);
      const data = await res.json();
      const c = data.current;
      if (requestId !== weatherRequestIdRef.current) return;

      setWeather({
        temperature: c?.temperature_2m ?? null,
        humidity: c?.relative_humidity_2m ?? null,
        pressure: c?.surface_pressure ? Math.round(c.surface_pressure) : null,
        windSpeed: c?.wind_speed_10m ?? null,
        windDirection: c?.wind_direction_10m ?? null,
      });

      const elRes = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
        { signal: controller.signal }
      );
      if (!elRes.ok) throw new Error(`elevation-http-${elRes.status}`);
      const elData = await elRes.json();

      if (requestId !== weatherRequestIdRef.current) return;
      setLocation((prev) => ({
        ...prev,
        lat,
        lng,
        elevation: elData.elevation?.[0] ?? null,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      if (requestId === weatherRequestIdRef.current) {
        setWeatherError('geo.errors.weatherFetch');
      }
    } finally {
      if (requestId === weatherRequestIdRef.current) {
        setLoading(false);
      }
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
    gpsRequestIdRef.current += 1;
    const requestId = gpsRequestIdRef.current;
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('geo.errors.gpsUnavailable');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (requestId !== gpsRequestIdRef.current) return;
        const { latitude, longitude } = pos.coords;
        setLocation((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        void fetchWeather(latitude, longitude).finally(() => {
          if (requestId === gpsRequestIdRef.current) {
            setGpsLoading(false);
          }
        });
      },
      (err) => {
        if (requestId !== gpsRequestIdRef.current) return;
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('geo.errors.gpsDenied');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('geo.errors.gpsTimeout');
        } else {
          setGpsError('geo.errors.gpsUnknown');
        }
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, [fetchWeather]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    searchRequestIdRef.current += 1;
    const requestId = searchRequestIdRef.current;
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearchError(null);
    setSearchLoading(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`search-http-${res.status}`);
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (requestId !== searchRequestIdRef.current) return;
        setLocation((prev) => ({ ...prev, lat, lng }));
        void fetchWeather(lat, lng);
      } else if (requestId === searchRequestIdRef.current) {
        setSearchError('geo.errors.searchNoResults');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      if (requestId === searchRequestIdRef.current) {
        setSearchError('geo.errors.searchFailed');
      }
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setSearchLoading(false);
      }
    }
  }, [searchQuery, fetchWeather]);

  useEffect(() => {
    return () => {
      weatherAbortRef.current?.abort();
      searchAbortRef.current?.abort();
    };
  }, []);

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
          aria-label={t('geo.searchPlaceholder')}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
        <button
          onClick={handleSearch}
          disabled={searchLoading}
          className="px-4 py-2 bg-brand-teal text-white text-sm rounded-md hover:bg-brand-teal-light transition-colors"
        >
          {searchLoading ? t('geo.searching') : t('geo.search')}
        </button>
        <button
          onClick={handleGPS}
          disabled={gpsLoading}
          className="px-4 py-2 border border-brand-teal/30 text-brand-teal text-sm rounded-md hover:bg-brand-blue/30 transition-colors"
        >
          {gpsLoading ? t('geo.gpsLocating') : t('geo.gpsLocation')}
        </button>
      </div>
      {(searchError || gpsError || weatherError) && (
        <div className="space-y-1">
          {searchError && (
            <p className="text-sm text-brand-orange bg-brand-orange/10 border border-brand-orange/30 rounded-md px-3 py-2">
              {t(searchError)}
            </p>
          )}
          {gpsError && (
            <p className="text-sm text-brand-orange bg-brand-orange/10 border border-brand-orange/30 rounded-md px-3 py-2">
              {t(gpsError)}
            </p>
          )}
          {weatherError && (
            <p className="text-sm text-brand-orange bg-brand-orange/10 border border-brand-orange/30 rounded-md px-3 py-2">
              {t(weatherError)}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg overflow-hidden border border-brand-blue" style={{ height: 400 }}>
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewUpdater lat={location.lat} lng={location.lng} />
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
          <h3 className="font-semibold text-brand-teal mb-3">{t('geo.modelEstimate')}</h3>
          {loading ? (
            <p className="text-sm text-gray-500">{t('geo.loading')}</p>
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
