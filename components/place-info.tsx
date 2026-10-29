import type { Activity } from "@/lib/activities";
export function PlaceInfo({ activity }: { activity: Activity }) {
  return (
    <>
      <p>{activity.description}</p>
      <span className="popup-area">{activity.address ?? activity.area}</span>
      {activity.source === "google" ? (
        <>
          <p className="place-rating">
            {activity.rating === undefined
              ? "Rating not provided"
              : `${activity.rating.toFixed(1)} / 5 · Google rating`}
          </p>
          {activity.mapsUrl && (
            <a
              className="place-link"
              href={activity.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Google Maps ↗
            </a>
          )}
          {activity.attributions?.map((a) => (
            <span key={a.displayName} className="place-attribution">
              {a.uri ? (
                <a href={a.uri} target="_blank" rel="noopener noreferrer">
                  {a.displayName}
                </a>
              ) : (
                a.displayName
              )}
            </span>
          ))}
          <p className="popup-disclaimer">
            Details from Google Places. Availability is not verified.
          </p>
        </>
      ) : activity.source === "osm" ? (
        <>
          <a className="place-link" href={activity.mapsUrl} target="_blank" rel="noopener noreferrer">View on OpenStreetMap ↗</a>
          <p className="popup-disclaimer">Data © OpenStreetMap contributors · Community mapped; details and access may be incomplete or outdated.</p>
        </>
      ) : (
        <p className="popup-disclaimer">
          Illustrative location. Not a verified venue.
        </p>
      )}
    </>
  );
}
