# media-converter-cli

A fast, zero-config CLI tool to convert MP4 files to MP3 — individually or in bulk.  
Bundles `ffmpeg` via `ffmpeg-static`, so no separate ffmpeg installation is needed.

## Installation

```bash
npm install -g media-converter-cli
```

## Usage

### Convert a single file

```bash
media-convert recording.mp4
```

### Convert a single file with options

```bash
media-convert recording.mp4 --output ./audio --bitrate 320k
```

### Bulk convert all MP4s in a folder

```bash
media-convert --folder ./meetings
```

### Bulk convert with a custom output folder

```bash
media-convert --folder ./meetings --output ./audio
```

### Recursive bulk conversion (includes subfolders)

```bash
media-convert --folder ./meetings --recursive
```

### Overwrite existing MP3 files

```bash
media-convert --folder ./meetings --overwrite
```

## Options

| Option                  | Description                                          | Default  |
|-------------------------|------------------------------------------------------|----------|
| `-f, --folder <path>`   | Folder containing MP4 files to convert in bulk       |          |
| `-o, --output <dir>`    | Output directory for converted MP3 files             | same as input |
| `-b, --bitrate <rate>`  | Audio bitrate: `128k`, `192k`, `320k`                | `192k`   |
| `-r, --recursive`       | Search for MP4 files recursively inside subfolders   | false    |
| `--overwrite`           | Overwrite existing MP3 files instead of skipping     | false    |
| `-V, --version`         | Output the version number                            |          |
| `-h, --help`            | Display help                                         |          |

## Requirements

- Node.js >= 14.0.0
- No system ffmpeg required — bundled automatically

## License

MIT
