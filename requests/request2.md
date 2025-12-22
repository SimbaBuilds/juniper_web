⏺ Confirmed! After your UI edit:
  - Before: list (correct)
  - After: str (string)

  The UI IS converting to JSON strings when saving. The UI dev may not realize it - it's likely happening in:
  - Form serialization
  - API call JSON.stringify() being called twice
  - A middleware or state management layer

  The backend fix we deployed handles this, but the UI should be fixed to prevent double-stringification.