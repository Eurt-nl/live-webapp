# Debug Utility

Deze debug utility zorgt ervoor dat console logs alleen worden getoond in development mode.

## Gebruik

```typescript
import { debug, dlog } from 'src/utils/debug';

// Basis logging
debug.log('Dit wordt alleen getoond in development');
dlog('Kortere syntax voor debug.log');

// Verschillende log levels
debug.info('Informatie bericht');
debug.warn('Waarschuwing');
debug.error('Fout bericht');

// Groeperen van logs
debug.group('Hole toevoegen');
debug.log('Hole data:', holeData);
debug.log('GPS data:', gpsData);
debug.groupEnd();
```

## Voordelen

- **Development only**: Logs verschijnen alleen in development mode
- **Productie veilig**: Geen console logs in productie builds
- **Consistent**: Alle debug logs hebben hetzelfde formaat
- **Flexibel**: Ondersteunt alle console methoden
- **Korte syntax**: `dlog()` voor snelle debug statements

## Vervangen van console.log

Vervang alle `console.log()` statements door `debug.log()` of `dlog()` voor debug informatie die alleen in development nodig is.

Voor echte fouten en waarschuwingen die altijd getoond moeten worden, blijf `console.error()` en `console.warn()` gebruiken.
