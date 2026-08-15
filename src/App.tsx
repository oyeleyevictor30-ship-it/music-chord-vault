import { useState } from 'react';
import KeyboardVisualizer from './KeyboardVisualizer';

interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  audioUrl?: string;
  lyrics: { time: number; text: string; chord: string }[];
}

const SAMPLE_SONGS: Song[] = [
  {
    id: '1',
    title: 'Grace & Mercy',
    artist: 'Worship Vault',
    originalKey: 'C Major',
    lyrics: [
      { time: 0, text: 'Your grace and mercy brought me through', chord: 'C - G/B - Am' },
      { time: 5, text: 'I am living this moment because of You', chord: 'F - C/E - G' },
      { time: 10, text: 'I want to thank You and praise You too', chord: 'Am - F - G - C' },
    ]
  },
  {
    id: '2',
    title: 'Everlasting Light',
    artist: 'Music Chord Vault',
    originalKey: 'G Major',
    lyrics: [
      { time: 0, text: 'In the stillness of the night', chord: 'G - D - Em' },
      { time: 6, text: 'You shine Your everlasting light', chord: 'C - G - D' },
    ]
  }
];

export default function App() {
  const [selectedSong, setSelectedSong] = useState<Song>(SAMPLE_SONGS[0]);
  const [transposeKey, setTransposeKey] = useState<number>(0); // Semitones offset (-6 to +6)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const handleKeyTranspose = (direction: 'up' | 'down') => {
    setTransposeKey((prev) => (direction === 'up' ? prev + 1 : prev - 1));
  };

  const handleDownloadLyrics = () => {
    const content = selectedSong.lyrics
      .map((l) => `[${l.time}s] ${l.chord}\n${l.text}`)
      .join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSong.title.replace(/\s+/g, '_')}_Chords_Lyrics.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f1117',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #272730', paddingBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#60a5fa' }}>Music Chord Vault</h1>
          <span style={{ fontSize: '0.85rem', color: '#8a8a93' }}>Interactive Practice & Transposition Studio</span>
        </header>

        {/* Top Controls Panel: Song Selector & Transposer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#1e1e24', padding: '20px', borderRadius: '16px' }}>
          
          {/* Song Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#8a8a93', marginBottom: '8px' }}>Select Song from Vault</label>
            <select
              value={selectedSong.id}
              onChange={(e) => {
                const song = SAMPLE_SONGS.find((s) => s.id === e.target.value);
                if (song) setSelectedSong(song);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#121214',
                color: '#ffffff',
                border: '1px solid #272730',
                fontSize: '1rem',
                outline: 'none'
              }}
            >
              {SAMPLE_SONGS.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title} — {song.artist} ({song.originalKey})
                </option>
              ))}
            </select>
          </div>

          {/* Key / Pitch Transposer */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#8a8a93', marginBottom: '8px' }}>
              Key / Pitch Transposer
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => handleKeyTranspose('down')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#272730',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                -1 Semi
              </button>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#60a5fa', minWidth: '80px', textAlign: 'center' }}>
                {transposeKey === 0 ? 'Original' : `${transposeKey > 0 ? '+' : ''}${transposeKey} Semitones`}
              </span>
              <button
                onClick={() => handleKeyTranspose('up')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#272730',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                +1 Semi
              </button>
              <button
                onClick={() => setTransposeKey(0)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#8a8a93',
                  border: '1px solid #272730',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>
          </div>

        </div>

        {/* Synced Lyrics & Audio Player Panel */}
        <div style={{ background: '#1e1e24', padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedSong.title}</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#8a8a93' }}>
                Artist: {selectedSong.artist} | Key: {selectedSong.originalKey}
              </p>
            </div>

            <button
              onClick={handleDownloadLyrics}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📥 Download Synced Lyrics
            </button>
          </div>

          {/* Synced Lyrics List */}
          <div style={{ background: '#121214', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedSong.lyrics.map((item, idx) => (
              <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e1e24' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', display: 'block' }}>
                  {item.chord}
                </span>
                <span style={{ fontSize: '1rem', color: '#e4e4e7' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live MIDI Keyboard Visualizer Component */}
        <KeyboardVisualizer />

      </div>
    </div>
  );
}