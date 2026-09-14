In the late 2000s, there was an online, flash-based social game called TinierMe. Though it contained gacha elements, which I despise as an adult but thought nothing of as a kid, it had a vibrant, alternative community that perfectly captured the counterculture of the internet at that time. There were people of all kinds, across cultures, who found connection there. There were many dress-up applications (DreamSelfy, etc.) using the original game's assets (largely because they were pay-walled and time-exclusive outside the alchemy feature and trading forums), but like TinierMe, they shut down as well sometime in the 2010s. Fortunately, due to archival efforts, EMSelfy was preserved. This project updates the original to get it working on modern systems.

The original Electron version distributed specific Windows .dll files. These are not included in the repository. Both versions work on Linux (as this is what I use and have tested), but I haven't tested on other systems. I assume without the .dll files the Electron version may crash or fail to load on Windows. Since this requires assets from the original archive, you could just copy those over as well. Regardless, you will need from it: `selfy.asar`, `selfy.db`. Drop these into either `emselfy-electron/` or `emselfy-tauri/`.

This project requires bun to be installed; for Tauri, you will need a Rust compiler toolchain installed as well. You can get bun from [https://bun.sh](https://bun.sh) and install the Rust toolchain from [https://rustup.rs](https://rustup.rs).

# Electron

```bash
cd emselfy-electron
bun install
bun start
```

# Tauri

```bash
cd emselfy-tauri
bun install
bun build-sidecar
bun start
```

All credit for the original game, assets, and concept goes to the original developers and artists of TinierMe and EMSelfy. I claim no ownership of any assets used in this project. You met me at a very Chinese time in my life.