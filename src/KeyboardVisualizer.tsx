import { useState, useEffect } from 'react';

const START_NOTE = 36; // C2
const END_NOTE = 96;   // C7
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const blackKeyPattern = [false, true, false, true, false, false, true, false, true, false, true, false];

export default function KeyboardVisualizer() {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [pitchShift, setPitchShift] = useState<number>(0);
  const [displayReadout, setDisplayReadout] = useState<string>('—');
  const [pitchBendReadout, setPitchBendReadout] = useState<string>('Pitch Bend: Center (0)');
  const [status, setStatus] = useState<string>('Connecting MIDI...');

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setStatus('Web MIDI API not supported in this browser.');
      return;
    }

    navigator.requestMIDIAccess()
      .then((midiAccess) => {
        const inputs = midiAccess.inputs.values();
        let connected = false;

        for (const input of inputs) {
          connected = true;
          input.onmidimessage = handleMIDIMessage;
        }

        setStatus(connected ? '61-Key Keyboard Connected' : 'No MIDI Devices Detected');

        midiAccess.onstatechange = (e: any) => {
          if (e.port && e.port.type === 'input' && e.port.state === 'connected') {
            e.port.onmidimessage = handleMIDIMessage;
            setStatus(`Connected: ${e.port.name}`);
          }
        };
      })
      .catch(() => {
        setStatus('Failed to access MIDI devices.');
      });
  }, []);

  const handleMIDIMessage = (event: any) => {
    if (!event || !event.data) return;
    const [statusByte, data1, data2] = event.data;
    const command = statusByte & 0xf0;

    if (command === 144 && data2 > 0) {
      setActiveNotes((prev) => {
        const next = new Set(prev).add(data1);
        updateReadout(next);
        return next;
      });
    } else if (command === 128 || (command === 144 && data2 === 0)) {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(data1);
        updateReadout(next);
        return next;
      });
    } else if (command === 224) {
      const bendValue = (data2 << 7) | data1;
      const normalizedBend = bendValue - 8192;
      const shiftX = (normalizedBend / 8192) * 20;
      setPitchShift(shiftX);

      if (Math.abs(normalizedBend) < 100) {
        setPitchBendReadout('Pitch Bend: Center (0)');
      } else {
        setPitchBendReadout(`Pitch Bend: ${normalizedBend > 0 ? '+' : ''}${normalizedBend}`);
      }
    }
  };

  const updateReadout = (notesSet: Set<number>) => {
    if (notesSet.size === 0) {
      setDisplayReadout('—');
      return;
    }

    const notesArr = Array.from(notesSet).sort((a, b) => a - b);

    if (notesArr.length === 1) {
      const midi = notesArr[0];
      const name = NOTE_NAMES[midi % 12];
      const octave = Math.floor(midi / 12) - 1;
      setDisplayReadout(`${name}${octave}`);
    } else {
      const chordName = identifyChord(notesArr);
      if (chordName) {
        setDisplayReadout(chordName);
      } else {
        const noteNames = notesArr.map((n) => NOTE_NAMES[n % 12]);
        setDisplayReadout([...new Set(noteNames)].join(' - '));
      }
    }
  };

  const identifyChord = (notes: number[]): string | null => {
    const pitchClasses = [...new Set(notes.map((n) => n % 12))];

    const CHORD_FORMULAS = [
      { name: 'Major', intervals: [0, 4, 7] },
      { name: 'Minor', intervals: [0, 3, 7] },
      { name: '7th', intervals: [0, 4, 7, 10] },
      { name: 'Maj7', intervals: [0, 4, 7, 11] },
      { name: 'm7', intervals: [0, 3, 7, 10] },
      { name: 'Diminished', intervals: [0, 3, 6] },
      { name: 'Augmented', intervals: [0, 4, 8] },
      { name: 'Sus4', intervals: [0, 5, 7] },
      { name: 'Sus2', intervals: [0, 2, 7] }
    ];

    for (const rootPC of pitchClasses) {
      const relativeIntervals = pitchClasses
        .map((pc) => (pc - rootPC + 12) % 12)
        .sort((a, b) => a - b);

      for (const formula of CHORD_FORMULAS) {
        if (
          formula.intervals.length === relativeIntervals.length &&
          formula.intervals.every((val, index) => val === relativeIntervals[index])
        ) {
          return `${NOTE_NAMES[rootPC]} ${formula.name}`;
        }
      }
    }

    return null;
  };

  const keyElements = [];
  for (let note = START_NOTE; note <= END_NOTE; note++) {
    const isBlack = blackKeyPattern[note % 12];
    const isActive = activeNotes.has(note);

    keyElements.push(
      <div
        key={note}
        style={{
          position: 'relative',
          userSelect: 'none',
          borderRadius: '0 0 4px 4px',
          boxSizing: 'border-box',
          width: isBlack ? '18px' : '28px',
          height: isBlack ? '90px' : '150px',
          backgroundColor: isActive 
            ? (isBlack ? '#60a5fa' : '#3b82f6') 
            : (isBlack ? '#1a1a1a' : '#ffffff'),
          border: isBlack ? 'none' : '1px solid #ccc',
          marginLeft: isBlack ? '-9px' : '0',
          marginRight: isBlack ? '-9px' : '0',
          zIndex: isBlack ? 2 : 1,
          transition: 'background-color 0.05s ease'
        }}
      />
    );
  }

  return (
    <div style={{ background: '#1e1e24', padding: '20px', borderRadius: '16px', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#60a5fa' }}>Live Keyboard & Chord Visualizer</h3>
        <span style={{ fontSize: '0.8rem', color: '#8a8a93', background: '#272730', padding: '4px 12px', borderRadius: '12px' }}>
          {status}
        </span>
      </div>

      <div style={{ textAlign: 'center', padding: '16px', background: '#121214', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#60a5fa', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {displayReadout}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#8a8a93', marginTop: '4px' }}>
          {pitchBendReadout}
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
        <div style={{
          display: 'flex',
          position: 'relative',
          padding: '16px',
          background: '#121214',
          borderRadius: '12px',
          transform: `translateX(${pitchShift}px)`,
          transition: 'transform 0.05s linear'
        }}>
          {keyElements}
        </div>
      </div>
    </div>
  );
}