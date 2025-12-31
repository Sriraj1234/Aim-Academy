# Sound Effects for AIM Academy

## Required Sound Files

Add the following sound files to this folder:

| File Name | Purpose | Recommended |
|-----------|---------|-------------|
| `correct.mp3` | Played on correct answer | Short positive chime (0.5-1s) |
| `wrong.mp3` | Played on wrong answer | Short negative buzz (0.5-1s) |
| `click.mp3` | Button click feedback | Very short click (0.1-0.3s) |
| `success.mp3` | Quiz completion | Victory fanfare (1-2s) |
| `countdown.mp3` | Timer warning (last 5s) | Tick-tock sound |
| `game-start.mp3` | Game/quiz begins | Energetic start (1-2s) |
| `level-up.mp3` | Level up / achievement | Celebratory (1-2s) |

## Free Sound Resources

You can download free sounds from:
- [Freesound.org](https://freesound.org)
- [Mixkit](https://mixkit.co/free-sound-effects/)
- [SoundBible](https://soundbible.com)
- [Zapsplat](https://www.zapsplat.com)

## File Format

- Format: MP3 (best compatibility)
- Sample Rate: 44.1kHz
- Bit Rate: 128-192kbps
- Duration: Keep short (under 2 seconds for effects)

## Quick Start (Using URL sounds)

If you want to use hosted sounds temporarily, update `hooks/useSound.ts`:

```typescript
const SOUNDS = {
    correct: 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3',
    wrong: 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
    // ... etc
};
```
