let loading: Promise<void> | undefined;

export function loadGoogleMap() {
  if (window.google?.maps) return Promise.resolve();
  if (loading) return loading;
  // This is a separate, website-restricted public Maps key, never the Places server key.
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key)
    return Promise.reject(
      new Error(
        "Live pins need a website-restricted Google Maps key. Demo mode is always available.",
      ),
    );
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const callback = "neoquestMapsReady";
    const callbacks = window as unknown as Record<string, unknown>;
    const timer = window.setTimeout(() => fail(), 20000);
    function fail() {
      window.clearTimeout(timer);
      script.remove();
      delete callbacks[callback];
      loading = undefined;
      reject(
        new Error(
          "Google Maps couldn’t load. Check the Maps key, website restrictions, and connection, or return to demo mode.",
        ),
      );
    }
    callbacks[callback] = () => {
      window.clearTimeout(timer);
      delete callbacks[callback];
      resolve();
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callback}`;
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}
