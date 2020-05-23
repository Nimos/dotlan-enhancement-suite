# Dotlan Enhancement Suite

This Chrome Extension adds various useful features to the Maps at https://evemaps.dotlan.net

## Features

- zKillboard Integration 
  - Live feed of kills in the region in the sidebar
  - New killmails indicated by short flash on the map
  
- Entosis Module
  - Show upcoming and active entosis timers in the sidebar
  - Show entosis progress under the contested system

- Tracking Module
  - Current location of signed-in character highlighted on map
  - Automatically load new region maps as the character travels
  

# Build
```
npm install
npm run build
```

# Roadmap / TODO / Feature List

### Background stuff

- [x] Eve OAuth Login
- [x] ESI Request Wrapper with caching
- [x] Modular structure
- [ ] Eve OAuth Logout


### Modules

- [x] Tracking Module - Show live player location on map
- [x] zKill Module - Show recent kills around the player in sidebar and on map
- [x] Entosis Module - Show active entosis progress bars on systems, show timers in the next few hours as countdown
- [ ] Jump Bridge Module - Show Ansiblex connections on map
- [ ] Set Destination Module - Add "Set Destination" option to context menu
- [ ] More Information Module - Add extra information to map overlay (Deltas in NPC view, sov icons)
- [ ] Jump Range Module - Persistent jump range overlay, from system or from player location
